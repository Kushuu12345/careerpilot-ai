import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type { ResumeAnalysisResult } from '../../src/types/index.js';

const GEMINI_MODEL = 'gemini-4-hydrogen';

const SectionScoresSchema = z.object({
  contact: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  technicalSkills: z.number().min(0).max(100),
  projects: z.number().min(0).max(100),
  experienceAndInternships: z.number().min(0).max(100),
  formattingAndClarity: z.number().min(0).max(100),
});

const ExtractedProfileSchema = z.object({
  contactInfo: z.array(z.string()).max(10),
  education: z.array(z.string()).max(10),
  technicalSkills: z.array(z.string()).max(60),
  projects: z.array(z.string()).max(15),
  internships: z.array(z.string()).max(15),
  certifications: z.array(z.string()).max(20),
  achievements: z.array(z.string()).max(20),
});

const GeminiResumeOutputSchema = z.object({
  sectionScores: SectionScoresSchema,
  extractedProfile: ExtractedProfileSchema,
  strengths: z.array(z.string()).max(15),
  weaknesses: z.array(z.string()).max(15),
  missingInformation: z.array(z.string()).max(15),
  missingSkills: z.array(z.string()).max(20),
  grammarAndFormattingSuggestions: z.array(z.string()).max(15),
  atsImprovementSuggestions: z.array(z.string()).max(15),
  actionableSuggestions: z.array(z.string()).max(15),
  topThreeImprovements: z.array(z.string()).min(1).max(3),
  scoringSummaryNote: z.string().min(10).max(600),
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
    throw new GeminiServiceError(
      'The Gemini API key is not configured on the server. Please check Settings > Secrets.',
      503,
      'API_KEY_MISSING'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export class GeminiServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'AI_ERROR') {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const SECTION_WEIGHTS = {
  contact: 0.1,
  education: 0.15,
  technicalSkills: 0.2,
  projects: 0.25,
  experienceAndInternships: 0.15,
  formattingAndClarity: 0.15,
} as const;

function clampInt(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function sanitizeStringList(items: string[], maxItems: number, maxLen: number): string[] {
  return items
    .map((item) => item.trim().replace(/\s+/g, ' '))
    .filter((item) => item.length > 0)
    .slice(0, maxItems)
    .map((item) => (item.length > maxLen ? `${item.slice(0, maxLen - 3)}...` : item));
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const errMsg = error instanceof Error ? error.message : String(error);
      const isRetryable =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('DEADLINE_EXCEEDED') ||
        errMsg.includes('ETIMEDOUT');

      if (!isRetryable || attempt === maxRetries) {
        break;
      }
      const delayMs = 800 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

/**
 * Analyzes extracted PDF resume text via Gemini and returns a strictly validated,
 * transparently scored ResumeAnalysisResult.
 */
export async function analyzeResumeWithGemini(params: {
  resumeText: string;
  targetRole: string;
  degreeBranch?: string;
}): Promise<ResumeAnalysisResult> {
  const { resumeText, targetRole, degreeBranch } = params;

  if (!resumeText || resumeText.trim().length < 80) {
    throw new GeminiServiceError(
      'Resume text is too short to analyze reliably.',
      400,
      'INVALID_INPUT'
    );
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are CareerPilot AI, an honest, strict, and constructive campus placement coach for B.Tech students and fresh graduates.

STRICT EVIDENCE & HONESTY RULES (NON-NEGOTIABLE):
1. NEVER invent, infer, or hallucinate any skills, projects, internships, certifications, grades, or achievements that do not explicitly appear in the provided resume text.
2. If a category (such as internships, certifications, achievements, or contact links) is not present in the resume text, return an empty array [] for that field in extractedProfile AND clearly report it in missingInformation.
3. Base every single strength, weakness, and suggestion directly on the uploaded resume text.
4. Do NOT claim to compute a real company ATS score. We compute an AI placement-readiness rubric score based on 6 weighted sections: Contact (10%), Education (15%), Technical Skills (20%), Projects (25%), Experience & Internships (15%), Formatting & Clarity (15%).
5. Score each section from 0 to 100 fairly for a college placement candidate:
   - Missing section = 0 to 20 depending on whether partial mentions exist.
   - Basic / vague section = 40 to 65.
   - Clear, well-structured section with specific tools and measurable impact = 75 to 95.
6. Provide concise, practical, beginner-friendly feedback tailored to the student's target role (${targetRole}).
7. Keep every array item concise (1-2 sentences max) and return strictly valid JSON matching the schema.`;

  const userPrompt = `Analyze the following student resume text for campus placement readiness.

Target Job Role: ${targetRole}
${degreeBranch ? `Student Degree / Branch: ${degreeBranch}` : ''}

--- START OF EXTRACTED RESUME TEXT ---
${resumeText}
--- END OF EXTRACTED RESUME TEXT ---`;

  try {
    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sectionScores: {
                type: Type.OBJECT,
                properties: {
                  contact: { type: Type.INTEGER, description: '0-100 score for contact details & professional links.' },
                  education: { type: Type.INTEGER, description: '0-100 score for education, degree, CGPA/grades, and timeline.' },
                  technicalSkills: { type: Type.INTEGER, description: '0-100 score for relevance and clarity of technical skills.' },
                  projects: { type: Type.INTEGER, description: '0-100 score for technical depth, tech stack, and measurable project impact.' },
                  experienceAndInternships: { type: Type.INTEGER, description: '0-100 score for internships, work experience, or relevant campus roles.' },
                  formattingAndClarity: { type: Type.INTEGER, description: '0-100 score for readability, grammar, action verbs, and structure.' },
                },
                required: [
                  'contact',
                  'education',
                  'technicalSkills',
                  'projects',
                  'experienceAndInternships',
                  'formattingAndClarity',
                ],
              },
              extractedProfile: {
                type: Type.OBJECT,
                properties: {
                  contactInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
                  education: { type: Type.ARRAY, items: { type: Type.STRING } },
                  technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  internships: { type: Type.ARRAY, items: { type: Type.STRING } },
                  certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
                  achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'contactInfo',
                  'education',
                  'technicalSkills',
                  'projects',
                  'internships',
                  'certifications',
                  'achievements',
                ],
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              grammarAndFormattingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              atsImprovementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionableSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              topThreeImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
              scoringSummaryNote: {
                type: Type.STRING,
                description: 'Brief 2-3 sentence note summarizing the key factors that raised or lowered this resume score.',
              },
            },
            required: [
              'sectionScores',
              'extractedProfile',
              'strengths',
              'weaknesses',
              'missingInformation',
              'missingSkills',
              'grammarAndFormattingSuggestions',
              'atsImprovementSuggestions',
              'actionableSuggestions',
              'topThreeImprovements',
              'scoringSummaryNote',
            ],
          },
        },
      })
    );

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new GeminiServiceError('Gemini returned an empty response. Please try again.', 502, 'EMPTY_RESPONSE');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      throw new GeminiServiceError(
        'The AI response could not be parsed as structured JSON. Please retry.',
        502,
        'INVALID_JSON'
      );
    }

    const validated = GeminiResumeOutputSchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new GeminiServiceError(
        'The AI response did not match the expected resume analysis structure. Please retry.',
        502,
        'SCHEMA_VALIDATION_FAILED'
      );
    }

    const data = validated.data;

    // Normalize and clamp all section scores to strict integers [0..100]
    const sectionScores = {
      contact: clampInt(data.sectionScores.contact, 0, 100),
      education: clampInt(data.sectionScores.education, 0, 100),
      technicalSkills: clampInt(data.sectionScores.technicalSkills, 0, 100),
      projects: clampInt(data.sectionScores.projects, 0, 100),
      experienceAndInternships: clampInt(data.sectionScores.experienceAndInternships, 0, 100),
      formattingAndClarity: clampInt(data.sectionScores.formattingAndClarity, 0, 100),
    };

    // Deterministically compute weighted overall score so scoring is 100% transparent
    const overallScore = clampInt(
      sectionScores.contact * SECTION_WEIGHTS.contact +
        sectionScores.education * SECTION_WEIGHTS.education +
        sectionScores.technicalSkills * SECTION_WEIGHTS.technicalSkills +
        sectionScores.projects * SECTION_WEIGHTS.projects +
        sectionScores.experienceAndInternships * SECTION_WEIGHTS.experienceAndInternships +
        sectionScores.formattingAndClarity * SECTION_WEIGHTS.formattingAndClarity,
      0,
      100
    );

    const baseExplanation =
      `Calculated as a weighted placement-readiness rubric (not an official employer ATS score): ` +
      `Projects (25%), Technical Skills (20%), Education (15%), Experience & Internships (15%), Formatting & Clarity (15%), and Contact Info (10%). ` +
      data.scoringSummaryNote.trim();

    const scoringMethodology =
      baseExplanation.length > 1180 ? `${baseExplanation.slice(0, 1177)}...` : baseExplanation;

    return {
      overallScore,
      scoringMethodology,
      sectionScores,
      extractedProfile: {
        contactInfo: sanitizeStringList(data.extractedProfile.contactInfo, 10, 190),
        education: sanitizeStringList(data.extractedProfile.education, 10, 340),
        technicalSkills: sanitizeStringList(data.extractedProfile.technicalSkills, 60, 110),
        projects: sanitizeStringList(data.extractedProfile.projects, 15, 480),
        internships: sanitizeStringList(data.extractedProfile.internships, 15, 480),
        certifications: sanitizeStringList(data.extractedProfile.certifications, 20, 290),
        achievements: sanitizeStringList(data.extractedProfile.achievements, 20, 340),
      },
      strengths: sanitizeStringList(data.strengths, 15, 480),
      weaknesses: sanitizeStringList(data.weaknesses, 15, 480),
      missingInformation: sanitizeStringList(data.missingInformation, 15, 480),
      missingSkills: sanitizeStringList(data.missingSkills, 20, 150),
      grammarAndFormattingSuggestions: sanitizeStringList(data.grammarAndFormattingSuggestions, 15, 480),
      atsImprovementSuggestions: sanitizeStringList(data.atsImprovementSuggestions, 15, 480),
      actionableSuggestions: sanitizeStringList(data.actionableSuggestions, 15, 480),
      topThreeImprovements: sanitizeStringList(data.topThreeImprovements, 3, 480),
    };
  } catch (error: unknown) {
    if (error instanceof GeminiServiceError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED') || message.includes('403')) {
      throw new GeminiServiceError(
        'Gemini API authentication failed. Please check your GEMINI_API_KEY in Settings > Secrets.',
        403,
        'API_KEY_INVALID'
      );
    }
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      throw new GeminiServiceError(
        'The AI service rate limit was reached. Please wait a minute and try again.',
        429,
        'RATE_LIMITED'
      );
    }
    if (message.includes('NOT_FOUND') || message.includes('404')) {
      throw new GeminiServiceError(
        'The configured Gemini model could not be reached. Please try again later.',
        502,
        'MODEL_NOT_FOUND'
      );
    }

    throw new GeminiServiceError(
      'Unable to complete resume analysis right now. Please try again in a moment.',
      502,
      'UPSTREAM_ERROR'
    );
  }
}

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type {
  InterviewRecord,
  JobMatchRecord,
  PracticeResultRecord,
  ResumeAnalysisRecord,
  ResumeAnalysisResult,
  RoadmapRecord,
  StudentProfile,
} from '../types';

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

function clampStr(value: string, maxLen: number): string {
  const trimmed = value.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function clampList(items: string[], maxItems: number, maxItemLen: number): string[] {
  return items
    .map((item) => clampStr(String(item), maxItemLen))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function clampInt(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

// ---------------------------------------------------------------------------
// Student Profiles (/users/{userId})
// ---------------------------------------------------------------------------

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      userId: String(data.userId),
      fullName: String(data.fullName),
      email: String(data.email),
      collegeName: String(data.collegeName),
      degreeBranch: String(data.degreeBranch),
      graduationYear: Number(data.graduationYear),
      targetJobRole: String(data.targetJobRole),
      createdAt: timestampToIso(data.createdAt),
      updatedAt: timestampToIso(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createStudentProfile(
  uid: string,
  payload: {
    fullName: string;
    email: string;
    collegeName: string;
    degreeBranch: string;
    graduationYear: number;
    targetJobRole: string;
  }
): Promise<StudentProfile> {
  const path = `users/${uid}`;
  const sanitized = {
    userId: uid,
    fullName: clampStr(payload.fullName, 120),
    email: clampStr(payload.email, 254),
    collegeName: clampStr(payload.collegeName, 180),
    degreeBranch: clampStr(payload.degreeBranch, 140),
    graduationYear: clampInt(payload.graduationYear, 2020, 2035),
    targetJobRole: clampStr(payload.targetJobRole, 120),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', uid), sanitized);
    const nowIso = new Date().toISOString();
    return {
      userId: sanitized.userId,
      fullName: sanitized.fullName,
      email: sanitized.email,
      collegeName: sanitized.collegeName,
      degreeBranch: sanitized.degreeBranch,
      graduationYear: sanitized.graduationYear,
      targetJobRole: sanitized.targetJobRole,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStudentProfile(
  uid: string,
  payload: {
    fullName: string;
    collegeName: string;
    degreeBranch: string;
    graduationYear: number;
    targetJobRole: string;
  }
): Promise<void> {
  const path = `users/${uid}`;
  const sanitized = {
    fullName: clampStr(payload.fullName, 120),
    collegeName: clampStr(payload.collegeName, 180),
    degreeBranch: clampStr(payload.degreeBranch, 140),
    graduationYear: clampInt(payload.graduationYear, 2020, 2035),
    targetJobRole: clampStr(payload.targetJobRole, 120),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, 'users', uid), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Resume Analyses (/resumes/{resumeId})
// ---------------------------------------------------------------------------

export async function saveResumeAnalysis(
  uid: string,
  params: {
    fileName: string;
    fileSizeBytes: number;
    targetRole: string;
    extractedTextPreview: string;
    analysis: ResumeAnalysisResult;
  }
): Promise<ResumeAnalysisRecord> {
  const newDocRef = doc(collection(db, 'resumes'));
  const path = `resumes/${newDocRef.id}`;

  const { analysis } = params;
  const sanitizedDoc = {
    userId: uid,
    fileName: clampStr(params.fileName || 'resume.pdf', 255),
    fileSizeBytes: clampInt(params.fileSizeBytes, 1, 5242880),
    targetRole: clampStr(params.targetRole || 'Software Development Engineer', 120),
    extractedTextPreview: clampStr(params.extractedTextPreview || 'Extracted text preview', 4000),
    overallScore: clampInt(analysis.overallScore, 0, 100),
    scoringMethodology: clampStr(
      analysis.scoringMethodology.length >= 10
        ? analysis.scoringMethodology
        : 'Calculated using CareerPilot AI placement-readiness section weights.',
      1200
    ),
    sectionScores: {
      contact: clampInt(analysis.sectionScores.contact, 0, 100),
      education: clampInt(analysis.sectionScores.education, 0, 100),
      technicalSkills: clampInt(analysis.sectionScores.technicalSkills, 0, 100),
      projects: clampInt(analysis.sectionScores.projects, 0, 100),
      experienceAndInternships: clampInt(analysis.sectionScores.experienceAndInternships, 0, 100),
      formattingAndClarity: clampInt(analysis.sectionScores.formattingAndClarity, 0, 100),
    },
    extractedProfile: {
      contactInfo: clampList(analysis.extractedProfile.contactInfo, 10, 200),
      education: clampList(analysis.extractedProfile.education, 10, 350),
      technicalSkills: clampList(analysis.extractedProfile.technicalSkills, 60, 120),
      projects: clampList(analysis.extractedProfile.projects, 15, 500),
      internships: clampList(analysis.extractedProfile.internships, 15, 500),
      certifications: clampList(analysis.extractedProfile.certifications, 20, 300),
      achievements: clampList(analysis.extractedProfile.achievements, 20, 350),
    },
    strengths: clampList(analysis.strengths, 15, 500),
    weaknesses: clampList(analysis.weaknesses, 15, 500),
    missingInformation: clampList(analysis.missingInformation, 15, 500),
    missingSkills: clampList(analysis.missingSkills, 20, 160),
    grammarAndFormattingSuggestions: clampList(analysis.grammarAndFormattingSuggestions, 15, 500),
    atsImprovementSuggestions: clampList(analysis.atsImprovementSuggestions, 15, 500),
    actionableSuggestions: clampList(analysis.actionableSuggestions, 15, 500),
    topThreeImprovements: clampList(analysis.topThreeImprovements, 3, 500),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(newDocRef, sanitizedDoc);
    return {
      id: newDocRef.id,
      userId: sanitizedDoc.userId,
      fileName: sanitizedDoc.fileName,
      fileSizeBytes: sanitizedDoc.fileSizeBytes,
      targetRole: sanitizedDoc.targetRole,
      extractedTextPreview: sanitizedDoc.extractedTextPreview,
      overallScore: sanitizedDoc.overallScore,
      scoringMethodology: sanitizedDoc.scoringMethodology,
      sectionScores: sanitizedDoc.sectionScores,
      extractedProfile: sanitizedDoc.extractedProfile,
      strengths: sanitizedDoc.strengths,
      weaknesses: sanitizedDoc.weaknesses,
      missingInformation: sanitizedDoc.missingInformation,
      missingSkills: sanitizedDoc.missingSkills,
      grammarAndFormattingSuggestions: sanitizedDoc.grammarAndFormattingSuggestions,
      atsImprovementSuggestions: sanitizedDoc.atsImprovementSuggestions,
      actionableSuggestions: sanitizedDoc.actionableSuggestions,
      topThreeImprovements: sanitizedDoc.topThreeImprovements,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToStudentResumes(
  uid: string,
  onData: (resumes: ResumeAnalysisRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'resumes';
  const q = query(collection(db, path), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ResumeAnalysisRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(d.userId),
          fileName: String(d.fileName),
          fileSizeBytes: Number(d.fileSizeBytes || 0),
          targetRole: String(d.targetRole || ''),
          extractedTextPreview: String(d.extractedTextPreview || ''),
          overallScore: Number(d.overallScore || 0),
          scoringMethodology: String(d.scoringMethodology || ''),
          sectionScores: {
            contact: Number(d.sectionScores?.contact || 0),
            education: Number(d.sectionScores?.education || 0),
            technicalSkills: Number(d.sectionScores?.technicalSkills || 0),
            projects: Number(d.sectionScores?.projects || 0),
            experienceAndInternships: Number(d.sectionScores?.experienceAndInternships || 0),
            formattingAndClarity: Number(d.sectionScores?.formattingAndClarity || 0),
          },
          extractedProfile: {
            contactInfo: Array.isArray(d.extractedProfile?.contactInfo) ? d.extractedProfile.contactInfo : [],
            education: Array.isArray(d.extractedProfile?.education) ? d.extractedProfile.education : [],
            technicalSkills: Array.isArray(d.extractedProfile?.technicalSkills) ? d.extractedProfile.technicalSkills : [],
            projects: Array.isArray(d.extractedProfile?.projects) ? d.extractedProfile.projects : [],
            internships: Array.isArray(d.extractedProfile?.internships) ? d.extractedProfile.internships : [],
            certifications: Array.isArray(d.extractedProfile?.certifications) ? d.extractedProfile.certifications : [],
            achievements: Array.isArray(d.extractedProfile?.achievements) ? d.extractedProfile.achievements : [],
          },
          strengths: Array.isArray(d.strengths) ? d.strengths : [],
          weaknesses: Array.isArray(d.weaknesses) ? d.weaknesses : [],
          missingInformation: Array.isArray(d.missingInformation) ? d.missingInformation : [],
          missingSkills: Array.isArray(d.missingSkills) ? d.missingSkills : [],
          grammarAndFormattingSuggestions: Array.isArray(d.grammarAndFormattingSuggestions)
            ? d.grammarAndFormattingSuggestions
            : [],
          atsImprovementSuggestions: Array.isArray(d.atsImprovementSuggestions)
            ? d.atsImprovementSuggestions
            : [],
          actionableSuggestions: Array.isArray(d.actionableSuggestions) ? d.actionableSuggestions : [],
          topThreeImprovements: Array.isArray(d.topThreeImprovements) ? d.topThreeImprovements : [],
          createdAt: timestampToIso(d.createdAt),
        };
      });

      // Sort newest first in client memory to avoid requiring composite Firestore indexes
      records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function deleteResumeAnalysis(resumeId: string): Promise<void> {
  const path = `resumes/${resumeId}`;
  try {
    await deleteDoc(doc(db, 'resumes', resumeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Student Collections for Dashboard Metrics (Real DB queries, zero fake data)
// ---------------------------------------------------------------------------

export async function getStudentModuleRecords(uid: string): Promise<{
  jobMatches: JobMatchRecord[];
  interviews: InterviewRecord[];
  roadmaps: RoadmapRecord[];
  practiceResults: PracticeResultRecord[];
}> {
  const fetchCollection = async <T>(
    collectionName: string,
    mapper: (id: string, d: Record<string, unknown>) => T
  ): Promise<T[]> => {
    try {
      const q = query(collection(db, collectionName), where('userId', '==', uid));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => mapper(docSnap.id, docSnap.data()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  };

  const [jobMatches, interviews, roadmaps, practiceResults] = await Promise.all([
    fetchCollection<JobMatchRecord>('jobMatches', (id, d) => ({
      id,
      userId: String(d.userId),
      resumeId: String(d.resumeId),
      jobTitle: String(d.jobTitle),
      companyName: String(d.companyName),
      matchScore: Number(d.matchScore || 0),
      status: d.status === 'analyzed' ? 'analyzed' : 'draft',
      createdAt: timestampToIso(d.createdAt),
    })),
    fetchCollection<InterviewRecord>('interviews', (id, d) => ({
      id,
      userId: String(d.userId),
      targetRole: String(d.targetRole),
      difficulty:
        d.difficulty === 'advanced'
          ? 'advanced'
          : d.difficulty === 'intermediate'
            ? 'intermediate'
            : 'beginner',
      status: d.status === 'completed' ? 'completed' : 'in_progress',
      score: Number(d.score || 0),
      createdAt: timestampToIso(d.createdAt),
      updatedAt: timestampToIso(d.updatedAt),
    })),
    fetchCollection<RoadmapRecord>('roadmaps', (id, d) => ({
      id,
      userId: String(d.userId),
      targetRole: String(d.targetRole),
      completionPercentage: Number(d.completionPercentage || 0),
      totalMilestones: Number(d.totalMilestones || 0),
      completedMilestones: Number(d.completedMilestones || 0),
      status: d.status === 'completed' ? 'completed' : 'active',
      createdAt: timestampToIso(d.createdAt),
      updatedAt: timestampToIso(d.updatedAt),
    })),
    fetchCollection<PracticeResultRecord>('practiceResults', (id, d) => ({
      id,
      userId: String(d.userId),
      topic: String(d.topic),
      score: Number(d.score || 0),
      totalQuestions: Number(d.totalQuestions || 1),
      status: 'completed',
      createdAt: timestampToIso(d.createdAt),
    })),
  ]);

  return { jobMatches, interviews, roadmaps, practiceResults };
}

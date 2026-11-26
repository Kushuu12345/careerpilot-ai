export interface StudentProfile {
  userId: string;
  fullName: string;
  email: string;
  collegeName: string;
  degreeBranch: string;
  graduationYear: number;
  targetJobRole: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SectionScores {
  contact: number;
  education: number;
  technicalSkills: number;
  projects: number;
  experienceAndInternships: number;
  formattingAndClarity: number;
}

export interface ExtractedResumeProfile {
  contactInfo: string[];
  education: string[];
  technicalSkills: string[];
  projects: string[];
  internships: string[];
  certifications: string[];
  achievements: string[];
}

export interface ResumeAnalysisResult {
  overallScore: number;
  scoringMethodology: string;
  sectionScores: SectionScores;
  extractedProfile: ExtractedResumeProfile;
  strengths: string[];
  weaknesses: string[];
  missingInformation: string[];
  missingSkills: string[];
  grammarAndFormattingSuggestions: string[];
  atsImprovementSuggestions: string[];
  actionableSuggestions: string[];
  topThreeImprovements: string[];
}

export interface ResumeAnalysisRecord extends ResumeAnalysisResult {
  id: string;
  userId: string;
  fileName: string;
  fileSizeBytes: number;
  targetRole: string;
  extractedTextPreview: string;
  createdAt: string;
}

export interface JobMatchRecord {
  id: string;
  userId: string;
  resumeId: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  status: 'draft' | 'analyzed';
  createdAt: string;
}

export interface InterviewRecord {
  id: string;
  userId: string;
  targetRole: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'in_progress' | 'completed';
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapRecord {
  id: string;
  userId: string;
  targetRole: string;
  completionPercentage: number;
  totalMilestones: number;
  completedMilestones: number;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface PracticeResultRecord {
  id: string;
  userId: string;
  topic: string;
  score: number;
  totalQuestions: number;
  status: 'completed';
  createdAt: string;
}

export type DashboardSection =
  | 'overview'
  | 'resume-analyzer'
  | 'job-matcher'
  | 'mock-interview'
  | 'learning-roadmap'
  | 'practice-arena'
  | 'profile'
  | 'settings';

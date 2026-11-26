import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Code2,
  Database,
  Map,
  MessageSquare,
} from 'lucide-react';

interface UpcomingModulePageProps {
  moduleId: 'job-matcher' | 'mock-interview' | 'learning-roadmap' | 'practice-arena';
  onGoToResumeAnalyzer: () => void;
}

const MODULE_META: Record<
  UpcomingModulePageProps['moduleId'],
  {
    title: string;
    firestoreCollection: string;
    icon: React.ComponentType<{ className?: string }>;
    summary: string;
    plannedCapabilities: string[];
  }
> = {
  'job-matcher': {
    title: 'Job Description Matcher',
    firestoreCollection: 'jobMatches',
    icon: Briefcase,
    summary:
      'This module is currently in development. Once released, you will be able to paste a campus job description and compare it directly against any resume saved in your Resume Analyzer history.',
    plannedCapabilities: [
      'Side-by-side keyword and requirement coverage against your uploaded resume.',
      'Honest identification of missing technologies, coursework, or project evidence for a specific role.',
      'Tailored bullet-point rewrite suggestions grounded strictly in your real experience.',
      'Saved job match history stored privately in your Firestore jobMatches collection.',
    ],
  },
  'mock-interview': {
    title: 'AI Mock Interview',
    firestoreCollection: 'interviews',
    icon: MessageSquare,
    summary:
      'This module is currently in development. Once released, you will be able to run structured technical, project deep-dive, and HR interview rounds tailored to your branch and resume.',
    plannedCapabilities: [
      'Role-specific questions grounded in the projects and technical skills from your analyzed resume.',
      'Difficulty tiers for beginner, intermediate, and campus placement final rounds.',
      'Structured feedback on clarity, technical accuracy, and STAR-method communication.',
      'Completed session scores automatically reflected on your Overview dashboard via Firestore.',
    ],
  },
  'learning-roadmap': {
    title: 'Personalized Learning Roadmap',
    firestoreCollection: 'roadmaps',
    icon: Map,
    summary:
      'This module is currently in development. Once released, CareerPilot AI will convert your resume skill gaps and graduation timeline into a structured weekly preparation plan.',
    plannedCapabilities: [
      'Milestone-by-milestone study tracks aligned with your target job role and missing skills.',
      'Real progress tracking with milestone check-offs stored in your Firestore roadmaps collection.',
      'Suggested portfolio project ideas to fill experience gaps before placement season.',
      'Live roadmap completion percentage synced directly to your Overview dashboard.',
    ],
  },
  'practice-arena': {
    title: 'Practice Arena',
    firestoreCollection: 'practiceResults',
    icon: Code2,
    summary:
      'This module is currently in development. Once released, you will be able to practice timed placement assessments across DSA, core CS fundamentals, and role-specific problem sets.',
    plannedCapabilities: [
      'Topic-focused quizzes covering Data Structures, DBMS, Operating Systems, Networks, and OOP.',
      'Role-aligned coding and system design drills tailored to your degree branch.',
      'Score history persisted in your Firestore practiceResults collection to measure growth over time.',
      'Direct links from missed practice questions back to your Learning Roadmap.',
    ],
  },
};

export const UpcomingModulePage: React.FC<UpcomingModulePageProps> = ({
  moduleId,
  onGoToResumeAnalyzer,
}) => {
  const meta = MODULE_META[moduleId];
  const Icon = meta.icon;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-[#0F172A] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6D28D9]">Upcoming Module · In Development</p>
            <h2 className="text-2xl font-bold text-[#0F172A]">{meta.title}</h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">{meta.summary}</p>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">What is planned for this module</h3>
          <ul className="space-y-2.5">
            {meta.plannedCapabilities.map((cap, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="font-mono text-xs text-[#2563EB] mt-0.5 shrink-0">
                  0{idx + 1}.
                </span>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-[#F8FAFC] border border-slate-200/80 flex items-start gap-3">
          <Database className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Your Firestore schema and owner-only security rules for the{' '}
            <code className="font-mono text-[#0F172A]">{meta.firestoreCollection}</code> collection
            are already configured and secured. No dummy records or fake AI results are shown while
            this module is under construction.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Want to prepare now? Start by auditing your current resume.
          </p>
          <button
            type="button"
            onClick={onGoToResumeAnalyzer}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Go to Resume Analyzer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

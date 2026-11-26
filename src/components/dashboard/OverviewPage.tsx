import React from 'react';
import {
  ArrowRight,
  Clock,
  FileSearch,
  FileText,
  Target,
  UserCheck,
} from 'lucide-react';
import type {
  DashboardSection,
  InterviewRecord,
  JobMatchRecord,
  PracticeResultRecord,
  ResumeAnalysisRecord,
  RoadmapRecord,
  StudentProfile,
} from '../../types';
import { formatFriendlyDate } from '../../lib/validation';

interface OverviewPageProps {
  profile: StudentProfile;
  resumes: ResumeAnalysisRecord[];
  interviews: InterviewRecord[];
  roadmaps: RoadmapRecord[];
  jobMatches: JobMatchRecord[];
  practiceResults: PracticeResultRecord[];
  loading: boolean;
  onNavigate: (section: DashboardSection) => void;
  onSelectResume: (resumeId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  profile,
  resumes,
  interviews,
  roadmaps,
  jobMatches,
  practiceResults,
  loading,
  onNavigate,
  onSelectResume,
}) => {
  const latestResume = resumes[0] || null;

  // Real Firestore metrics — never fabricated
  const latestResumeScore = latestResume ? latestResume.overallScore : null;
  const completedInterviewsCount = interviews.filter((i) => i.status === 'completed').length;

  const uniqueSkills = new Set<string>();
  if (latestResume) {
    latestResume.extractedProfile.technicalSkills.forEach((s) => uniqueSkills.add(s));
  }
  const skillsIdentifiedCount = uniqueSkills.size;

  const activeRoadmap = roadmaps[0] || null;
  const roadmapCompletionPct = activeRoadmap ? activeRoadmap.completionPercentage : null;

  // Build real chronological activity log from actual Firestore records
  const recentActivities: Array<{
    id: string;
    title: string;
    detail: string;
    date: string;
    action?: () => void;
  }> = [];

  resumes.slice(0, 5).forEach((res) => {
    recentActivities.push({
      id: `resume-${res.id}`,
      title: `Analyzed ${res.fileName}`,
      detail: `Score ${res.overallScore}/100 · Target: ${res.targetRole}`,
      date: res.createdAt,
      action: () => onSelectResume(res.id),
    });
  });

  interviews.slice(0, 3).forEach((item) => {
    recentActivities.push({
      id: `interview-${item.id}`,
      title: `Mock Interview (${item.targetRole})`,
      detail: `Status: ${item.status} · Score ${item.score}/100`,
      date: item.createdAt,
    });
  });

  jobMatches.slice(0, 3).forEach((item) => {
    recentActivities.push({
      id: `match-${item.id}`,
      title: `Job Match: ${item.jobTitle} at ${item.companyName}`,
      detail: `Match score ${item.matchScore}/100`,
      date: item.createdAt,
    });
  });

  practiceResults.slice(0, 3).forEach((item) => {
    recentActivities.push({
      id: `practice-${item.id}`,
      title: `Practice Test: ${item.topic}`,
      detail: `${item.score}/${item.totalQuestions} correct`,
      date: item.createdAt,
    });
  });

  if (profile.createdAt) {
    recentActivities.push({
      id: 'profile-created',
      title: 'Student profile created',
      detail: `${profile.degreeBranch} · ${profile.collegeName}`,
      date: profile.createdAt,
    });
  }

  recentActivities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Build grounded recommended next steps from real student state
  const nextSteps: Array<{
    title: string;
    description: string;
    ctaLabel: string;
    onClick: () => void;
  }> = [];

  if (!latestResume) {
    nextSteps.push({
      title: 'Upload your first PDF resume',
      description:
        'Run a full 6-section readiness audit to establish your baseline score and uncover missing information.',
      ctaLabel: 'Open Resume Analyzer',
      onClick: () => onNavigate('resume-analyzer'),
    });
  } else {
    if (latestResume.topThreeImprovements.length > 0) {
      nextSteps.push({
        title: 'Apply your top resume recommendation',
        description: latestResume.topThreeImprovements[0],
        ctaLabel: 'Review Full Analysis',
        onClick: () => onSelectResume(latestResume.id),
      });
    }
    if (latestResume.missingSkills.length > 0) {
      nextSteps.push({
        title: `Close ${latestResume.missingSkills.length} role skill gaps`,
        description: `Missing skills identified for ${latestResume.targetRole}: ${latestResume.missingSkills
          .slice(0, 4)
          .join(', ')}.`,
        ctaLabel: 'Inspect Skill Gaps',
        onClick: () => onSelectResume(latestResume.id),
      });
    }
    nextSteps.push({
      title: 'Upload an updated revision',
      description:
        'After updating your resume based on the audit feedback, re-upload your PDF to track score improvements.',
      ctaLabel: 'Analyze New PDF',
      onClick: () => onNavigate('resume-analyzer'),
    });
  }

  nextSteps.push({
    title: 'Keep your placement profile up to date',
    description: `Current target role: ${profile.targetJobRole} · Class of ${profile.graduationYear}.`,
    ctaLabel: 'Edit Profile',
    onClick: () => onNavigate('profile'),
  });

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">
            {profile.collegeName} · {profile.degreeBranch}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Welcome, {profile.fullName.split(' ')[0]}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('resume-analyzer')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <FileSearch className="w-4 h-4" />
          Upload Resume for Audit
        </button>
      </div>

      {/* 4 Real-Data KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Resume Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 mb-2">Latest Resume Score</p>
          {loading ? (
            <div className="h-9 w-24 bg-slate-100 rounded animate-pulse" />
          ) : latestResumeScore !== null ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-[#0F172A] font-mono tabular-nums">
                {latestResumeScore}
              </span>
              <span className="text-sm text-slate-400 font-mono">/100</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-slate-400 font-mono tabular-nums">—</p>
          )}
          <p className="text-xs text-slate-500 mt-2 truncate">
            {latestResume
              ? `${resumes.length} ${resumes.length === 1 ? 'analysis' : 'analyses'} saved`
              : 'No resume uploaded yet'}
          </p>
        </div>

        {/* Widget 2: Completed Interviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 mb-2">Completed Interviews</p>
          {loading ? (
            <div className="h-9 w-16 bg-slate-100 rounded animate-pulse" />
          ) : (
            <span className="text-3xl font-bold text-[#0F172A] font-mono tabular-nums">
              {completedInterviewsCount}
            </span>
          )}
          <p className="text-xs text-slate-500 mt-2">
            {completedInterviewsCount > 0
              ? 'Recorded in Firestore'
              : 'Mock Interview module upcoming'}
          </p>
        </div>

        {/* Widget 3: Skills Identified */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 mb-2">Skills Identified</p>
          {loading ? (
            <div className="h-9 w-16 bg-slate-100 rounded animate-pulse" />
          ) : (
            <span className="text-3xl font-bold text-[#0F172A] font-mono tabular-nums">
              {skillsIdentifiedCount}
            </span>
          )}
          <p className="text-xs text-slate-500 mt-2">
            {latestResume
              ? 'Extracted from latest PDF'
              : 'Upload a resume to extract skills'}
          </p>
        </div>

        {/* Widget 4: Roadmap Completion % */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 mb-2">Roadmap Completion</p>
          {loading ? (
            <div className="h-9 w-20 bg-slate-100 rounded animate-pulse" />
          ) : roadmapCompletionPct !== null ? (
            <span className="text-3xl font-bold text-[#0F172A] font-mono tabular-nums">
              {roadmapCompletionPct}%
            </span>
          ) : (
            <span className="text-3xl font-bold text-slate-400 font-mono tabular-nums">0%</span>
          )}
          <p className="text-xs text-slate-500 mt-2">
            {activeRoadmap
              ? `${activeRoadmap.completedMilestones}/${activeRoadmap.totalMilestones} milestones`
              : 'Learning Roadmap module upcoming'}
          </p>
        </div>
      </div>

      {/* Main 2-Column Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recommended Next Steps */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Recommended Next Steps</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generated directly from your profile and latest resume data
              </p>
            </div>
            <Target className="w-4 h-4 text-[#6D28D9]" />
          </div>

          <div className="divide-y divide-slate-100">
            {nextSteps.slice(0, 3).map((step, index) => (
              <div
                key={step.title}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    <span className="font-mono text-xs text-[#2563EB] mr-2">
                      0{index + 1}.
                    </span>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={step.onClick}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {step.ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activities */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Recent Activities</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real database history</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No activities recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Upload a resume to start tracking your placement progress.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivities.slice(0, 6).map((act) => (
                <li key={act.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {act.action ? (
                        <button
                          type="button"
                          onClick={act.action}
                          className="text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] text-left truncate block max-w-full cursor-pointer"
                        >
                          {act.title}
                        </button>
                      ) : (
                        <p className="text-sm font-semibold text-[#0F172A] truncate">
                          {act.title}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{act.detail}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                      {formatFriendlyDate(act.date)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Latest Resume Snapshot (if available) */}
      {latestResume && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Latest Analyzed Resume · {formatFriendlyDate(latestResume.createdAt)}
              </p>
              <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                {latestResume.fileName}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectResume(latestResume.id)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap cursor-pointer"
            >
              Open Full Report
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
            {[
              { label: 'Contact', score: latestResume.sectionScores.contact },
              { label: 'Education', score: latestResume.sectionScores.education },
              { label: 'Skills', score: latestResume.sectionScores.technicalSkills },
              { label: 'Projects', score: latestResume.sectionScores.projects },
              { label: 'Experience', score: latestResume.sectionScores.experienceAndInternships },
              { label: 'Clarity', score: latestResume.sectionScores.formattingAndClarity },
            ].map((sec) => (
              <div key={sec.label}>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">{sec.label}</span>
                  <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                    {sec.score}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sec.score >= 75
                        ? 'bg-emerald-600'
                        : sec.score >= 50
                          ? 'bg-[#2563EB]'
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${sec.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Placement Profile Summary Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0F172A] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              Target Placement Track: {profile.targetJobRole}
            </p>
            <p className="text-xs text-slate-500">
              {profile.collegeName} · {profile.degreeBranch} · Graduating {profile.graduationYear}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap cursor-pointer"
        >
          Update Target Role
        </button>
      </section>
    </div>
  );
};

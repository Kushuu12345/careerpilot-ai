import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deleteResumeAnalysis, saveResumeAnalysis } from '../../lib/firestoreService';
import { formatFileSize, formatFriendlyDate, validatePdfFile } from '../../lib/validation';
import type { ResumeAnalysisRecord, ResumeAnalysisResult, StudentProfile } from '../../types';

interface ResumeAnalyzerPageProps {
  profile: StudentProfile;
  resumes: ResumeAnalysisRecord[];
  selectedResumeId: string | null;
  onSelectResume: (id: string | null) => void;
}

type ReportTab = 'diagnostics' | 'extracted' | 'raw-text';

function getScoreLabel(score: number): { label: string; colorClass: string; strokeColor: string } {
  if (score >= 80) {
    return { label: 'Placement Ready', colorClass: 'text-emerald-700', strokeColor: '#16A34A' };
  }
  if (score >= 60) {
    return { label: 'Solid Foundation', colorClass: 'text-[#1D4ED8]', strokeColor: '#2563EB' };
  }
  if (score >= 40) {
    return { label: 'Needs Improvements', colorClass: 'text-amber-700', strokeColor: '#D97706' };
  }
  return { label: 'Major Revision Needed', colorClass: 'text-red-700', strokeColor: '#DC2626' };
}

export const ResumeAnalyzerPage: React.FC<ResumeAnalyzerPageProps> = ({
  profile,
  resumes,
  selectedResumeId,
  onSelectResume,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState(profile.targetJobRole || 'Software Development Engineer');
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('diagnostics');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeResume =
    resumes.find((r) => r.id === selectedResumeId) || resumes[0] || null;

  const handleFileSelection = (file: File | null) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationErr = validatePdfFile(file);
    if (validationErr) {
      setSelectedFile(null);
      setErrorMessage(validationErr);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0] || null;
    handleFileSelection(droppedFile);
  };

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedFile) {
      setErrorMessage('Please choose a PDF resume file before starting the analysis.');
      return;
    }

    if (!user) {
      setErrorMessage('You must be signed in to analyze your resume.');
      return;
    }

    const cleanedRole = targetRole.trim() || profile.targetJobRole || 'Software Development Engineer';
    if (cleanedRole.length < 2 || cleanedRole.length > 120) {
      setErrorMessage('Target job role must be between 2 and 120 characters.');
      return;
    }

    setAnalyzing(true);
    setAnalysisStep('Extracting readable text from your PDF...');

    try {
      const idToken = await user.getIdToken();
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('targetRole', cleanedRole);
      formData.append('degreeBranch', profile.degreeBranch);

      setAnalysisStep('Running structured Gemini rubric evaluation on server...');
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as {
        error?: string;
        fileName?: string;
        fileSizeBytes?: number;
        targetRole?: string;
        extractedTextPreview?: string;
        analysis?: ResumeAnalysisResult;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || 'Resume analysis failed. Please try again.');
      }

      setAnalysisStep('Saving analysis securely to your Firestore history...');
      const savedRecord = await saveResumeAnalysis(user.uid, {
        fileName: payload.fileName || selectedFile.name,
        fileSizeBytes: payload.fileSizeBytes || selectedFile.size,
        targetRole: payload.targetRole || cleanedRole,
        extractedTextPreview: payload.extractedTextPreview || '',
        analysis: payload.analysis,
      });

      onSelectResume(savedRecord.id);
      setActiveTab('diagnostics');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSuccessMessage(
        `Analysis complete for ${savedRecord.fileName} and saved to your private history.`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to analyze this resume right now.'
      );
    } finally {
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    setDeletingId(resumeId);
    setErrorMessage(null);
    try {
      await deleteResumeAnalysis(resumeId);
      if (selectedResumeId === resumeId) {
        const next = resumes.find((r) => r.id !== resumeId);
        onSelectResume(next ? next.id : null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not delete resume record.');
    } finally {
      setDeletingId(null);
    }
  };

  const scoreMeta = activeResume ? getScoreLabel(activeResume.overallScore) : null;
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = activeResume
    ? ringCircumference * (1 - activeResume.overallScore / 100)
    : ringCircumference;

  return (
    <div className="space-y-8">
      {/* Page Intro */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">AI Resume Analyzer</h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Upload your PDF resume for a transparent 6-section placement readiness audit. Every
          extracted fact and recommendation is grounded strictly in your uploaded document.
        </p>
      </div>

      {/* Upload & Target Role Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <form onSubmit={handleAnalyzeSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Drag & Drop PDF Box */}
            <div className="lg:col-span-7">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Resume PDF Document (Max 5 MB)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-[#2563EB] bg-blue-50/60'
                    : selectedFile
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-[#F8FAFC]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A] break-all">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      {formatFileSize(selectedFile.size)} · Ready to analyze
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileSelection(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-red-600 mt-1 cursor-pointer"
                    >
                      Choose a different PDF
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-[#2563EB] flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      Drop your PDF resume here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500">
                      Text-based PDF exported from Word, Google Docs, or LaTeX · Up to 5 MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Target Role & Action */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <label
                  htmlFor="targetRoleInput"
                  className="block text-xs font-semibold text-slate-700 mb-2"
                >
                  Target Job Role for This Audit
                </label>
                <input
                  id="targetRoleInput"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  maxLength={120}
                  placeholder="e.g., Software Development Engineer"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Missing skills and project recommendations will be tailored to this role.
                </p>
              </div>

              <button
                type="submit"
                disabled={analyzing || !selectedFile}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Resume...
                  </>
                ) : (
                  'Run AI Resume Analysis'
                )}
              </button>

              {analyzing && analysisStep && (
                <p className="text-xs text-[#2563EB] font-medium">{analysisStep}</p>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>
      </section>

      {/* Saved Resume History Selector (when student has 1+ analyses) */}
      {resumes.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Saved Resume Analyses ({resumes.length})
            </h3>
            <p className="text-xs text-slate-500">
              Stored privately in Firestore under your student account
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {resumes.map((item) => {
              const isSelected = activeResume?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected ? 'bg-blue-50/40 -mx-3 px-3 rounded-lg' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectResume(item.id)}
                    className="text-left min-w-0 flex-1 cursor-pointer"
                  >
                    <p
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-[#1D4ED8]' : 'text-[#0F172A]'
                      }`}
                    >
                      {item.fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.targetRole} · {formatFriendlyDate(item.createdAt)} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatFileSize(item.fileSizeBytes)}
                      </span>
                    </p>
                  </button>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-sm font-bold text-[#0F172A] tabular-nums">
                      {item.overallScore}/100
                    </span>

                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteResume(item.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label={`Delete analysis for ${item.fileName}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Analysis Results Dashboard */}
      {!activeResume ? (
        <section className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0F172A]">No resume analysis selected yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            Upload your PDF resume above to view section scores, extracted profile details, skill
            gaps, and your top three recommended improvements.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {/* Top Summary Grid: Score Ring + Section Progress Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Overall Score Card */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {activeResume.fileName} · {activeResume.targetRole}
                </p>
                <h3 className="text-lg font-bold text-[#0F172A] mt-1">
                  Placement Readiness Score
                </h3>
              </div>

              <div className="flex items-center gap-6 my-6">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle
                      cx="56"
                      cy="56"
                      r={ringRadius}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="9"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r={ringRadius}
                      fill="none"
                      stroke={scoreMeta?.strokeColor || '#2563EB'}
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-mono text-[#0F172A] tabular-nums leading-none">
                      {activeResume.overallScore}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 mt-1">/100</span>
                  </div>
                </div>

                <div>
                  <p className={`text-sm font-bold ${scoreMeta?.colorClass}`}>
                    {scoreMeta?.label}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Weighted across 6 core placement sections. This is a transparent AI rubric
                    score—not an official employer ATS score.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200/80 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0F172A] mb-0.5">How this score is calculated</p>
                  <p>{activeResume.scoringMethodology}</p>
                </div>
              </div>
            </section>

            {/* Section-wise Scores Card */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Section-Wise Breakdown</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Each section is weighted toward your overall placement score
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Projects & Impact', weight: '25%', value: activeResume.sectionScores.projects },
                  { label: 'Technical Skills', weight: '20%', value: activeResume.sectionScores.technicalSkills },
                  { label: 'Education & Academics', weight: '15%', value: activeResume.sectionScores.education },
                  {
                    label: 'Experience & Internships',
                    weight: '15%',
                    value: activeResume.sectionScores.experienceAndInternships,
                  },
                  {
                    label: 'Formatting & Clarity',
                    weight: '15%',
                    value: activeResume.sectionScores.formattingAndClarity,
                  },
                  { label: 'Contact Information', weight: '10%', value: activeResume.sectionScores.contact },
                ].map((sec) => (
                  <div key={sec.label}>
                    <div className="flex items-baseline justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#0F172A]">
                        {sec.label}{' '}
                        <span className="font-normal text-slate-400">({sec.weight} weight)</span>
                      </span>
                      <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                        {sec.value}/100
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          sec.value >= 75
                            ? 'bg-emerald-600'
                            : sec.value >= 50
                              ? 'bg-[#2563EB]'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${sec.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Top 3 Recommended Improvements */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-bold text-[#0F172A] mb-1">
              Top Three Recommended Improvements
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Focus on these three highest-impact changes first before submitting for campus drives
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeResume.topThreeImprovements.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200/80"
                >
                  <span className="font-mono text-xs font-bold text-[#6D28D9]">0{idx + 1}.</span>
                  <p className="text-sm text-[#0F172A] leading-relaxed mt-2">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Report View Tabs (Interactive segmented control) */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
            {[
              { id: 'diagnostics' as const, label: 'Diagnostics & Suggestions' },
              { id: 'extracted' as const, label: 'Extracted Resume Facts' },
              { id: 'raw-text' as const, label: 'Extracted PDF Text' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Diagnostics & Suggestions */}
          {activeTab === 'diagnostics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailListCard
                title="Resume Strengths"
                subtitle="Evidence-backed positives found in your PDF"
                items={activeResume.strengths}
                emptyText="No distinct strengths were highlighted."
                tone="positive"
              />

              <DetailListCard
                title="Areas to Strengthen (Weaknesses)"
                subtitle="Specific gaps observed in your uploaded text"
                items={activeResume.weaknesses}
                emptyText="No major weaknesses identified."
                tone="warning"
              />

              <DetailListCard
                title="Missing Information"
                subtitle="Important details not found in the uploaded PDF"
                items={activeResume.missingInformation}
                emptyText="All standard placement resume sections were detected."
                tone="warning"
              />

              <DetailListCard
                title={`Missing Skills for ${activeResume.targetRole}`}
                subtitle="Role-relevant skills absent from your current resume"
                items={activeResume.missingSkills}
                emptyText="Your listed skills already cover core expectations for this role."
                tone="neutral"
              />

              <DetailListCard
                title="Grammar & Formatting Suggestions"
                subtitle="Clarity, phrasing, and layout refinements"
                items={activeResume.grammarAndFormattingSuggestions}
                emptyText="Formatting and grammar appear clean."
                tone="neutral"
              />

              <DetailListCard
                title="ATS-Readability Suggestions"
                subtitle="How to make your document easier for recruiting software to parse"
                items={activeResume.atsImprovementSuggestions}
                emptyText="No ATS-readability issues flagged."
                tone="neutral"
              />

              <div className="md:col-span-2">
                <DetailListCard
                  title="Actionable Next-Step Suggestions"
                  subtitle="Concrete edits you can make today"
                  items={activeResume.actionableSuggestions}
                  emptyText="No additional suggestions."
                  tone="neutral"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Extracted Resume Facts */}
          {activeTab === 'extracted' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailListCard
                title="Contact Information"
                subtitle="Detected verbatim from your PDF"
                items={activeResume.extractedProfile.contactInfo}
                emptyText="Missing: No contact details detected in the uploaded PDF."
                tone="neutral"
              />
              <DetailListCard
                title="Education"
                subtitle="Degrees, institutions, and academic details found"
                items={activeResume.extractedProfile.education}
                emptyText="Missing: No education entries detected in the uploaded PDF."
                tone="neutral"
              />
              <div className="md:col-span-2">
                <section className="bg-white border border-slate-200 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    Technical Skills Extracted ({activeResume.extractedProfile.technicalSkills.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 mb-4">
                    Only skills explicitly listed in your uploaded PDF are shown here
                  </p>
                  {activeResume.extractedProfile.technicalSkills.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      Missing: No explicit technical skills list was found in your resume text.
                    </p>
                  ) : (
                    <p className="text-sm text-[#0F172A] leading-7">
                      {activeResume.extractedProfile.technicalSkills.join('  ·  ')}
                    </p>
                  )}
                </section>
              </div>
              <DetailListCard
                title="Projects"
                subtitle="Academic or personal projects detected"
                items={activeResume.extractedProfile.projects}
                emptyText="Missing: No projects section detected in the uploaded PDF."
                tone="neutral"
              />
              <DetailListCard
                title="Internships & Experience"
                subtitle="Work history or internship roles detected"
                items={activeResume.extractedProfile.internships}
                emptyText="Missing: No internships or work experience detected in the uploaded PDF."
                tone="neutral"
              />
              <DetailListCard
                title="Certifications"
                subtitle="Courses or certifications listed"
                items={activeResume.extractedProfile.certifications}
                emptyText="Missing: No certifications listed in the uploaded PDF."
                tone="neutral"
              />
              <DetailListCard
                title="Achievements & Honors"
                subtitle="Awards, hackathons, or rankings listed"
                items={activeResume.extractedProfile.achievements}
                emptyText="Missing: No achievements section listed in the uploaded PDF."
                tone="neutral"
              />
            </div>
          )}

          {/* Tab 3: Extracted PDF Text Preview */}
          {activeTab === 'raw-text' && (
            <section className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-[#0F172A]">Extracted PDF Text Preview</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  This is the plain text our server extracted from {activeResume.fileName} and sent
                  to Gemini for evaluation.
                </p>
              </div>
              <pre className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap break-words max-h-[480px] overflow-y-auto leading-relaxed">
                {activeResume.extractedTextPreview}
              </pre>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

interface DetailListCardProps {
  title: string;
  subtitle: string;
  items: string[];
  emptyText: string;
  tone: 'positive' | 'warning' | 'neutral';
}

const DetailListCard: React.FC<DetailListCardProps> = ({
  title,
  subtitle,
  items,
  emptyText,
  tone,
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-[#0F172A]">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
              {tone === 'positive' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : tone === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <span className="font-mono text-xs text-[#2563EB] mt-0.5 shrink-0">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

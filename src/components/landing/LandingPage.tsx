import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileSearch,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Logo } from '../common/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  isAuthenticated: boolean;
  onGoToDashboard: () => void;
}

const HERO_IMAGE_SRC = '/src/assets/images/hero_campus_placement_1795586798134.jpg';
const WORKSPACE_IMAGE_SRC = '/src/assets/images/feature_resume_workspace_1795586798266.jpg';

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  isAuthenticated,
  onGoToDashboard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [workspaceImgFailed, setWorkspaceImgFailed] = useState(false);

  const primaryAction = isAuthenticated ? onGoToDashboard : onGetStarted;
  const primaryLabel = isAuthenticated ? 'Open Dashboard' : 'Get Started';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Logo />

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#features"
              className="hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#scoring-transparency"
              className="hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0"
            >
              Scoring Rubric
            </a>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={onSignIn}
                className="hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={primaryAction}
              className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700"
            >
              How It Works
            </a>
            <a
              href="#scoring-transparency"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700"
            >
              Scoring Rubric
            </a>
            <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-100">
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignIn();
                  }}
                  className="w-full py-2.5 text-sm font-semibold text-[#0F172A] border border-slate-200 rounded-lg"
                >
                  Sign In
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  primaryAction();
                }}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#2563EB] rounded-lg"
              >
                {primaryLabel}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-sm font-semibold text-[#6D28D9] mb-4">
                  Your Personal AI Placement Coach
                </p>
                <h1
                  className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight text-[#0F172A] leading-[1.08] mb-6"
                  style={{ textWrap: 'balance' }}
                >
                  Your Career. Your AI-Powered Advantage.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                  Built for B.Tech students, fresh graduates, and campus placement candidates.
                  Upload your PDF resume to receive an evidence-based section audit, uncover missing
                  technical skills for your target role, and organize your placement preparation in
                  one workspace.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <button
                    type="button"
                    onClick={primaryAction}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isAuthenticated ? 'Go to Student Dashboard' : 'Get Started Free'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="inline-flex items-center justify-center px-5 py-3.5 text-sm font-semibold text-[#0F172A] bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sign In to Account
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 pt-6 border-t border-slate-100">
                  <span>PDF text extraction</span>
                  <span aria-hidden="true">·</span>
                  <span>Zero hallucinated skills</span>
                  <span aria-hidden="true">·</span>
                  <span>Private student Firestore workspace</span>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-full min-h-[320px] lg:min-h-[440px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  {!heroImgFailed ? (
                    <img
                      src={HERO_IMAGE_SRC}
                      alt="Engineering students reviewing a technical resume together at a modern study table"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-10 bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-50/70 text-center">
                      <Compass className="w-12 h-12 text-[#2563EB] mb-4" />
                      <p className="text-base font-semibold text-[#0F172A]">
                        CareerPilot AI Placement Workspace
                      </p>
                      <p className="text-sm text-slate-600 mt-1 max-w-sm">
                        Structured resume analysis, skill gap detection, and private student progress tracking.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section — Asymmetric Bento Layout */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-[#2563EB] mb-2">Platform Capabilities</p>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mb-4"
              style={{ textWrap: 'balance' }}
            >
              Practical placement preparation grounded in your actual resume
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Every insight starts with the real document you upload. No generic chat prompts, no
              fabricated scores, and no invented qualifications.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Marquee Live Feature Card */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-7 p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#2563EB] mb-3">
                    Live Module · Core Feature
                  </p>
                  <h3 className="text-2xl font-bold text-[#0F172A] mb-3">
                    AI Resume Analyzer & Rubric Audit
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Upload your PDF resume and get a structured 6-section readiness evaluation
                    powered by server-side Gemini analysis. Extracts your real skills, projects,
                    education, internships, certifications, and achievements while flagging missing
                    details honestly.
                  </p>
                </div>

                <ul className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                    <span>Weighted 0–100 placement readiness score with transparent formula</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                    <span>Grammar, formatting, and ATS-readability improvement checklists</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                    <span>Top three prioritized edits saved directly to your Firestore history</span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-5 bg-slate-100 border-t md:border-t-0 md:border-l border-slate-200 min-h-[240px]">
                {!workspaceImgFailed ? (
                  <img
                    src={WORKSPACE_IMAGE_SRC}
                    alt="Clean student desk with printed technical resume, laptop, and engineering notebook"
                    referrerPolicy="no-referrer"
                    onError={() => setWorkspaceImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                    <FileSearch className="w-10 h-10 text-[#2563EB] mb-3" />
                    <span className="text-sm font-semibold text-[#0F172A]">Structured PDF Audit</span>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Live Capability */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#6D28D9] mb-3">
                  Live Module · Student Workspace
                </p>
                <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                  Private Progress Dashboard
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Track your real resume score history, identified technical skills, and profile
                  goals across campus placement drives. Protected by Firebase Authentication and
                  owner-only Firestore security rules.
                </p>
              </div>
              <div className="pt-5 border-t border-slate-100 flex items-center gap-3 text-xs font-medium text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#6D28D9] shrink-0" />
                <span>Your documents are isolated to your student UID</span>
              </div>
            </div>

            {/* Upcoming Modules Row */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-7">
              <p className="text-xs font-medium text-slate-500 mb-2">Upcoming Module · Planned</p>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">Job Description Matcher</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compare your saved resume against campus job descriptions to inspect keyword
                alignment, role requirements, and priority gaps before applying.
              </p>
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-7">
              <p className="text-xs font-medium text-slate-500 mb-2">Upcoming Module · Planned</p>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">AI Mock Interviews</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Practice technical and HR rounds tailored to your branch, target job role, and the
                projects listed on your analyzed resume.
              </p>
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-7">
              <p className="text-xs font-medium text-slate-500 mb-2">Upcoming Module · Planned</p>
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                Placement Roadmap & Practice Arena
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Turn identified skill gaps into a week-by-week preparation schedule paired with
                timed DSA, aptitude, and core CS practice drills.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="max-w-2xl mb-14">
              <p className="text-sm font-semibold text-[#6D28D9] mb-2">How It Works</p>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Four straightforward steps from draft resume to placement readiness
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: '01.',
                  title: 'Create Student Profile',
                  body: 'Sign in with Google or email and record your college, degree branch, graduation year, and target role.',
                },
                {
                  step: '02.',
                  title: 'Upload PDF Resume',
                  body: 'Submit your current PDF resume (up to 5 MB). Our server validates the file and extracts clean text.',
                },
                {
                  step: '03.',
                  title: 'Review Structured Audit',
                  body: 'Inspect section-by-section scores, missing information, skill gaps, and your top three priority edits.',
                },
                {
                  step: '04.',
                  title: 'Iterate & Track History',
                  body: 'Every analysis is saved privately to Firestore so you can compare revisions as you improve your resume.',
                },
              ].map((item) => (
                <div key={item.step} className="pt-5 border-t border-slate-200">
                  <span className="font-mono text-sm font-semibold text-[#2563EB] tabular-nums">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-[#0F172A] mt-3 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transparent Scoring Methodology Section */}
        <section id="scoring-transparency" className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-white border border-slate-200 rounded-xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <p className="text-sm font-semibold text-[#2563EB] mb-2">Transparent Evaluation</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mb-4">
                  Honest scoring rules you can verify
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  CareerPilot AI never claims to produce an official employer ATS score. Instead,
                  each resume is evaluated against a transparent, weighted placement-readiness
                  rubric designed for engineering and graduate hiring.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Missing sections are clearly flagged as absent rather than filled in with
                  assumptions.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Projects & Technical Depth', weight: '25%', detail: 'Tech stack clarity, ownership, and outcomes' },
                  { label: 'Technical Skills', weight: '20%', detail: 'Relevance and organization for your target role' },
                  { label: 'Education & Academics', weight: '15%', detail: 'Degree, institution, timeline, and coursework' },
                  { label: 'Experience & Internships', weight: '15%', detail: 'Internships, work roles, or campus leadership' },
                  { label: 'Formatting & Clarity', weight: '15%', detail: 'Grammar, concise bullet phrasing, structure' },
                  { label: 'Contact Information', weight: '10%', detail: 'Email, phone, GitHub, LinkedIn, or portfolio' },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200/80"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#0F172A]">{row.label}</span>
                      <span className="font-mono text-sm font-semibold text-[#2563EB] tabular-nums">
                        {row.weight}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{row.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="bg-[#0F172A] text-white rounded-xl p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Ready to audit your resume before campus placements begin?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Create your free student workspace, upload your PDF resume, and get structured
                improvement priorities in under a minute.
              </p>
            </div>
            <button
              type="button"
              onClick={primaryAction}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <Logo size="sm" />
            <p className="text-xs text-slate-500 mt-2">
              Your Personal AI Placement Coach · Built for college placement candidates
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#features" className="hover:text-[#0F172A] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">
              How It Works
            </a>
            <a href="#scoring-transparency" className="hover:text-[#0F172A] transition-colors">
              Scoring Rubric
            </a>
            <button
              type="button"
              onClick={primaryAction}
              className="text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

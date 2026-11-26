/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { OverviewPage } from './components/dashboard/OverviewPage';
import { ResumeAnalyzerPage } from './components/dashboard/ResumeAnalyzerPage';
import { UpcomingModulePage } from './components/dashboard/UpcomingModulePage';
import { ProfilePage } from './components/dashboard/ProfilePage';
import { SettingsPage } from './components/dashboard/SettingsPage';
import {
  getStudentModuleRecords,
  subscribeToStudentResumes,
} from './lib/firestoreService';
import type {
  DashboardSection,
  InterviewRecord,
  JobMatchRecord,
  PracticeResultRecord,
  ResumeAnalysisRecord,
  RoadmapRecord,
} from './types';

type TopView = 'landing' | 'auth' | 'dashboard';

function AppShell() {
  const { user, profile, authLoading, profileLoading, logout } = useAuth();

  const [view, setView] = useState<TopView>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  // Real Firestore student data
  const [resumes, setResumes] = useState<ResumeAnalysisRecord[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatchRecord[]>([]);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapRecord[]>([]);
  const [practiceResults, setPracticeResults] = useState<PracticeResultRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Automatically route authenticated students to dashboard or onboarding/verification
  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (user) {
      if (user.emailVerified && profile) {
        if (view === 'auth') {
          setView('dashboard');
        }
      } else if (view === 'dashboard') {
        setView('auth');
      }
    } else if (view === 'dashboard') {
      setView('auth');
    }
  }, [user, profile, authLoading, profileLoading, view]);

  // Subscribe to student's Firestore data ONLY when authenticated, verified, and profile exists
  useEffect(() => {
    if (!user || !user.emailVerified || !profile) {
      setResumes([]);
      setJobMatches([]);
      setInterviews([]);
      setRoadmaps([]);
      setPracticeResults([]);
      return;
    }

    setDataLoading(true);
    let cancelled = false;

    const unsubscribeResumes = subscribeToStudentResumes(
      user.uid,
      (records) => {
        if (!cancelled) {
          setResumes(records);
          setSelectedResumeId((prev) => {
            if (prev && records.some((r) => r.id === prev)) return prev;
            return records[0]?.id ?? null;
          });
          setDataLoading(false);
        }
      },
      (err) => {
        console.error('Resume listener error:', err);
        if (!cancelled) setDataLoading(false);
      }
    );

    getStudentModuleRecords(user.uid)
      .then((moduleData) => {
        if (!cancelled) {
          setJobMatches(moduleData.jobMatches);
          setInterviews(moduleData.interviews);
          setRoadmaps(moduleData.roadmaps);
          setPracticeResults(moduleData.practiceResults);
        }
      })
      .catch((err) => {
        console.error('Failed loading secondary module counts:', err);
      });

    return () => {
      cancelled = true;
      unsubscribeResumes();
    };
  }, [user, profile]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthInitialMode(mode);
    setView('auth');
  };

  const handleGoToDashboard = () => {
    if (user && user.emailVerified && profile) {
      setView('dashboard');
    } else {
      setView('auth');
    }
  };

  const handleLogout = async () => {
    await logout();
    setActiveSection('overview');
    setSelectedResumeId(null);
    setView('landing');
  };

  const handleSelectResumeFromOverview = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setActiveSection('resume-analyzer');
  };

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-[#2563EB] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading your CareerPilot AI workspace...</p>
      </div>
    );
  }

  // If user is signed in and wants auth/onboarding or hasn't finished verification/profile
  if (view === 'auth' || (user && (!user.emailVerified || !profile) && view !== 'landing')) {
    return (
      <AuthPage
        initialMode={authInitialMode}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  // Protected Dashboard Route
  if (view === 'dashboard' && user && user.emailVerified && profile) {
    return (
      <DashboardLayout
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        profile={profile}
        onLogout={handleLogout}
      >
        {activeSection === 'overview' && (
          <OverviewPage
            profile={profile}
            resumes={resumes}
            interviews={interviews}
            roadmaps={roadmaps}
            jobMatches={jobMatches}
            practiceResults={practiceResults}
            loading={dataLoading}
            onNavigate={setActiveSection}
            onSelectResume={handleSelectResumeFromOverview}
          />
        )}

        {activeSection === 'resume-analyzer' && (
          <ResumeAnalyzerPage
            profile={profile}
            resumes={resumes}
            selectedResumeId={selectedResumeId}
            onSelectResume={setSelectedResumeId}
          />
        )}

        {(activeSection === 'job-matcher' ||
          activeSection === 'mock-interview' ||
          activeSection === 'learning-roadmap' ||
          activeSection === 'practice-arena') && (
          <UpcomingModulePage
            moduleId={activeSection}
            onGoToResumeAnalyzer={() => setActiveSection('resume-analyzer')}
          />
        )}

        {activeSection === 'profile' && <ProfilePage profile={profile} />}

        {activeSection === 'settings' && <SettingsPage profile={profile} />}
      </DashboardLayout>
    );
  }

  // Public Landing Page
  return (
    <LandingPage
      onGetStarted={() => handleOpenAuth('signup')}
      onSignIn={() => handleOpenAuth('login')}
      isAuthenticated={Boolean(user)}
      onGoToDashboard={handleGoToDashboard}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}

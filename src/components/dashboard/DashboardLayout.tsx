import React, { useState } from 'react';
import {
  Briefcase,
  Code2,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Settings,
  User,
  X,
} from 'lucide-react';
import type { DashboardSection, StudentProfile } from '../../types';
import { Logo } from '../common/Logo';

interface DashboardLayoutProps {
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  profile: StudentProfile;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  upcoming?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'resume-analyzer', label: 'Resume Analyzer', icon: FileSearch },
  { id: 'job-matcher', label: 'Job Matcher', icon: Briefcase, upcoming: true },
  { id: 'mock-interview', label: 'Mock Interview', icon: MessageSquare, upcoming: true },
  { id: 'learning-roadmap', label: 'Learning Roadmap', icon: Map, upcoming: true },
  { id: 'practice-arena', label: 'Practice Arena', icon: Code2, upcoming: true },
];

const ACCOUNT_NAV: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SECTION_TITLES: Record<DashboardSection, string> = {
  overview: 'Overview',
  'resume-analyzer': 'Resume Analyzer',
  'job-matcher': 'Job Matcher',
  'mock-interview': 'Mock Interview',
  'learning-roadmap': 'Learning Roadmap',
  'practice-arena': 'Practice Arena',
  profile: 'Student Profile',
  settings: 'Settings',
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeSection,
  onSelectSection,
  profile,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = profile.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-[#1D4ED8]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#2563EB]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.upcoming && (
                <span className="text-[11px] font-medium text-slate-400 shrink-0">Soon</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <Logo size="sm" onClick={() => onSelectSection('overview')} />
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400">Placement Modules</p>
          {renderNavList(PRIMARY_NAV)}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400">Account</p>
          {renderNavList(ACCOUNT_NAV)}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initials || 'ST'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0F172A] truncate">{profile.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{profile.targetJobRole}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onLogout()}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-50">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar navigation"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                CareerPilot AI
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-bold text-[#0F172A] truncate">
                {SECTION_TITLES[activeSection]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <span>{profile.degreeBranch}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Class of {profile.graduationYear}</span>
            </div>
            {activeSection !== 'resume-analyzer' && (
              <button
                type="button"
                onClick={() => onSelectSection('resume-analyzer')}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Analyze Resume
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">{children}</main>
      </div>
    </div>
  );
};

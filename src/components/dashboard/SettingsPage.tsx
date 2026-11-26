import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { StudentProfile } from '../../types';

interface SettingsPageProps {
  profile: StudentProfile;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ profile }) => {
  const { user, requestPasswordReset, logout } = useAuth();
  const [sendingReset, setSendingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const hasPasswordProvider = Boolean(
    user?.providerData?.some((p) => p.providerId === 'password')
  );
  const providerLabels =
    user?.providerData?.map((p) =>
      p.providerId === 'google.com'
        ? 'Google Sign-In'
        : p.providerId === 'password'
          ? 'Email & Password'
          : p.providerId
    ) || [];

  const handlePasswordReset = async () => {
    if (!profile.email) return;
    setResetError(null);
    setResetMessage(null);
    setSendingReset(true);
    try {
      await requestPasswordReset(profile.email);
      setResetMessage(`Password reset email sent to ${profile.email}.`);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Unable to send password reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Account Settings</h2>
        <p className="text-sm text-slate-600 mt-1">
          Manage your sign-in method, security preferences, and private data controls.
        </p>
      </div>

      {/* Authentication Details */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-base font-bold text-[#0F172A]">Authentication & Privacy</h3>
        </div>

        <dl className="divide-y divide-slate-100 text-sm">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <dt className="text-slate-500">Signed-in Email</dt>
            <dd className="font-medium text-[#0F172A]">{profile.email}</dd>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <dt className="text-slate-500">Email Verification</dt>
            <dd className="font-medium text-emerald-700">
              {user?.emailVerified ? 'Verified' : 'Pending Verification'}
            </dd>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <dt className="text-slate-500">Sign-in Method</dt>
            <dd className="font-medium text-[#0F172A]">
              {providerLabels.length > 0 ? providerLabels.join(' · ') : 'Firebase Auth'}
            </dd>
          </div>
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <dt className="text-slate-500">Data Isolation</dt>
            <dd className="font-medium text-[#0F172A]">
              Owner-only Firestore rules tied to your UID
            </dd>
          </div>
        </dl>
      </section>

      {/* Password Management (for Email/Password accounts) */}
      {hasPasswordProvider && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-[#6D28D9]" />
            <h3 className="text-base font-bold text-[#0F172A]">Password Management</h3>
          </div>
          <p className="text-sm text-slate-600">
            Send a secure Firebase password reset link to <strong>{profile.email}</strong>.
          </p>

          {resetMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetMessage}</span>
            </div>
          )}

          {resetError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{resetError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={sendingReset}
            onClick={handlePasswordReset}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-[#0F172A] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {sendingReset ? 'Sending Link...' : 'Send Password Reset Email'}
          </button>
        </section>
      )}

      {/* Session Control */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Sign Out</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            End your active session on this browser. Your saved Firestore data remains intact.
          </p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </section>
    </div>
  );
};

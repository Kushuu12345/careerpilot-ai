import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  MailCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  validateEmail,
  validatePassword,
  validateStudentProfileInput,
} from '../../lib/validation';
import { Logo } from '../common/Logo';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onBackToLanding: () => void;
}

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onBackToLanding,
}) => {
  const {
    user,
    profile,
    pendingSignupProfile,
    signInWithGoogle,
    signUpWithEmail,
    loginWithEmail,
    completeStudentProfile,
    resendVerification,
    refreshVerificationStatus,
    requestPasswordReset,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Login & Signup common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student Profile fields (used in Signup AND Google Onboarding)
  const [fullName, setFullName] = useState(
    pendingSignupProfile?.fullName || user?.displayName || ''
  );
  const [collegeName, setCollegeName] = useState(pendingSignupProfile?.collegeName || '');
  const [degreeBranch, setDegreeBranch] = useState(pendingSignupProfile?.degreeBranch || '');
  const [graduationYear, setGraduationYear] = useState<number>(
    pendingSignupProfile?.graduationYear || 2027
  );
  const [targetJobRole, setTargetJobRole] = useState(pendingSignupProfile?.targetJobRole || '');

  const passwordStatus = validatePassword(password);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailErr = validateEmail(email);
    const errors: Record<string, string> = {};
    if (emailErr) errors.email = emailErr;
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const errors = validateStudentProfileInput({
      fullName,
      collegeName,
      degreeBranch,
      graduationYear,
      targetJobRole,
    });

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    if (!passwordStatus.valid) errors.password = passwordStatus.message;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await signUpWithEmail({
        fullName,
        email,
        password,
        collegeName,
        degreeBranch,
        graduationYear,
        targetJobRole,
      });
      if (result.needsEmailVerification) {
        setSuccessMessage(
          'Account created! Please check your inbox and click the verification link before entering the dashboard.'
        );
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const effectiveName = fullName.trim() || user?.displayName || '';
    const errors = validateStudentProfileInput({
      fullName: effectiveName,
      collegeName,
      degreeBranch,
      graduationYear,
      targetJobRole,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await completeStudentProfile({
        fullName: effectiveName,
        collegeName,
        degreeBranch,
        graduationYear,
        targetJobRole,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save your student profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldErrors({ email: 'Enter your account email above to receive a password reset link.' });
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSuccessMessage(`Password reset instructions sent to ${email.trim()}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshVerification = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      const verified = await refreshVerificationStatus();
      if (!verified) {
        setErrorMessage(
          'Your email is not verified yet. Please click the verification link in your inbox, then click Refresh Status.'
        );
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to refresh verification status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      await resendVerification();
      setSuccessMessage('A fresh verification link has been sent to your email address.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to resend verification email.');
    } finally {
      setSubmitting(false);
    }
  };

  // Case 1: Authenticated user whose email is not yet verified
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center px-6 py-12">
        <div className="max-w-lg w-full mx-auto bg-white border border-slate-200 rounded-xl p-8">
          <div className="mb-6">
            <Logo />
          </div>
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
            <MailCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verify your student email</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            We sent a verification link to <strong className="text-[#0F172A]">{user.email}</strong>.
            To protect your private resume data in Firestore, please confirm your email before
            accessing your dashboard.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={handleRefreshVerification}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              I've Verified — Continue
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleResendVerification}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-[#0F172A] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Resend Email
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Signed in as {user.email}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="font-semibold text-slate-700 hover:text-[#0F172A] cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Authenticated & verified user who still needs to create their Firestore StudentProfile (e.g., first Google login)
  if (user && user.emailVerified && !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center px-6 py-12">
        <div className="max-w-xl w-full mx-auto bg-white border border-slate-200 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs font-medium text-slate-500 hover:text-[#0F172A] cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Complete your student profile</h1>
          <p className="text-sm text-slate-600 mb-6">
            Add your academic details and placement target so CareerPilot AI can tailor resume
            evaluations to your branch and career track.
          </p>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName || user.displayName || ''}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Aarav Sharma"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
              {fieldErrors.fullName && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                College / University Name
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g., National Institute of Technology"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
              {fieldErrors.collegeName && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.collegeName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Degree & Branch
                </label>
                <input
                  type="text"
                  value={degreeBranch}
                  onChange={(e) => setDegreeBranch(e.target.value)}
                  placeholder="e.g., B.Tech Computer Science"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.degreeBranch && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.degreeBranch}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Graduation Year
                </label>
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                >
                  {GRADUATION_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      Class of {yr}
                    </option>
                  ))}
                </select>
                {fieldErrors.graduationYear && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.graduationYear}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Job Role
              </label>
              <input
                type="text"
                value={targetJobRole}
                onChange={(e) => setTargetJobRole(e.target.value)}
                placeholder="e.g., Software Development Engineer, Data Analyst, Frontend Developer"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
              {fieldErrors.targetJobRole && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.targetJobRole}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 rounded-lg transition-colors cursor-pointer mt-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Profile & Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Case 3: Unauthenticated Login / Signup Screen
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        <Logo onClick={onBackToLanding} />
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0F172A]">
              {mode === 'login' ? 'Welcome back' : 'Create your student account'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {mode === 'login'
                ? 'Sign in to access your resume analyses and placement dashboard.'
                : 'Set up your profile to audit your resume for campus placements.'}
            </p>
          </div>

          {/* Interactive segmented mode toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
                setFieldErrors({});
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
                setFieldErrors({});
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              Student Sign Up
            </button>
          </div>

          {/* Google Auth CTA */}
          <button
            type="button"
            disabled={googleSubmitting || submitting}
            onClick={handleGoogleSignIn}
            className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#0F172A] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {googleSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or continue with email</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || googleSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Priya Nair"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                  {fieldErrors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
                )}

                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { ok: passwordStatus.checks.minLength, label: '8+ characters' },
                    { ok: passwordStatus.checks.hasUppercase, label: '1 uppercase letter' },
                    { ok: passwordStatus.checks.hasLowercase, label: '1 lowercase letter' },
                    { ok: passwordStatus.checks.hasNumber, label: '1 number' },
                  ].map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1.5 ${
                        rule.ok ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          rule.ok ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  College / University Name
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g., Vellore Institute of Technology"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.collegeName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.collegeName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Degree & Branch
                  </label>
                  <input
                    type="text"
                    value={degreeBranch}
                    onChange={(e) => setDegreeBranch(e.target.value)}
                    placeholder="e.g., B.Tech Computer Science"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                  {fieldErrors.degreeBranch && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.degreeBranch}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Graduation Year
                  </label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  >
                    {GRADUATION_YEARS.map((yr) => (
                      <option key={yr} value={yr}>
                        Class of {yr}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.graduationYear && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.graduationYear}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Job Role
                </label>
                <input
                  type="text"
                  value={targetJobRole}
                  onChange={(e) => setTargetJobRole(e.target.value)}
                  placeholder="e.g., Software Development Engineer"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
                {fieldErrors.targetJobRole && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.targetJobRole}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || googleSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Student Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

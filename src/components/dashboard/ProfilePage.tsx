import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatFriendlyDate, validateStudentProfileInput } from '../../lib/validation';
import type { StudentProfile } from '../../types';

interface ProfilePageProps {
  profile: StudentProfile;
}

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile }) => {
  const { saveProfileChanges } = useAuth();

  const [fullName, setFullName] = useState(profile.fullName);
  const [collegeName, setCollegeName] = useState(profile.collegeName);
  const [degreeBranch, setDegreeBranch] = useState(profile.degreeBranch);
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear);
  const [targetJobRole, setTargetJobRole] = useState(profile.targetJobRole);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await saveProfileChanges({
        fullName,
        collegeName,
        degreeBranch,
        graduationYear,
        targetJobRole,
      });
      setSuccessMessage('Your student profile has been updated in Firestore.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to save profile changes right now.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Student Profile</h2>
        <p className="text-sm text-slate-600 mt-1">
          Keep your academic details and target placement role accurate so future resume audits stay
          aligned with your goals.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Email (Read-only)
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 text-slate-500 border border-slate-200 rounded-lg cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
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
              maxLength={180}
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
                maxLength={140}
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
              maxLength={120}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
            {fieldErrors.targetJobRole && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.targetJobRole}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Last updated: {formatFriendlyDate(profile.updatedAt)}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

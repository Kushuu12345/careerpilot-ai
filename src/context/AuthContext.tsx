import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from '../lib/firestoreService';
import type { StudentProfile } from '../types';

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  collegeName: string;
  degreeBranch: string;
  graduationYear: number;
  targetJobRole: string;
}

export interface ProfileDraftData {
  fullName: string;
  collegeName: string;
  degreeBranch: string;
  graduationYear: number;
  targetJobRole: string;
}

interface AuthContextValue {
  user: User | null;
  profile: StudentProfile | null;
  authLoading: boolean;
  profileLoading: boolean;
  pendingSignupProfile: ProfileDraftData | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (data: SignupFormData) => Promise<{ needsEmailVerification: boolean }>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeStudentProfile: (data: ProfileDraftData) => Promise<void>;
  saveProfileChanges: (data: ProfileDraftData) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in your Firebase project. Please use "Continue with Google" below, or enable Email/Password in Firebase Console → Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error while connecting to Firebase Authentication. Check your internet connection.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pendingSignupProfile, setPendingSignupProfile] = useState<ProfileDraftData | null>(null);

  const loadProfileForUser = useCallback(
    async (firebaseUser: User | null, draftToSave?: ProfileDraftData | null) => {
      if (!firebaseUser) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const existing = await getStudentProfile(firebaseUser.uid);
        if (existing) {
          setProfile(existing);
          setPendingSignupProfile(null);
        } else if (firebaseUser.emailVerified && draftToSave) {
          const created = await createStudentProfile(firebaseUser.uid, {
            ...draftToSave,
            email: firebaseUser.email || '',
          });
          setProfile(created);
          setPendingSignupProfile(null);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Failed to load student profile:', err);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      await loadProfileForUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [loadProfileForUser]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      throw new Error(formatFirebaseAuthError(error));
    }
  }, []);

  const signUpWithEmail = useCallback(async (data: SignupFormData) => {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );
      await updateProfile(credential.user, { displayName: data.fullName.trim() });

      const draft: ProfileDraftData = {
        fullName: data.fullName.trim(),
        collegeName: data.collegeName.trim(),
        degreeBranch: data.degreeBranch.trim(),
        graduationYear: data.graduationYear,
        targetJobRole: data.targetJobRole.trim(),
      };
      setPendingSignupProfile(draft);

      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        return { needsEmailVerification: true };
      }

      const created = await createStudentProfile(credential.user.uid, {
        ...draft,
        email: credential.user.email || data.email.trim(),
      });
      setProfile(created);
      setPendingSignupProfile(null);
      return { needsEmailVerification: false };
    } catch (error) {
      throw new Error(formatFirebaseAuthError(error));
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(formatFirebaseAuthError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
    setPendingSignupProfile(null);
  }, []);

  const completeStudentProfile = useCallback(
    async (data: ProfileDraftData) => {
      if (!auth.currentUser) {
        throw new Error('You must be signed in to complete your student profile.');
      }
      if (!auth.currentUser.emailVerified) {
        throw new Error('Please verify your email address before saving your student profile.');
      }

      const created = await createStudentProfile(auth.currentUser.uid, {
        ...data,
        email: auth.currentUser.email || '',
      });
      setProfile(created);
      setPendingSignupProfile(null);
    },
    []
  );

  const saveProfileChanges = useCallback(async (data: ProfileDraftData) => {
    if (!auth.currentUser) {
      throw new Error('You must be signed in to update your profile.');
    }
    await updateStudentProfile(auth.currentUser.uid, data);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            fullName: data.fullName.trim(),
            collegeName: data.collegeName.trim(),
            degreeBranch: data.degreeBranch.trim(),
            graduationYear: data.graduationYear,
            targetJobRole: data.targetJobRole.trim(),
            updatedAt: new Date().toISOString(),
          }
        : null
    );
  }, []);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No active account found.');
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      throw new Error(formatFirebaseAuthError(error));
    }
  }, []);

  const refreshVerificationStatus = useCallback(async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const refreshedUser = auth.currentUser;
    setUser(refreshedUser ? ({ ...refreshedUser } as User) : null);
    if (refreshedUser?.emailVerified) {
      await loadProfileForUser(refreshedUser, pendingSignupProfile);
      return true;
    }
    return false;
  }, [loadProfileForUser, pendingSignupProfile]);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw new Error(formatFirebaseAuthError(error));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authLoading,
        profileLoading,
        pendingSignupProfile,
        signInWithGoogle,
        signUpWithEmail,
        loginWithEmail,
        logout,
        completeStudentProfile,
        saveProfileChanges,
        resendVerification,
        refreshVerificationStatus,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}

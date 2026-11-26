export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface PasswordValidationResult {
  valid: boolean;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
  message: string;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email address is required.';
  if (trimmed.length < 3 || trimmed.length > 254) {
    return 'Email address must be between 3 and 254 characters.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const valid = checks.minLength && checks.hasUppercase && checks.hasLowercase && checks.hasNumber;
  let message = '';
  if (!checks.minLength) {
    message = 'Password must be at least 8 characters long.';
  } else if (!checks.hasUppercase) {
    message = 'Password must include at least one uppercase letter.';
  } else if (!checks.hasLowercase) {
    message = 'Password must include at least one lowercase letter.';
  } else if (!checks.hasNumber) {
    message = 'Password must include at least one number.';
  }

  return { valid, checks, message };
}

export interface StudentProfileInput {
  fullName: string;
  collegeName: string;
  degreeBranch: string;
  graduationYear: number;
  targetJobRole: string;
}

export function validateStudentProfileInput(input: StudentProfileInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = 'Full name must be between 2 and 120 characters.';
  }

  const collegeName = input.collegeName.trim();
  if (collegeName.length < 2 || collegeName.length > 180) {
    errors.collegeName = 'College name must be between 2 and 180 characters.';
  }

  const degreeBranch = input.degreeBranch.trim();
  if (degreeBranch.length < 2 || degreeBranch.length > 140) {
    errors.degreeBranch = 'Degree and branch must be between 2 and 140 characters (e.g., B.Tech CSE).';
  }

  if (
    !Number.isInteger(input.graduationYear) ||
    input.graduationYear < 2020 ||
    input.graduationYear > 2035
  ) {
    errors.graduationYear = 'Graduation year must be a valid year between 2020 and 2035.';
  }

  const targetJobRole = input.targetJobRole.trim();
  if (targetJobRole.length < 2 || targetJobRole.length > 120) {
    errors.targetJobRole = 'Target job role must be between 2 and 120 characters.';
  }

  return errors;
}

export function validatePdfFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Only PDF files (.pdf) are supported. Please upload a PDF version of your resume.';
  }
  if (file.type && file.type !== 'application/pdf' && file.type !== 'application/x-pdf') {
    return 'Invalid file format. Please select a valid PDF document.';
  }
  if (file.size === 0) {
    return 'This PDF file is empty. Please select another file.';
  }
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return 'File size exceeds 5 MB. Please compress or export a smaller PDF.';
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatFriendlyDate(isoString: string | null | undefined): string {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

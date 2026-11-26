/**
 * CareerPilot AI — Firestore Security Rules Test Suite Specification
 * Verifies the "Dirty Dozen" adversarial payloads return PERMISSION_DENIED
 * and valid student owner operations succeed.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email_verified: boolean } | null;
  expected: 'ALLOW' | 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Cross-User Profile Read (PII Leak)',
    collection: 'users/studentA',
    operation: 'get',
    auth: { uid: 'studentB', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Users Collection Listing Scrape',
    collection: 'users',
    operation: 'list',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Write Blocked',
    collection: 'users/studentA',
    operation: 'create',
    auth: { uid: 'studentA', email_verified: false },
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'studentA', fullName: 'Test Student' },
  },
  {
    id: 4,
    name: 'Identity Spoofing on Resume Create',
    collection: 'resumes/res_101',
    operation: 'create',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'studentB', fileName: 'spoof.pdf' },
  },
  {
    id: 5,
    name: 'Shadow Ghost Field Injection',
    collection: 'users/studentA',
    operation: 'create',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'studentA', isAdmin: true },
  },
  {
    id: 6,
    name: 'Document ID Poisoning',
    collection: 'resumes/invalid$id!chars',
    operation: 'create',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client Timestamp Forgery',
    collection: 'resumes/res_102',
    operation: 'create',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 8,
    name: 'Score Out of Range / Oversized Payload',
    collection: 'resumes/res_103',
    operation: 'create',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
    payload: { overallScore: 999 },
  },
  {
    id: 9,
    name: 'Immutable userId Update Attempt',
    collection: 'users/studentA',
    operation: 'update',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'studentB' },
  },
  {
    id: 10,
    name: 'Terminal Completed Interview Mutation',
    collection: 'interviews/int_101',
    operation: 'update',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
    payload: { status: 'in_progress', score: 100 },
  },
  {
    id: 11,
    name: 'Orphaned JobMatch Referencing Foreign Resume',
    collection: 'jobMatches/jm_101',
    operation: 'create',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
    payload: { userId: 'studentA', resumeId: 'studentB_resume' },
  },
  {
    id: 12,
    name: 'Unscoped List Query on Resumes',
    collection: 'resumes',
    operation: 'list',
    auth: { uid: 'studentA', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
];

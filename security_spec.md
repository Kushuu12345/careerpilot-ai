# CareerPilot AI — Firestore Security Specification (Phase 0)

## 1. Data Invariants & Relationship Mapping
- **Master Source of Truth**: Firebase Auth UID (`request.auth.uid`) with verified email (`request.auth.token.email_verified == true`) for all writes.
- **Student Profiles (`/users/{userId}`)**: Strictly private PII documents. Only the student whose `request.auth.uid == userId` can read or write their own profile. Collection listing (`list`) is permanently disabled. `userId` and `createdAt` are immutable.
- **Resume Analyses (`/resumes/{resumeId}`)**: Owned by `userId`. Only the owner can `get`, `list` (filtered by `userId`), `create`, or `delete`. Resume snapshots are immutable after creation (`update: if false`).
- **Job Matches (`/jobMatches/{matchId}`)**: Owned by `userId`, must reference an existing `resumeId` owned by the same student. Once `status == 'analyzed'`, document is locked from further updates.
- **Mock Interviews (`/interviews/{interviewId}`)**: Owned by `userId`. Updates allowed only while `status == 'in_progress'` on explicit allowlisted keys (`status`, `score`, `updatedAt`). Once `status == 'completed'`, document is terminally locked.
- **Learning Roadmaps (`/roadmaps/{roadmapId}`)**: Owned by `userId`. Updates allowed only while `status == 'active'` on explicit allowlisted keys (`completionPercentage`, `completedMilestones`, `status`, `updatedAt`). Once `status == 'completed'`, document is terminally locked.
- **Practice Results (`/practiceResults/{resultId}`)**: Owned by `userId`. Immutable assessment results (`update: if false`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-User Profile Read (PII Leak)**: User B calls `get(/users/userA)` -> MUST DENY.
2. **Profile Collection Scrape**: Any signed-in user calls `list(/users)` -> MUST DENY.
3. **Unverified Email Write**: User A with `email_verified: false` attempts `create(/users/userA)` -> MUST DENY.
4. **Identity Spoofing on Resume Create**: User A submits `create(/resumes/res1, { userId: "userB", ... })` -> MUST DENY.
5. **Shadow / Ghost Field Injection**: User A submits `create(/users/userA, { ..., isAdmin: true })` -> MUST DENY via `keys().hasOnly(...)`.
6. **ID Poisoning**: User A submits `create(/resumes/../../../evil$id, ...)` -> MUST DENY via `isValidId()`.
7. **Timestamp Forgery**: User A submits `create(/resumes/res1, { ..., createdAt: "2020-01-01T00:00:00Z" })` -> MUST DENY via `incoming().createdAt == request.time`.
8. **Resource Exhaustion / Denial of Wallet**: User A submits `extractedTextPreview` with 10,000 characters or `overallScore: 999` -> MUST DENY via `.size()` and range guards.
9. **Immutable Field Tampering**: User A attempts `update(/users/userA, { userId: "userB", createdAt: request.time })` -> MUST DENY via `affectedKeys().hasOnly(...)` and immutability check.
10. **Terminal State Re-opening**: User A attempts to update an interview whose `existing().status == 'completed'` -> MUST DENY.
11. **Orphaned JobMatch Write**: User A creates a `jobMatches` doc referencing a nonexistent or someone else's `resumeId` -> MUST DENY via `exists()` + `get()`.
12. **Unscoped List Query**: User A runs `list(/resumes)` without `where("userId", "==", request.auth.uid)` -> MUST DENY via `existing().userId == request.auth.uid`.

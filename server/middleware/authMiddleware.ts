import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

let cachedFirebaseApiKey: string | null = null;

function getFirebaseWebApiKey(): string {
  if (cachedFirebaseApiKey) return cachedFirebaseApiKey;
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase configuration file is missing on server.');
  }
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as { apiKey?: string };
  if (!parsed.apiKey) {
    throw new Error('Firebase apiKey is missing in firebase-applet-config.json.');
  }
  cachedFirebaseApiKey = parsed.apiKey;
  return cachedFirebaseApiKey;
}

/**
 * Verifies the caller's Firebase ID token from the Authorization: Bearer header
 * via Firebase Identity Toolkit accounts:lookup before allowing AI endpoint usage.
 */
export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Please sign in and try again.' });
      return;
    }

    const idToken = authHeader.slice(7).trim();
    if (!idToken || idToken.length > 4096) {
      res.status(401).json({ error: 'Invalid authentication token.' });
      return;
    }

    const apiKey = getFirebaseWebApiKey();
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!lookupRes.ok) {
      res.status(401).json({ error: 'Your session expired or is invalid. Please sign in again.' });
      return;
    }

    const lookupData = (await lookupRes.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };

    const firebaseUser = lookupData.users?.[0];
    if (!firebaseUser?.localId) {
      res.status(401).json({ error: 'Unable to verify your student account. Please sign in again.' });
      return;
    }

    if (!firebaseUser.emailVerified) {
      res.status(403).json({
        error: 'Please verify your email address before running AI resume analysis.',
      });
      return;
    }

    req.user = {
      uid: firebaseUser.localId,
      email: firebaseUser.email ?? '',
      emailVerified: Boolean(firebaseUser.emailVerified),
    };

    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Authentication service check failed. Please try again.' });
  }
}

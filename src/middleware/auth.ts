import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { sessions, users } from '../db/schema.ts';
import { eq, and, isNull, gt } from 'drizzle-orm';

export interface AppUserPayload {
  uid: string;
  email: string;
  role: 'seller' | 'admin' | 'buyer' | 'agent';
  displayName?: string;
  username?: string;
  storeId?: number;
}

export interface AuthRequest extends Request {
  user?: AppUserPayload;
}

/**
 * Validates either a cryptographic server session token (sb_sess_*) stored in PostgreSQL
 * or a verified Firebase ID token. Rejects any fabricated or unverified tokens with 401.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    // 1. Verify against cryptographic server-issued session store
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    const sessionRows = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.sessionTokenHash, tokenHash),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now)
        )
      );

    if (sessionRows.length > 0) {
      const activeSession = sessionRows[0];
      const userRows = await db.select().from(users).where(eq(users.uid, activeSession.userUid));
      if (userRows.length === 0) {
        return res.status(401).json({ error: 'Unauthorized: User account not found' });
      }
      const user = userRows[0];
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Forbidden: Account suspended by administrator' });
      }

      req.user = {
        uid: user.uid,
        email: user.email,
        role: user.role as 'seller' | 'admin' | 'buyer' | 'agent',
        displayName: user.fullName || user.username || user.email,
        username: user.username,
      };
      return next();
    }

    // 2. Verify with Firebase Admin if token is not an internal session
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      // Resolve user role from database
      const [dbUser] = await db.select().from(users).where(eq(users.uid, decoded.uid));
      req.user = {
        uid: decoded.uid,
        email: decoded.email || dbUser?.email || '',
        role: (dbUser?.role || 'seller') as 'seller' | 'admin' | 'buyer' | 'agent',
        displayName: decoded.name || dbUser?.fullName || decoded.email,
        username: dbUser?.username,
      };
      return next();
    } catch {
      // Firebase verification failed
    }

    // 3. Neither valid session nor Firebase token
    return res.status(401).json({ error: 'Unauthorized: Invalid, expired, or unverified credentials' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized: Authentication verification failed' });
  }
};

/**
 * Route-level guard for Admin endpoints. Enforces role === 'admin' fail-closed.
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrative governance privilege required' });
  }
  next();
};

/**
 * Route-level guard for Seller endpoints. Enforces role === 'seller' or 'admin'.
 */
export const requireSeller = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden: Seller tenant privilege required' });
  }
  next();
};

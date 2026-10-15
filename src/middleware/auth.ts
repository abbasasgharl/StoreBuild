import type express from 'express';
type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { sessions, users, stores } from '../db/schema.ts';
import { eq, and, isNull, gt } from 'drizzle-orm';

export interface AppUserPayload {
  uid: string;
  email: string;
  role: 'seller' | 'admin' | 'buyer' | 'agent';
  displayName?: string;
  username?: string;
  storeId?: number;
  storeSlug?: string;
}

export interface AuthRequest extends Request {
  user?: AppUserPayload;
}

/**
 * Server-authoritative authentication middleware.
 * - Validates cryptographic server-issued session tokens (sb_sess_*) stored in database
 *   or verified Firebase ID tokens resolved against active users.
 * - Rejects any fabricated tokens, expired sessions, or revoked sessions.
 * - Strips any client-supplied role or identity overrides (e.g. req.body.actorRole, req.body.uid).
 * - Derives role, permissions, and tenant storeId strictly from server database records.
 * - Unknown identities receive 401 Unauthorized (fail-closed, no default seller role).
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Security hygiene: eliminate any client-injected role / identity overrides
  if (req.body && typeof req.body === 'object') {
    delete req.body.actorRole;
    delete req.body.role;
    delete req.body.isSuperAdmin;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header. Real session required.' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty bearer token provided.' });
  }

  // Reject synthesized demo session tokens immediately
  if (token.startsWith('demo-session-')) {
    return res.status(401).json({ error: 'Unauthorized: Fabricated demo tokens are prohibited. Please log in with active credentials.' });
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
        return res.status(401).json({ error: 'Unauthorized: Session owner identity not found in database.' });
      }

      const user = userRows[0];
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Forbidden: Account suspended by administrator.' });
      }

      // Resolve store tenant scope if user is a seller
      let storeId: number | undefined;
      let storeSlug: string | undefined;
      if (user.role === 'seller') {
        const [store] = await db.select().from(stores).where(eq(stores.sellerId, user.id));
        if (store) {
          storeId = store.id;
          storeSlug = store.slug;
        }
      }

      req.user = {
        uid: user.uid,
        email: user.email,
        role: user.role as 'seller' | 'admin' | 'buyer' | 'agent',
        displayName: user.fullName || user.username || user.email,
        username: user.username,
        storeId,
        storeSlug,
      };

      return next();
    }

    // 2. Verify with Firebase Admin if token is not an internal session
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      
      // Resolve user role strictly from server-side database
      const [dbUser] = await db.select().from(users).where(eq(users.uid, decoded.uid));
      if (!dbUser) {
        // Unknown Firebase identities MUST NOT default to seller: fail closed (N006)
        return res.status(401).json({ error: 'Unauthorized: Authenticated identity has no active tenant profile.' });
      }

      if (dbUser.status === 'suspended') {
        return res.status(403).json({ error: 'Forbidden: Account suspended by administrator.' });
      }

      let storeId: number | undefined;
      let storeSlug: string | undefined;
      if (dbUser.role === 'seller') {
        const [store] = await db.select().from(stores).where(eq(stores.sellerId, dbUser.id));
        if (store) {
          storeId = store.id;
          storeSlug = store.slug;
        }
      }

      req.user = {
        uid: dbUser.uid,
        email: dbUser.email || decoded.email || '',
        role: dbUser.role as 'seller' | 'admin' | 'buyer' | 'agent',
        displayName: dbUser.fullName || decoded.name || dbUser.email,
        username: dbUser.username,
        storeId,
        storeSlug,
      };

      return next();
    } catch {
      // Firebase token verification rejected
    }

    // 3. Fall-through: Neither valid database session nor verified Firebase ID token
    return res.status(401).json({ error: 'Unauthorized: Invalid, expired, or unverified session credentials.' });
  } catch (error) {
    console.error('Authentication verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Authentication verification failed.' });
  }
};

/**
 * Route-level guard for Admin endpoints.
 * Strictly verifies role === 'admin' derived exclusively from validated database state.
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrative governance privilege required.' });
  }
  next();
};

/**
 * Route-level guard for Seller endpoints.
 * Strictly verifies role === 'seller' or 'admin' derived exclusively from validated database state.
 */
export const requireSeller = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden: Active seller tenant privilege required.' });
  }
  next();
};

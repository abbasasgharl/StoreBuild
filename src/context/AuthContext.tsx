import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

export interface AuthSession {
  uid: string;
  email: string;
  displayName: string;
  role: 'seller' | 'admin' | 'buyer' | 'agent';
  token: string;
  username?: string;
  storeSlug?: string;
  storeId?: number;
}

export interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginSellerWithCredentials: (payload: {
    identifier: string;
    password?: string;
    otpCode?: string;
  }) => Promise<AuthSession>;
  loginAdminWithCredentials: (payload: {
    usernameOrEmail: string;
    password: string;
    twoFactorCode?: string;
  }) => Promise<AuthSession>;
  loginAdminWith2FA: (payload: {
    usernameOrEmail: string;
    password: string;
    twoFactorCode?: string;
  }) => Promise<AuthSession>;
  signOutUser: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

/**
 * Validates whether a cached session in sessionStorage is an authentic server-issued token.
 * Non-negotiable N001: Clean browser visits or legacy demo tokens default strictly to signed-out (null).
 */
const getInitialSession = (): AuthSession | null => {
  try {
    const raw = sessionStorage.getItem('storebuild_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.token === 'string' &&
        parsed.token.trim().length > 0 &&
        !parsed.token.startsWith('demo-session-') &&
        parsed.uid &&
        parsed.role
      ) {
        return parsed as AuthSession;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  // Clean browser visits MUST be strictly logged out by default
  return null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(getInitialSession);
  const [loading, setLoading] = useState<boolean>(false);

  const setSession = useCallback((newSession: AuthSession | null) => {
    setSessionState(newSession);
    try {
      if (newSession && newSession.token && !newSession.token.startsWith('demo-session-')) {
        sessionStorage.setItem('storebuild_auth_session', JSON.stringify(newSession));
      } else {
        sessionStorage.removeItem('storebuild_auth_session');
      }
    } catch {
      // Ignore sessionStorage exceptions
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          // Verify with backend to resolve server-authoritative role and storeId
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            setSession({
              uid: data.uid || fbUser.uid,
              email: data.email || fbUser.email || '',
              displayName: data.displayName || fbUser.displayName || 'Seller',
              role: data.role || 'seller',
              token: idToken,
              username: data.username,
              storeSlug: data.storeSlug,
              storeId: data.storeId,
            });
          } else {
            // Unregistered user in database: do not synthesize role or session
            setSession(null);
          }
        } catch (err) {
          console.error('Failed to resolve Firebase authenticated user:', err);
          setSession(null);
        }
      }
    });
    return () => unsubscribe();
  }, [setSession]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'User account not authorized or registered in platform database.');
      }

      const data = await res.json();
      const verifiedSession: AuthSession = {
        uid: data.uid || result.user.uid,
        email: data.email || result.user.email || '',
        displayName: data.displayName || result.user.displayName || 'Seller',
        role: data.role || 'seller',
        token: idToken,
        username: data.username,
        storeSlug: data.storeSlug,
        storeId: data.storeId,
      };

      setSession(verifiedSession);
    } finally {
      setLoading(false);
    }
  };

  const loginSellerWithCredentials = async (payload: {
    identifier: string;
    password?: string;
    otpCode?: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/seller-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Seller authentication failed. Invalid credentials.');
      }
      setSession(data);
      return data as AuthSession;
    } finally {
      setLoading(false);
    }
  };

  const loginAdminWithCredentials = async (payload: {
    usernameOrEmail: string;
    password: string;
    twoFactorCode?: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "That email or password isn't right. Please try again.");
      }
      setSession(data);
      return data as AuthSession;
    } finally {
      setLoading(false);
    }
  };

  const loginAdminWith2FA = loginAdminWithCredentials;

  const signOutUser = async () => {
    setLoading(true);
    try {
      if (session?.token && session.token.startsWith('sb_sess_')) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {});
      }
      await fbSignOut(auth).catch(() => {});
    } finally {
      try {
        sessionStorage.removeItem('storebuild_auth_session');
      } catch {
        // Ignore
      }
      setSession(null);
      setLoading(false);
    }
  };

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (session?.token) {
        headers.set('Authorization', `Bearer ${session.token}`);
      }
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [session]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signInWithGoogle,
        loginSellerWithCredentials,
        loginAdminWithCredentials,
        loginAdminWith2FA,
        signOutUser,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

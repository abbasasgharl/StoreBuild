import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';

export interface AuthSession {
  uid: string;
  email: string;
  username?: string;
  displayName: string;
  role: 'seller' | 'admin';
  token: string;
  storeSlug?: string;
}

interface AuthContextValue {
  session: AuthSession;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginSellerWithCredentials: (payload: {
    identifier: string;
    password?: string;
    otpCode?: string;
  }) => Promise<AuthSession>;
  loginAdminWith2FA: (payload: {
    usernameOrEmail: string;
    password: string;
    twoFactorCode: string;
  }) => Promise<AuthSession>;
  switchDemoPersona: (
    persona: 'velora' | 'arastudio' | 'admin' | { uid: string; email: string; name: string }
  ) => void;
  signOutUser: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const DEFAULT_VELORA_SESSION: AuthSession = {
  uid: 'seller-velora-uid',
  email: 'founder@veloraboutique.in',
  username: 'velora_founder',
  displayName: 'Ananya Verma (Velora Atelier)',
  role: 'seller',
  token: 'demo-session-seller-velora-uid:founder@veloraboutique.in',
  storeSlug: 'velora',
};

const getInitialSession = (): AuthSession => {
  try {
    const raw = sessionStorage.getItem('velora_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token && parsed.role) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_VELORA_SESSION;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession>(getInitialSession);
  const [loading, setLoading] = useState<boolean>(false);

  const setSession = useCallback((newSession: AuthSession) => {
    setSessionState(newSession);
    try {
      sessionStorage.setItem('velora_auth_session', JSON.stringify(newSession));
    } catch {
      // Ignore sessionStorage error
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setSession({
            uid: fbUser.uid,
            email: fbUser.email || 'entrepreneur@platform.com',
            displayName: fbUser.displayName || fbUser.email || 'Entrepreneur',
            role: 'seller',
            token: idToken,
          });
        } catch (err) {
          console.error('Failed to get Firebase ID token:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setSession({
        uid: result.user.uid,
        email: result.user.email || 'entrepreneur@platform.com',
        displayName: result.user.displayName || 'Entrepreneur',
        role: 'seller',
        token: idToken,
      });
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
        throw new Error(data.error || 'Seller authentication failed');
      }
      setSession(data);
      return data as AuthSession;
    } finally {
      setLoading(false);
    }
  };

  const loginAdminWith2FA = async (payload: {
    usernameOrEmail: string;
    password: string;
    twoFactorCode: string;
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
        throw new Error(data.error || 'Admin 2FA authentication failed');
      }
      setSession(data);
      return data as AuthSession;
    } finally {
      setLoading(false);
    }
  };

  const switchDemoPersona = useCallback(
    (persona: 'velora' | 'arastudio' | 'admin' | { uid: string; email: string; name: string }) => {
      if (persona === 'velora') {
        setSession(DEFAULT_VELORA_SESSION);
      } else if (persona === 'arastudio') {
        setSession({
          uid: 'seller-arastudio-uid',
          email: 'kabir@arastudio.co',
          username: 'arastudio_kabir',
          displayName: 'Kabir Sen (Ara Studio)',
          role: 'seller',
          token: 'demo-session-seller-arastudio-uid:kabir@arastudio.co',
          storeSlug: 'arastudio',
        });
      } else if (persona === 'admin') {
        setSession({
          uid: 'admin-console-root',
          email: 'compliance@platform.com',
          username: 'admin_root',
          displayName: 'Platform Risk & Payout Admin',
          role: 'admin',
          token: 'demo-session-admin-console-root:compliance@platform.com',
        });
      } else {
        setSession({
          uid: persona.uid,
          email: persona.email,
          displayName: persona.name,
          role: 'seller',
          token: `demo-session-${persona.uid}:${persona.email}`,
        });
      }
    },
    []
  );

  const signOutUser = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore if demo session
    }
    try {
      sessionStorage.removeItem('velora_auth_session');
    } catch {
      // ignore
    }
    setSession(DEFAULT_VELORA_SESSION);
  };

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${session.token}`);
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [session.token]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signInWithGoogle,
        loginSellerWithCredentials,
        loginAdminWith2FA,
        switchDemoPersona,
        signOutUser,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

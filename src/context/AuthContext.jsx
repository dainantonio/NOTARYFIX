import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { hasFirebaseConfig, refreshIdToken, signInWithGoogleIdToken, signInWithPassword } from '../services/firebaseRest';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'notaryfix_auth';

const decodeJwt = (jwt) => {
  try {
    const base64 = jwt.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const boot = async () => {
      if (!hasFirebaseConfig) {
        setLoading(false);
        return;
      }
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed?.refreshToken) return;
        const refreshed = await refreshIdToken(parsed.refreshToken);
        const idToken = refreshed.id_token;
        const claims = decodeJwt(idToken);
        const next = {
          uid: refreshed.user_id,
          email: claims?.email || parsed.email || '',
          idToken,
          refreshToken: refreshed.refresh_token,
          expiresAt: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
        setSession(next);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const signInEmail = async (email, password) => {
    setError('');
    if (!hasFirebaseConfig) throw new Error('Auth is not configured. Add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID to .env.local.');
    const res = await signInWithPassword({ email, password });
    const next = {
      uid: res.localId,
      email: res.email,
      idToken: res.idToken,
      refreshToken: res.refreshToken,
      expiresAt: Date.now() + Number(res.expiresIn || 3600) * 1000,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  };

  const signInGoogle = async () => {
    setError('');
    if (!hasFirebaseConfig) throw new Error('Google sign-in unavailable until Firebase env vars are configured.');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('Google sign-in unavailable: missing VITE_GOOGLE_CLIENT_ID.');
    if (!window.google?.accounts?.id) throw new Error('Google script not loaded yet.');

    const googleIdToken = await new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => {
            if (resp?.credential) resolve(resp.credential);
            else reject(new Error('Google token not returned'));
          },
        });
        window.google.accounts.id.prompt((n) => {
          if (n.isNotDisplayed() || n.isSkippedMoment()) reject(new Error('Google Sign-In cancelled'));
        });
      } catch (e) {
        reject(e);
      }
    });

    const res = await signInWithGoogleIdToken({ idToken: googleIdToken });
    const next = {
      uid: res.localId,
      email: res.email,
      idToken: res.idToken,
      refreshToken: res.refreshToken,
      expiresAt: Date.now() + Number(res.expiresIn || 3600) * 1000,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  };

  const value = useMemo(() => ({
    user: session,
    loading,
    error,
    setError,
    signInEmail,
    signInGoogle,
    signOut,
    isAuthenticated: Boolean(session?.uid),
    hasFirebaseConfig,
    hasGoogleConfig: hasFirebaseConfig && hasGoogleClientId,
  }), [session, loading, error, hasGoogleClientId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

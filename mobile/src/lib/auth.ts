// mobile/src/lib/auth.ts
// Auth context + hook. Wraps Firebase Auth's onAuthStateChanged so the
// rest of the app can `useAuth()` to read user + loading.
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(email, password, displayName) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
    },
    async logout() {
      await signOut(auth);
    },
  };

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

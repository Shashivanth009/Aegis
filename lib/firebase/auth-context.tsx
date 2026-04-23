'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './client';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const roleDoc = await getDoc(doc(db, 'user_roles', firebaseUser.uid));
          setRole(roleDoc.exists() ? roleDoc.data().role : null);
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check for local admin session (cookie-based TOTP)
  useEffect(() => {
    if (!user && typeof document !== 'undefined') {
      const adminSession = document.cookie.includes('aageis_admin_ui');
      if (adminSession) {
        setRole('ADMIN');
        setUser({ email: 'local-admin@aageis' } as any);
      }
    }
  }, [user]);

  const handleSignOut = async () => {
    // 1. Sign out of Firebase Client
    await firebaseSignOut(auth);
    
    // 2. Clear secure server cookies via API
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to clear server session:', err);
    }

    // 3. Reset local state
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncAuthState(nextSession: Session | null) {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', nextSession.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!active) return;

      if (error && error.code !== 'PGRST116' && import.meta.env.DEV) {
        console.warn('Failed to resolve admin role:', error.message);
      }

      setIsAdmin(Boolean(data));
      setIsLoading(false);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        void syncAuthState(data.session ?? null);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setIsLoading(true);
      void syncAuthState(nextSession ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAdmin,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [isAdmin, isLoading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

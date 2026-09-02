'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { User } from '@/types';
import { createClient } from '@/utils/supabase/client';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  registerWithEmail: (email: string, password: string, name?: string, phone?: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const supabase = createClient();

// In-memory set of user IDs that have been synced during this browser session
const syncedUserIds = new Set<string>();

/**
 * Sync Supabase auth user to the app's `users` table.
 * Runs in background to ensure database row exists for orders/wishlist.
 */
async function syncUserToDatabase(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Promise<User> {
  const fallbackUser: User = {
    id: supabaseUser.id,
    name: (supabaseUser.user_metadata?.full_name as string) 
      || (supabaseUser.user_metadata?.name as string) 
      || supabaseUser.email?.split('@')[0] 
      || 'User',
    email: supabaseUser.email || '',
    image: (supabaseUser.user_metadata?.avatar_url as string) || null,
    role: 'customer',
  };

  // If already synced during this session, return cached or fallback
  if (syncedUserIds.has(supabaseUser.id)) {
    const stored = localStorage.getItem('tenali_user');
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return fallbackUser;
  }

  syncedUserIds.add(supabaseUser.id);

  try {
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: supabaseUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        image: fallbackUser.image,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const synced = data.user || fallbackUser;
      localStorage.setItem('tenali_user', JSON.stringify(synced));
      return synced;
    }
  } catch (err) {
    console.error('Background user sync error:', err);
  }

  localStorage.setItem('tenali_user', JSON.stringify(fallbackUser));
  return fallbackUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    // Load initial stored user optimistically
    const storedUser = localStorage.getItem('tenali_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('tenali_user');
      }
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Set optimistic user immediately
          const optimisticUser: User = {
            id: session.user.id,
            name: (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            image: (session.user.user_metadata?.avatar_url as string) || null,
            role: 'customer',
          };

          if (isMounted.current) {
            setUser(prev => prev || optimisticUser);
            setIsLoading(false);
          }

          // Sync in background without blocking UI
          syncUserToDatabase(session.user).then(syncedUser => {
            if (isMounted.current && syncedUser) {
              setUser(syncedUser);
            }
          });
        } else {
          if (isMounted.current) setIsLoading(false);
        }
      } catch (e) {
        console.error('Failed to initialize auth:', e);
        if (isMounted.current) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const optimisticUser: User = {
            id: session.user.id,
            name: (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            image: (session.user.user_metadata?.avatar_url as string) || null,
            role: 'customer',
          };

          setUser(optimisticUser);
          setIsLoading(false);

          // Sync in background
          syncUserToDatabase(session.user).then(syncedUser => {
            if (syncedUser) setUser(syncedUser);
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('tenali_user');
          syncedUserIds.clear();
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Legacy login
  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('tenali_user', JSON.stringify(userData));
  }, []);

  // Email/password login via Supabase Auth & Database fallback
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    // 1. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const syncedUser = await syncUserToDatabase(data.user);
        login(syncedUser);
        return {};
      }
    } catch {
      // Continue to database auth
    }

    // 2. Direct database authentication via /api/auth/login
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Invalid email or password' };
      }
      if (data.user) {
        login(data.user);
        return {};
      }
      return { error: 'Authentication failed' };
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  }, [login]);

  // Email/password registration via Database & Supabase Auth
  const registerWithEmail = useCallback(async (email: string, password: string, name?: string, phone?: string): Promise<{ error?: string }> => {
    let supabaseUserId: string | null = null;

    // 1. Try Supabase Auth registration
    try {
      const { data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0],
            phone: phone || null,
          },
        },
      });
      if (data?.user) {
        supabaseUserId = data.user.id;
      }
    } catch (err) {
      console.warn('Supabase signUp notice:', err);
    }

    // 2. Create user in PostgreSQL database
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: supabaseUserId,
          name: name || email.split('@')[0],
          identifier: email,
          password,
          phone: phone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to create account' };
      }

      if (data.user) {
        login(data.user);
        return {};
      }

      return { error: 'Account created, please sign in' };
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  }, [login]);

  // Google OAuth login
  const loginWithGoogle = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('tenali_user');
    syncedUserIds.clear();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

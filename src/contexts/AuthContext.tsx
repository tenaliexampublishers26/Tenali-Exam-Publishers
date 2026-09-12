'use client';
import {
  createContext, useContext, useState, useEffect, useCallback,
  ReactNode, useRef, useMemo
} from 'react';
import { User } from '@/types';
import { createClient } from '@/utils/supabase/client';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// ─── Split Context Pattern ────────────────────────────────────────────────────
// PROBLEM: A single AuthContext with both user data AND action functions means
// any component that reads `user` re-renders when a login/logout function
// reference changes, and vice versa.
//
// SOLUTION: Two contexts:
//  - AuthStateContext  → stable user data (object)
//  - AuthActionsContext → stable callbacks (memo'd functions, rarely change)
//
// Components that only need user info: useAuthState() — no action re-renders
// Components that need both: useAuth() — convenience hook (existing API preserved)

interface AuthStateType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActionsType {
  login: (userData: User) => void;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  registerWithEmail: (email: string, password: string, name?: string, phone?: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthContextType extends AuthStateType, AuthActionsType {}

const AuthStateContext = createContext<AuthStateType | null>(null);
const AuthActionsContext = createContext<AuthActionsType | null>(null);

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

    // Load initial stored user optimistically to unblock dashboard navigation immediately
    const storedUser = localStorage.getItem('tenali_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUser(parsed);
          setIsLoading(false);
        }
      } catch {
        localStorage.removeItem('tenali_user');
      }
    }

    // Maximum 2.5s safety net: never allow isLoading to stay true indefinitely
    const safetyTimer = setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }, 2500);

    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 2000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

        if (session?.user) {
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
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // ─── Stable Action Callbacks ──────────────────────────────────────────────
  // useCallback ensures these function references don't change on re-render,
  // so components that receive them as props won't re-render unnecessarily.

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('tenali_user', JSON.stringify(userData));
  }, []);

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

  const registerWithEmail = useCallback(async (email: string, password: string, name?: string, phone?: string): Promise<{ error?: string }> => {
    let supabaseUserId: string | null = null;

    // 1. Try Supabase Auth registration
    try {
      const { data } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || email.split('@')[0], phone: phone || null } },
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

  const loginWithGoogle = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('tenali_user');
    localStorage.removeItem('tep_cart');
    syncedUserIds.clear();
  }, []);

  // ─── Memoized context values ───────────────────────────────────────────────
  // useMemo ensures the context object reference only changes when user/isLoading
  // actually changes — not on every render of AuthProvider's parent.
  const stateValue = useMemo<AuthStateType>(
    () => ({ user, isLoading, isAuthenticated: !!user }),
    [user, isLoading]
  );

  const actionsValue = useMemo<AuthActionsType>(
    () => ({ login, loginWithEmail, registerWithEmail, loginWithGoogle, logout }),
    [login, loginWithEmail, registerWithEmail, loginWithGoogle, logout]
  );

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

/** Full context (state + actions) — drop-in replacement for existing useAuth() callers */
export function useAuth(): AuthContextType {
  const state = useContext(AuthStateContext);
  const actions = useContext(AuthActionsContext);
  if (!state || !actions) throw new Error('useAuth must be used within AuthProvider');
  return { ...state, ...actions };
}

/** State-only hook — use in components that only read user data.
 *  Will NOT re-render when action function references change. */
export function useAuthState(): AuthStateType {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error('useAuthState must be used within AuthProvider');
  return ctx;
}

/** Actions-only hook — use in components that only trigger auth actions. */
export function useAuthActions(): AuthActionsType {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error('useAuthActions must be used within AuthProvider');
  return ctx;
}

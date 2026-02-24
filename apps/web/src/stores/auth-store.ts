/**
 * Auth store — Zustand store for authentication state.
 *
 * Manages the current user session, auth loading state,
 * and provides actions for sign-in, sign-up, and sign-out.
 */
import { create } from 'zustand';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

export interface AuthActions {
  /** Initialize auth state by checking current session */
  initialize: () => Promise<void>;
  /** Sign in with email + password */
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  /** Sign up with email + password (sends verification email) */
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  /** Sign in with OAuth provider (GitHub or Google) */
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: AuthError | null }>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Clear any error state */
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => {
  const supabase = createClient();

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    set({
      user: session?.user ?? null,
      session,
      loading: false,
    });
  });

  return {
    // State
    user: null,
    session: null,
    loading: true,
    initialized: false,
    error: null,

    // Actions
    initialize: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        set({
          user: session?.user ?? null,
          session,
          loading: false,
          initialized: true,
        });
      } catch {
        set({ loading: false, initialized: true });
      }
    },

    signInWithEmail: async (email: string, password: string) => {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ loading: false, error: error.message });
      }
      return { error };
    },

    signUpWithEmail: async (email: string, password: string) => {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        set({ loading: false, error: error.message });
      } else {
        set({ loading: false });
      }
      return { error };
    },

    signInWithOAuth: async (provider: 'github' | 'google') => {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        set({ loading: false, error: error.message });
      }
      return { error };
    },

    signOut: async () => {
      set({ loading: true, error: null });
      await supabase.auth.signOut();
      set({ user: null, session: null, loading: false });
    },

    clearError: () => set({ error: null }),
  };
});

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    if (!supabase) {
      console.error('Supabase client not initialized. Check your environment variables.');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Listen for auth changes
      const { data: { subscription } } = await supabase!.auth.onAuthStateChange(
        (_event: string, session: Session | null) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    getInitialSession();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in with email:', error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up with email:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      console.error('Error resetting password:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
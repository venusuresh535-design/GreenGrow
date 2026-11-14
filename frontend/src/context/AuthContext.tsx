import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isGuest: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName?: string, preferredLang?: string) => Promise<{ error?: string }>;
  signInDirectlyAsFarmer: (email: string, fullName?: string) => { success: boolean };
  resendConfirmationEmail: (email: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // 1. Check if user previously logged in directly as farmer
    const storedEmail = localStorage.getItem('greengrow_farmer_email');
    const storedGuest = localStorage.getItem('greengrow_is_guest');

    if (storedEmail && storedGuest !== 'true') {
      const name = localStorage.getItem('greengrow_farmer_name') || storedEmail.split('@')[0];
      const localUser: any = {
        id: 'farmer_' + storedEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        email: storedEmail,
        user_metadata: { full_name: name },
      };
      setUser(localUser);
      setToken(localStorage.getItem('greengrow_auth_token') || 'token_' + Date.now());
      setIsGuest(false);
      setLoading(false);
      return;
    }

    if (storedGuest === 'true') {
      setIsGuest(true);
    }

    if (!isSupabaseConfigured || !supabase) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    // Check active session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setToken(session.access_token);
        setIsGuest(false);
      } else {
        if (!storedEmail) {
          setIsGuest(true);
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setToken(session.access_token);
        setIsGuest(false);
        localStorage.removeItem('greengrow_is_guest');
        if (session.user.email) {
          localStorage.setItem('greengrow_farmer_email', session.user.email);
        }
      } else if (!localStorage.getItem('greengrow_farmer_email')) {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInDirectlyAsFarmer = (email: string, fullName?: string) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return { success: false };
    const name = fullName || cleanEmail.split('@')[0] || 'Farmer';
    const localUser: any = {
      id: 'farmer_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      email: cleanEmail,
      user_metadata: {
        full_name: name,
      },
    };
    setUser(localUser);
    const fakeToken = 'token_' + Date.now();
    setToken(fakeToken);
    setIsGuest(false);
    localStorage.setItem('greengrow_farmer_email', cleanEmail);
    localStorage.setItem('greengrow_farmer_name', name);
    localStorage.setItem('greengrow_auth_token', fakeToken);
    localStorage.removeItem('greengrow_is_guest');
    return { success: true };
  };

  const resendConfirmationEmail = async (email: string) => {
    if (!supabase) return { error: 'Authentication service not connected.' };
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) {
        return { error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { error: err.message || 'Failed to resend confirmation email.' };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      signInDirectlyAsFarmer(email);
      return {};
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    if (data?.user?.email) {
      localStorage.setItem('greengrow_farmer_email', data.user.email);
    }
    setIsGuest(false);
    localStorage.removeItem('greengrow_is_guest');
    return {};
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string, preferredLang?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      signInDirectlyAsFarmer(email, fullName);
      return {};
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Farmer',
          preferred_language: preferredLang || 'en',
        },
      },
    });

    if (error) {
      // If user already registered in Supabase, sign them in directly!
      if (error.message.includes('already registered')) {
        signInDirectlyAsFarmer(email, fullName);
        return {};
      }
      return { error: error.message };
    }

    // Auto-login locally so farmer isn't stranded by email verification link
    signInDirectlyAsFarmer(email, fullName);
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setToken(null);
    setIsGuest(true);
    localStorage.removeItem('greengrow_farmer_email');
    localStorage.removeItem('greengrow_farmer_name');
    localStorage.removeItem('greengrow_auth_token');
    localStorage.setItem('greengrow_is_guest', 'true');
  };

  const continueAsGuest = () => {
    setUser(null);
    setToken(null);
    setIsGuest(true);
    localStorage.removeItem('greengrow_farmer_email');
    localStorage.removeItem('greengrow_farmer_name');
    localStorage.removeItem('greengrow_auth_token');
    localStorage.setItem('greengrow_is_guest', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isGuest,
        signInWithEmail,
        signUpWithEmail,
        signInDirectlyAsFarmer,
        resendConfirmationEmail,
        signOut,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

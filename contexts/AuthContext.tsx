"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  supabase,
  getUserProfile,
  type UserProfile,
  type AuthUser,
} from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Timeout de seguridad para evitar carga infinita
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("⚠️ Auth loading timeout - forcing loading to false");
        setLoading(false);
      }
    }, 5000); // 5 segundos máximo

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted) {
          if (session?.user) {
            const profile = await getUserProfile(session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email!,
              profile,
            });
          } else {
            setUser(null);
          }
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state change:", event);
      
      if (!isMounted) return;

      try {
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          if (isMounted) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              profile,
            });
          }
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // No necesitamos setear el user aquí porque onAuthStateChange lo manejará
    // Esto evita la doble carga del perfil
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.profile?.role === "admin";
  const isUser = user?.profile?.role === "user";

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

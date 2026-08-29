"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: "github" | "google") => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoaded: false,
  isSignedIn: false,
  signOut: async () => {},
  signInWithOAuth: async () => ({ error: null }),
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const session = data?.session ?? null;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const signInWithOAuth = async (provider: "github" | "google") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/bookmarks`,
      },
    });
    return { error };
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithPassword = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/bookmarks` : undefined,
        data: {
          full_name: name,
        },
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoaded,
        isSignedIn: !!user,
        signOut,
        signInWithOAuth,
        signInWithPassword,
        signUpWithPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const useUser = () => {
  const { user, isLoaded, isSignedIn } = useAuth();
  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
          firstName: (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User").split(" ")[0],
          primaryEmailAddress: { emailAddress: user.email },
          imageUrl: user.user_metadata?.avatar_url || null,
        }
      : null,
    isLoaded,
    isSignedIn,
  };
};

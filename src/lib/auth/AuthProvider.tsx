"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureDatabaseSeeded } from "@/lib/supabase/seeder";
import { appMemoryCache } from "@/lib/cache";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

export type UserRole = "user" | "superadmin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: "user",
  loading: true,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUserRoleAndSeed = async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      if (roleRow && roleRow.role === "superadmin") {
        setRole("superadmin");
      } else {
        setRole("user");
      }
    } catch (err) {
      setRole("user");
    }
    await ensureDatabaseSeeded(userId);
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        if (prevUserIdRef.current && prevUserIdRef.current !== session.user.id) {
          appMemoryCache.clear();
        }
        prevUserIdRef.current = session.user.id;
        await fetchUserRoleAndSeed(session.user.id);
      } else {
        setRole("user");
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session?.user?.id) {
          if (prevUserIdRef.current && prevUserIdRef.current !== session.user.id) {
            appMemoryCache.clear();
          }
          prevUserIdRef.current = session.user.id;
          await fetchUserRoleAndSeed(session.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        prevUserIdRef.current = null;
        appMemoryCache.clear();
        setRole("user");
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, user, pathname, router]);

  const signInWithEmail = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
    } else if (data.session?.user?.id) {
      appMemoryCache.clear();
      await fetchUserRoleAndSeed(data.session.user.id);
      toast.success("Signed in successfully!");
      router.replace("/");
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
    } else {
      if (data.session?.user?.id) {
        appMemoryCache.clear();
        // Insert user role explicitly if trigger didn't catch
        await supabase.from("user_roles").upsert({ user_id: data.session.user.id, role: "user" });
        await fetchUserRoleAndSeed(data.session.user.id);
        router.replace("/");
      }
      toast.success("Account created! Welcome to LifeLog.");
    }
    return { error };
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    appMemoryCache.clear();
    setUser(null);
    setSession(null);
    setRole("user");
    toast.info("Signed out");
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

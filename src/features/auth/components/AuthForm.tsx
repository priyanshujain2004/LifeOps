"use client";

import React, { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"SIGNIN" | "SIGNUP" | "MAGIC">("SIGNIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "MAGIC") {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Magic Link sent! Check your inbox.");
      } else if (mode === "SIGNUP") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Account created! You can now log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Logged in successfully!");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
          ⚡
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome to LifeLog</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personal Routine, Mobility & Expense Tracker with Real-Time Cloud Sync
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMode("SIGNIN")}
          className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === "SIGNIN" ? "bg-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode("SIGNUP")}
          className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === "SIGNUP" ? "bg-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Sign Up
        </button>
        <button
          onClick={() => setMode("MAGIC")}
          className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === "MAGIC" ? "bg-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {mode !== "MAGIC" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <span>
            {loading ? "Authenticating..." : mode === "SIGNIN" ? "Sign In to Account" : mode === "SIGNUP" ? "Create Free Account" : "Send Magic Link OTP"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500 pt-2 font-mono border-t border-slate-200 dark:border-slate-800">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>100% Production Grade Cloud & Offline Sync</span>
      </div>
    </div>
  );
}

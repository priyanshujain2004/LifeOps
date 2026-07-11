import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Provide safe defaults during local dev or UI build before env vars are populated
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl.includes("placeholder");

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // If running locally without Supabase configured yet, instantly resolve in 1ms instead of 4s DNS timeout
  if (isPlaceholder) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If Supabase is configured, add a 3.5s timeout circuit-breaker so network drops don't freeze UI
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    // Return empty list on timeout/error so app works fast offline
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: customFetch,
    },
  });
}

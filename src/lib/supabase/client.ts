import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Provide safe defaults during local dev or UI build before env vars are populated
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co").trim().replace(/^['"]|['"]$/g, '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder").trim().replace(/^['"]|['"]$/g, '');

const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl.includes("placeholder");

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (isPlaceholder) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existingHeaders = input instanceof Request ? input.headers : init?.headers;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(input, {
      ...init,
      headers: existingHeaders || init?.headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

let browserClientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClientInstance) {
    const options = isPlaceholder 
      ? { global: { fetch: customFetch } }
      : {};
    browserClientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, options);
  }
  return browserClientInstance;
}

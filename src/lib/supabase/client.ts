import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : "https://placeholder.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

let clientInstance: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return clientInstance;
}
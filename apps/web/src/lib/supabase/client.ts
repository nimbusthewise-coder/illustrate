/**
 * Supabase browser client — use in Client Components ('use client').
 *
 * Creates a singleton Supabase client configured for browser use with
 * cookie-based session management via @supabase/ssr.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

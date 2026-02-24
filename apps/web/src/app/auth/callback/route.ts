/**
 * Auth callback route handler.
 *
 * Handles the OAuth redirect from Supabase Auth (GitHub, Google)
 * and email verification link callbacks.
 *
 * Flow:
 * 1. User clicks OAuth button → redirected to provider
 * 2. Provider redirects to Supabase → Supabase redirects here with `code` param
 * 3. We exchange the code for a session
 * 4. Redirect to the app (or to `next` param if provided)
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

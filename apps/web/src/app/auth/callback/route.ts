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
 * 
 * Based on official Supabase docs:
 * https://supabase.com/docs/guides/auth/social-login/auth-github
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force Node.js runtime (not Edge) for Supabase auth
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // If "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/';
  
  // Ensure next is a relative path for security
  if (!next.startsWith('/')) {
    next = '/';
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Check for x-forwarded-host (when behind load balancer/proxy like Vercel)
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        if (isLocalEnv) {
          // No load balancer in local dev
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          // Use forwarded host in production (Vercel)
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
      
      console.error('Auth code exchange failed:', error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    } catch (err) {
      console.error('Auth callback exception:', err);
      return NextResponse.redirect(`${origin}/login?error=callback_exception`);
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}

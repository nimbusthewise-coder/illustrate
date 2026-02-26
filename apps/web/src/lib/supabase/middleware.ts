/**
 * Supabase middleware helper — refreshes auth session on every request.
 *
 * This ensures the auth token stays fresh and prevents stale sessions.
 * Called from Next.js middleware (src/middleware.ts).
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // If Supabase env vars are missing, skip auth refresh
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase env vars missing, skipping auth refresh');
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the auth token
    await supabase.auth.getUser();

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware auth error:', error);
    return NextResponse.next({ request });
  }
}

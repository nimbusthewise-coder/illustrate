/**
 * Debug endpoint to check auth state
 * Visit: /api/debug/auth
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const sbCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      cookies: {
        total: allCookies.length,
        supabase: sbCookies.map(c => ({ name: c.name, length: c.value.length })),
      },
      session: session ? {
        user_id: session.user?.id,
        email: session.user?.email,
        expires_at: session.expires_at,
      } : null,
      sessionError: sessionError?.message || null,
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message || null,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Temporary debug component - shows client-side auth state
 * Add to any page to debug: <AuthDebug />
 */
export function AuthDebug() {
  const { user, session, loading, initialized } = useAuthStore();
  const [clientSession, setClientSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      else setClientSession(data.session);
    });
  }, []);

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-black/90 text-white text-xs font-mono rounded-lg max-w-sm z-50">
      <div className="font-bold mb-2">Auth Debug</div>
      <div>Store: {loading ? 'loading...' : initialized ? 'ready' : 'not init'}</div>
      <div>User: {user?.email || 'none'}</div>
      <div>Session: {session ? 'yes' : 'no'}</div>
      <div>---</div>
      <div>Client getSession:</div>
      <div>Session: {clientSession ? clientSession.user?.email : 'none'}</div>
      {error && <div className="text-red-400">Error: {error}</div>}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function UserMenu() {
  const router = useRouter();
  const { user, loading, signOut, initialize, initialized } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/');
  };

  if (loading || !initialized) {
    return (
      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-3 py-1.5 text-sm text-foreground hover:text-primary transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          
          <div className="py-1">
            <Link
              href="/library"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              My Diagrams
            </Link>
            <Link
              href="/editor"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              New Diagram
            </Link>
          </div>
          
          <div className="border-t border-border py-1">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

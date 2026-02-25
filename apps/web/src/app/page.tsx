'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeSelector } from '@/components/ThemeSelector';
import { LogoMark } from '@/components/icons';

export default function LandingPage() {
  const router = useRouter();
  const { user, initialize, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-xl font-bold text-foreground"></span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSelector />
            {user ? (
              <Link
                href="/editor"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Open Editor
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-foreground hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            ASCII diagrams,<br />beautifully simple
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create beautiful ASCII art diagrams, wireframes, and illustrations. 
            Perfect for documentation, README files, and anywhere you need text-based graphics.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={user ? "/editor" : "/signup"}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
            >
              {user ? "Open Editor" : "Start creating — it's free"}
            </Link>
            <Link
              href="/editor"
              className="px-8 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-lg"
            >
              Try without account
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 font-mono text-sm leading-relaxed flex justify-center">
            <pre className="text-foreground">{`┌───────────────────────────────────────────────────────┐
│                                                       │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐     │
│    │  Client  │────▶│   API    │────▶│ Database │     │
│    └──────────┘     └──────────┘     └──────────┘     │
│         │                │                │           │
│         │                │                │           │
│         ▼                ▼                ▼           │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐     │
│    │    UI    │     │  Cache   │     │  Backup  │     │
│    └──────────┘     └──────────┘     └──────────┘     │
│                                                       │
└───────────────────────────────────────────────────────┘`}</pre>
          </div>
          <p className="text-center text-muted-foreground mt-4">
            Create diagrams like this in minutes with our intuitive editor
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-foreground text-center mb-12">
            Everything you need
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✏️</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Intuitive Tools</h4>
              <p className="text-muted-foreground">
                Draw boxes, lines, arrows, and text with familiar tools. Photoshop-style shortcuts included.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">14 Beautiful Themes</h4>
              <p className="text-muted-foreground">
                From Moebius to Mondrian, pick a style that matches your aesthetic. Light and dark modes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Copy as Text</h4>
              <p className="text-muted-foreground">
                Export your diagrams as plain ASCII text. Paste directly into code, docs, or chat.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Component Library</h4>
              <p className="text-muted-foreground">
                Save reusable components and build your own library of ASCII building blocks.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Share Anywhere</h4>
              <p className="text-muted-foreground">
                Get a shareable link to your diagram. Embed it in docs or share with your team.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⌨️</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Keyboard First</h4>
              <p className="text-muted-foreground">
                Full keyboard shortcuts for power users. Undo, redo, copy, paste — it all just works.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to start drawing?
          </h3>
          <p className="text-muted-foreground mb-8">
            Create your first ASCII diagram in seconds. No credit card required.
          </p>
          <Link
            href={user ? "/editor" : "/signup"}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
          >
            {user ? "Open Editor" : "Get started for free"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2026 illustrate.md</p>
          <div className="flex items-center gap-6">
            <Link href="/library" className="hover:text-foreground transition-colors">Library</Link>
            <Link href="/editor" className="hover:text-foreground transition-colors">Editor</Link>
            <a href="https://github.com" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

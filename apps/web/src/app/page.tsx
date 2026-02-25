'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeSelector } from '@/components/ThemeSelector';
import { LogoMark } from '@/components/icons';

export default function LandingPage() {
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
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <LogoMark size={28} />
            <span className="text-xl font-bold text-foreground"></span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSelector />
            {user ? (
              <Link
                href="/editor"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm"
              >
                Open Editor
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-foreground hover:text-primary transition-colors text-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto">
          {/* ASCII Hero Art */}
          <pre className="text-primary text-[10px] sm:text-xs leading-tight mb-12 text-center overflow-x-auto">{`
██╗██╗     ██╗     ██╗   ██╗███████╗████████╗██████╗  █████╗ ████████╗███████╗
██║██║     ██║     ██║   ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
██║██║     ██║     ██║   ██║███████╗   ██║   ██████╔╝███████║   ██║   █████╗  
██║██║     ██║     ██║   ██║╚════██║   ██║   ██╔══██╗██╔══██║   ██║   ██╔══╝  
██║███████╗███████╗╚██████╔╝███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗
╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
          `.trim()}</pre>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 tracking-tight text-center">
            Draw diagrams with text.
            <br />
            <span className="text-muted-foreground">Share them anywhere.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-center">
            Create beautiful ASCII art diagrams, wireframes, and illustrations. 
            Perfect for documentation, README files, and anywhere you need text-based graphics.
          </p>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href={user ? "/editor" : "/signup"}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
            >
              {user ? "Open Editor" : "Start creating ──▶"}
            </Link>
            <Link
              href="/editor"
              className="px-6 py-3 border border-border text-foreground rounded-full hover:bg-muted transition-colors"
            >
              Try without account
            </Link>
          </div>
        </div>
      </section>

      {/* ASCII Divider - Centered
      <div className="text-center">
        <pre className="text-muted-foreground/30 text-xs inline-block">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</pre>
      </div>
 */}

      {/* Demo Preview 
      <section className="py-4 px-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          <pre className="text-foreground text-xs sm:text-sm leading-relaxed">{`┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│       ┌──────────┐         ┌──────────┐         ┌──────────┐        │
│       │  Client  │────────▶│   API    │────────▶│ Database │        │
│       └──────────┘         └──────────┘         └──────────┘        │
│            │                    │                    │              │
│            │                    │                    │              │
│            ▼                    ▼                    ▼              │
│       ┌──────────┐         ┌──────────┐         ┌──────────┐        │
│       │    UI    │         │  Cache   │         │  Backup  │        │
│       └──────────┘         └──────────┘         └──────────┘        │
│                                                                     │
│                Create diagrams like this in minutes                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘`}</pre>
        </div>
      </section>
*/}

      {/* ASCII Divider - Centered */}
      <div className="text-center">
        <pre className="text-muted-foreground/30 text-xs inline-block">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</pre>
      </div>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <pre className="text-muted-foreground text-xs mb-12">{`/ FEATURES`}</pre>
          
          <div className="space-y-12">
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <pre className="text-primary text-sm">■ 01</pre>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Intuitive drawing tools</h3>
                <p className="text-muted-foreground">
                  Draw boxes, lines, arrows, and text with familiar tools. 
                  Photoshop-style shortcuts included — M for marquee, V for move, B for brush.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <pre className="text-primary text-sm">■ 02</pre>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">14 beautiful themes</h3>
                <p className="text-muted-foreground">
                  From Moebius to Mondrian, pick a style that matches your aesthetic. 
                  Light and dark modes for every theme.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <pre className="text-primary text-sm">■ 03</pre>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Copy as plain text</h3>
                <p className="text-muted-foreground">
                  Export your diagrams as plain ASCII. Paste directly into code comments, 
                  documentation, Slack, or anywhere text goes.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <pre className="text-primary text-sm">■ 04</pre>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Component library</h3>
                <p className="text-muted-foreground">
                  Save reusable components and build your own library of ASCII building blocks.
                  Drag and drop to compose complex diagrams.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <pre className="text-primary text-sm">■ 05</pre>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Share and embed</h3>
                <p className="text-muted-foreground">
                  Get a shareable link to your diagram. Embed it in Notion, GitHub READMEs, 
                  or anywhere that renders images.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <pre className="text-primary text-sm">■ 06</pre>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Keyboard first</h3>
                <p className="text-muted-foreground">
                  Full keyboard shortcuts for power users. Undo, redo, copy, paste, 
                  layers, zoom — it all just works.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ASCII Divider - Centered */}
      <div className="text-center">
        <pre className="text-muted-foreground/30 text-xs inline-block">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</pre>
      </div>

      {/* Use Cases - 3x3 Grid */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <pre className="text-muted-foreground text-xs mb-12">{`/ USE CASES`}</pre>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. README Diagrams */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│  README diagram   │
├───────────────────┤
│  ┌────┐   ┌────┐  │
│  │src │──▶│dist│  │
│  └────┘   └────┘  │
└───────────────────┘`}</pre>
            </div>

            {/* 2. Architecture */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│   Architecture    │
├───────────────────┤
│   ┌─┐  ┌─┐  ┌─┐   │
│   │A│──│B│──│C│   │
│   └┬┘  └─┘  └┬┘   │
│    └────┬────┘    │
│        ┌┴┐        │
│        │D│        │
│        └─┘        │
└───────────────────┘`}</pre>
            </div>

            {/* 3. Wireframes */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│    Wireframes     │
├───────────────────┤
│ ┌───────────────┐ │
│ │▓▓▓ Header ▓▓▓▓│ │
│ ├────┬──────────┤ │
│ │Nav │ Content  │ │
│ │    │          │ │
│ └────┴──────────┘ │
└───────────────────┘`}</pre>
            </div>

            {/* 4. Flowcharts */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│    Flowcharts     │
├───────────────────┤
│      ┌─────┐      │
│      │Start│      │
│      └──┬──┘      │
│    ┌────▼────┐    │
│    │ Choice? │    │
│    └────┬────┘    │
│   Yes   │   No    │
└───────────────────┘`}</pre>
            </div>

            {/* 5. Sequence Diagrams */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│ Sequence Diagram  │
├───────────────────┤
│  User      Server │
│   │          │    │
│   │──request─▶    │
│   │          │    │
│   │◀─response─    │
│   │          │    │
└───────────────────┘`}</pre>
            </div>

            {/* 6. State Machines */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│  State Machine    │
├───────────────────┤
│                   │
│  ┌────┐   ┌────┐  │
│  │Idle│──▶│Run │  │
│  └────┘   └─┬──┘  │
│     ▲       │     │
│     └───────┘     │
│                   │
└───────────────────┘`}</pre>
            </div>

            {/* 7. Network Topology */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│ Network Topology  │
├───────────────────┤
│       ┌───┐       │
│       │ R │       │
│      /└───┘\\      │
│    ┌─┐     ┌─┐    │
│    │A│     │B│    │
│    └─┘     └─┘    │
└───────────────────┘`}</pre>
            </div>

            {/* 8. ER Diagrams */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│   ER Diagram      │
├───────────────────┤
│ ┌────┐    ┌────┐  │
│ │User│───<│Post│  │
│ └────┘    └────┘  │
│   │               │
│   └──<┌─────┐     │
│       │Role │     │
│       └─────┘     │
└───────────────────┘`}</pre>
            </div>

            {/* 9. ASCII Art */}
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
              <pre className="text-foreground text-[10px] leading-tight">{`┌───────────────────┐
│    ASCII Art      │
├───────────────────┤
│                   │
│    ╔═══════╗      │
│    ║ ◉   ◉ ║      │
│    ║   ▽   ║      │
│    ║ ╰───╯ ║      │
│    ╚═══════╝      │
│                   │
└───────────────────┘`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ASCII Divider - Centered */}
      <div className="text-center">
        <pre className="text-muted-foreground/30 text-xs inline-block">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</pre>
      </div>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <pre className="text-primary text-xs mb-8 inline-block">{`┌─────────────────────────────────┐
│   Ready to start drawing?       │
└─────────────────────────────────┘`}</pre>
          
          <p className="text-muted-foreground mb-8">
            Create your first ASCII diagram in seconds. No credit card required.
          </p>
          
          <Link
            href={user ? "/editor" : "/signup"}
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
          >
            {user ? "Open Editor" : "Get started for free ──▶"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2026 illustrate.md</p>
            <div className="flex items-center gap-6">
              <Link href="/docs/embedding" className="hover:text-foreground transition-colors">Docs</Link>
              <Link href="/library" className="hover:text-foreground transition-colors">Library</Link>
              <Link href="/editor" className="hover:text-foreground transition-colors">Editor</Link>
              <a href="https://github.com" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

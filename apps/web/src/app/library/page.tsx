'use client';

import { ThemeSelector } from '@/components/ThemeSelector';
import { DiagramLibrary } from '@/components/DiagramLibrary';

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              ← Back to Canvas
            </a>
            <h1 className="text-3xl font-bold">illustrate.md</h1>
          </div>
          <ThemeSelector />
        </header>

        <DiagramLibrary />
      </div>
    </main>
  );
}

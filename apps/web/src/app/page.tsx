'use client';

import { ThemeSelector } from '@/components/ThemeSelector';
import { LayerPanel } from '@/components/LayerPanel';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">illustrate.md</h1>
          <ThemeSelector />
        </header>

        <div className="flex gap-6">
          {/* Canvas area (placeholder) */}
          <div className="flex-1 bg-card border border-border rounded-lg p-6 min-h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Canvas</p>
          </div>

          {/* Right sidebar — Layer Panel */}
          <aside className="w-64 shrink-0">
            <LayerPanel />
          </aside>
        </div>
      </div>
    </main>
  );
}

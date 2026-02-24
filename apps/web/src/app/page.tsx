'use client';

import { ThemeSelector } from '@/components/ThemeSelector';
import { RightSidebar } from '@/components/RightSidebar';
import { ComponentCreationButton } from '@/components/ComponentCreationButton';
import { Canvas } from '@/components/Canvas';
import { ColorPicker } from '@/components/ColorPicker';
import { GridDimensionsConfig } from '@/components/GridDimensionsConfig';
import { ToolSelector } from '@/components/ToolSelector';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">illustrate.md</h1>
          <ThemeSelector />
        </header>

        <div className="flex gap-6">
          {/* Left sidebar — Tools and colors */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <ToolSelector />
            <ColorPicker />
            <GridDimensionsConfig />
          </div>

          {/* Canvas area */}
          <div className="flex-1 bg-card border border-border rounded-lg p-6 min-h-[600px] flex items-center justify-center overflow-auto">
            <Canvas />
          </div>

          {/* Right sidebar — Layers, Components, Properties */}
          <RightSidebar />
        </div>
      </div>

      {/* Floating action button for component creation */}
      <ComponentCreationButton />
    </main>
  );
}

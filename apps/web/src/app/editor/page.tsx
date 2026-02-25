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
    <main className="relative h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-bold">illustrate.md</h1>
        <ThemeSelector />
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Tools and colors */}
        <div className="w-72 flex-shrink-0 p-4 space-y-4 border-r border-border overflow-y-auto">
          <ToolSelector />
          <ColorPicker />
          <GridDimensionsConfig />
        </div>

        {/* Canvas area — fills remaining space */}
        <div className="flex-1 bg-muted/20 overflow-hidden">
          <Canvas />
        </div>

        {/* Right sidebar — Layers, Components, Properties */}
        <div className="w-80 flex-shrink-0 border-l border-border overflow-y-auto">
          <RightSidebar />
        </div>
      </div>

      {/* Floating action button for component creation */}
      <ComponentCreationButton />
    </main>
  );
}

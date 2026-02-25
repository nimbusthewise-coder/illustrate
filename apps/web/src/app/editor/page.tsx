'use client';

import Link from 'next/link';
import { ThemeSelector } from '@/components/ThemeSelector';
import { RightSidebar } from '@/components/RightSidebar';
import { ComponentCreationButton } from '@/components/ComponentCreationButton';
import { Canvas } from '@/components/Canvas';
import { ColorPicker } from '@/components/ColorPicker';
import { GridDimensionsConfig } from '@/components/GridDimensionsConfig';
import { ToolSelector } from '@/components/ToolSelector';
import { UserMenu } from '@/components/UserMenu';
import { LogoMark } from '@/components/icons';

export default function EditorPage() {
  return (
    <main className="relative h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-border flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:text-primary transition-colors">
          <LogoMark size={24} />
          <span>illustrate.md</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeSelector />
          <UserMenu />
        </div>
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

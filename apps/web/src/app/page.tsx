'use client';

import { ThemeSelector } from '@/components/ThemeSelector';
import { Canvas } from '@/components/Canvas';
import { GridSettings } from '@/components/GridSettings';
import { ColourPicker } from '@/components/ColourPicker';
import { LayerPanel } from '@/components/LayerPanel';
import { Toolbar } from '@/components/Toolbar';
import { ExportPanel } from '@/components/ExportPanel';
import { KeyboardHandler } from '@/components/KeyboardHandler';
import { SaveIndicator } from '@/components/SaveIndicator';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCloudPersistence } from '@/hooks/use-cloud-persistence';
import { useCanvasStore } from '@/stores/canvas-store';
import { useDocumentStore } from '@/stores/document-store';

export default function Home() {
  useKeyboardShortcuts();
  const { document } = useCanvasStore();
  const { currentDocumentId } = useDocumentStore();
  
  const { status, lastSaved, isOnline, save, error } = useCloudPersistence({
    documentId: currentDocumentId,
    autoSaveDelay: 2000, // 2 seconds
    enabled: !!currentDocumentId, // Only enable when we have a document ID
  });

  return (
    <main className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <KeyboardHandler />
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex-1">
          <h1 className="text-xl font-bold">illustrate.md</h1>
          <p className="text-xs text-muted-foreground">
            ASCII wireframing for human-AI collaboration
          </p>
        </div>
        {document && (
          <div className="mx-4">
            <SaveIndicator
              status={status}
              lastSaved={lastSaved}
              isOnline={isOnline}
              error={error}
              onManualSave={save}
            />
          </div>
        )}
        <ThemeSelector />
      </header>

      {/* Main content area - fills remaining viewport */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Toolbar - Fixed narrow sidebar */}
        <div className="w-[200px] flex-shrink-0 border-r border-border overflow-y-auto p-3">
          <Toolbar />
        </div>

        {/* Canvas - Fills remaining space */}
        <div className="flex-1 min-w-0 overflow-auto p-4">
          <Canvas />
        </div>

        {/* Settings Panel - Fixed width sidebar */}
        <div className="w-72 flex-shrink-0 border-l border-border overflow-y-auto p-3 space-y-4">
          <GridSettings />
          <ExportPanel />
          <LayerPanel />
          <ColourPicker />
        </div>
      </div>
    </main>
  );
}

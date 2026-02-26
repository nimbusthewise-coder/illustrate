'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDiagramStore, type DiagramItem } from '@/stores/diagram-store';
import { LogoMark } from '@/components/icons';
import { ThemeSelector } from '@/components/ThemeSelector';
import { loadDiagramFromCloud } from '@/lib/diagram-sync';

export default function DiagramViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const getDiagram = useDiagramStore((s) => s.getDiagram);
  const _loadFromStorage = useDiagramStore((s) => s._loadFromStorage);
  const selectDiagram = useDiagramStore((s) => s.selectDiagram);
  const markOpened = useDiagramStore((s) => s.markOpened);
  
  const [ascii, setAscii] = useState<string | null>(null);
  const [diagramName, setDiagramName] = useState<string>('');
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load diagrams from storage first
    _loadFromStorage();
    setLoaded(true);
  }, [_loadFromStorage]);

  useEffect(() => {
    if (!loaded) return;
    
    const loadAndRender = async () => {
      setIsLoading(true);
      
      // Try localStorage first
      let diagram: DiagramItem | null | undefined = getDiagram(id);
      
      // If not in localStorage, try Supabase
      if (!diagram) {
        try {
          diagram = await loadDiagramFromCloud(id);
        } catch (error) {
          console.error('Failed to load diagram from cloud:', error);
        }
      }
      
      setIsLoading(false);
      
      if (!diagram) {
        setNotFound(true);
        return;
      }
      
      setDiagramName(diagram.name);
      
      // Render ASCII from layers
      const { width, height, layers } = diagram;
      const composited: string[] = new Array(width * height).fill(' ');
      
      for (const layer of layers) {
        if (!layer.visible) continue;
        const { chars, width: bufWidth, height: bufHeight } = layer.buffer;
        
        for (let row = 0; row < Math.min(bufHeight, height); row++) {
          for (let col = 0; col < Math.min(bufWidth, width); col++) {
            const srcIdx = row * bufWidth + col;
            const dstIdx = row * width + col;
            const char = chars[srcIdx];
            if (char && char !== ' ') {
              composited[dstIdx] = char;
            }
          }
        }
      }
      
      // Convert to lines
      const lines: string[] = [];
      for (let row = 0; row < height; row++) {
        const start = row * width;
        const line = composited.slice(start, start + width).join('').trimEnd();
        lines.push(line);
      }
      
      // Trim trailing empty lines
      while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      setAscii(lines.join('\n'));
    };
    
    loadAndRender();
  }, [id, getDiagram, loaded]);

  const handleEdit = () => {
    // Select diagram and navigate to editor with ID in URL
    selectDiagram(id);
    markOpened(id);
    router.push(`/editor?load=${id}`);
  };

  const handleCopy = async () => {
    if (ascii) {
      await navigator.clipboard.writeText(ascii);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <pre className="text-primary text-xs mb-4">{`
┌─────────────────────────┐
│         404             │
│   Diagram not found     │
└─────────────────────────┘
          `.trim()}</pre>
          <p className="text-muted-foreground mb-4">
            This diagram doesn't exist or has been deleted.
          </p>
          <Link
            href="/editor"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm"
          >
            Create a new diagram
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <LogoMark size={28} />
            <span className="text-xl font-bold text-foreground">illustrate.md</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSelector />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{diagramName}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 border border-border text-foreground rounded-full hover:bg-muted transition-colors text-sm"
            >
              📋 Copy
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm"
            >
              ✏️ Edit
            </button>
          </div>
        </div>
        
        {/* Diagram Display */}
        <div className="bg-muted/30 rounded-lg p-8 flex justify-center">
          {isLoading ? (
            <div className="text-muted-foreground">Loading diagram...</div>
          ) : ascii ? (
            <pre className="text-foreground text-sm leading-relaxed">{ascii}</pre>
          ) : (
            <div className="text-muted-foreground">No content</div>
          )}
        </div>
        
        {/* Share URL */}
        <div className="mt-6 text-center">
          <code className="text-xs text-muted-foreground px-3 py-1.5 bg-muted rounded">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </code>
        </div>
      </main>
    </div>
  );
}

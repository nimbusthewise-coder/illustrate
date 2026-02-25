'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDiagramStore } from '@/stores/diagram-store';
import { useLayerStore } from '@/stores/layer-store';
import { useCanvasStore } from '@/stores/canvas-store';

type CopyState = 'idle' | 'copied' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface CopyButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  state: CopyState;
}

function CopyButton({ label, icon, onClick, state }: CopyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-1 text-xs rounded border transition-colors
        ${state === 'copied' 
          ? 'border-green-500 text-green-500 bg-green-500/10' 
          : state === 'error'
          ? 'border-red-500 text-red-500 bg-red-500/10'
          : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
        }
      `}
      title={label}
    >
      {state === 'copied' ? '✓' : state === 'error' ? '✗' : icon}
    </button>
  );
}

export function ShareBar() {
  const selectedDiagramId = useDiagramStore((s) => s.selectedDiagramId);
  const getDiagram = useDiagramStore((s) => s.getDiagram);
  const saveDiagram = useDiagramStore((s) => s.saveDiagram);
  const updateDiagram = useDiagramStore((s) => s.updateDiagram);
  const selectDiagram = useDiagramStore((s) => s.selectDiagram);
  const layers = useLayerStore((s) => s.layers);
  const { width, height } = useCanvasStore();
  
  const [linkState, setLinkState] = useState<CopyState>('idle');
  const [textState, setTextState] = useState<CopyState>('idle');
  const [markdownState, setMarkdownState] = useState<CopyState>('idle');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [diagramName, setDiagramName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Get current diagram or generate placeholder ID
  const diagram = selectedDiagramId ? getDiagram(selectedDiagramId) : null;
  const diagramId = diagram?.id ?? 'unsaved';
  const displayName = diagram?.name ?? 'Untitled';
  
  // Build share URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://illustrate.md';
  const shareUrl = diagramId !== 'unsaved' 
    ? `${baseUrl}/d/${diagramId}` 
    : `${baseUrl}/editor`;

  // Copy with feedback
  const copyWithFeedback = useCallback(async (
    text: string, 
    setState: (state: CopyState) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }, []);

  // Get ASCII text from current canvas
  const getAsciiText = useCallback(() => {
    // Composite all visible layers
    const composited: string[][] = Array.from({ length: height }, () => 
      Array(width).fill(' ')
    );
    
    for (const layer of layers) {
      if (!layer.visible) continue;
      const chars = layer.buffer.chars;
      for (let row = 0; row < Math.min(chars.length, height); row++) {
        for (let col = 0; col < Math.min(chars[row]?.length ?? 0, width); col++) {
          const char = chars[row][col];
          if (char && char !== ' ') {
            composited[row][col] = char;
          }
        }
      }
    }
    
    // Convert to string, trimming trailing whitespace per line
    return composited
      .map(row => row.join('').trimEnd())
      .join('\n')
      .trimEnd();
  }, [layers, width, height]);

  const handleCopyLink = () => copyWithFeedback(shareUrl, setLinkState);
  
  const handleCopyText = () => {
    const ascii = getAsciiText();
    copyWithFeedback(ascii, setTextState);
  };
  
  const handleCopyMarkdown = () => {
    const ascii = getAsciiText();
    const markdown = '```\n' + ascii + '\n```';
    copyWithFeedback(markdown, setMarkdownState);
  };

  const handleSave = useCallback(() => {
    setSaveState('saving');
    try {
      if (diagram) {
        // Update existing diagram
        updateDiagram(diagram.id, { layers, width, height });
      } else {
        // Create new diagram
        const name = diagramName.trim() || 'Untitled';
        const newDiagram = saveDiagram({ name, width, height, layers });
        selectDiagram(newDiagram.id);
        setDiagramName('');
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 2000);
    }
  }, [diagram, diagramName, layers, width, height, saveDiagram, updateDiagram, selectDiagram]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    handleSave();
  };

  // Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (diagramId === 'unsaved' && !isEditing) {
          setIsEditing(true);
        } else {
          handleSave();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [diagramId, isEditing, handleSave]);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
      {/* Save Button */}
      <button
        onClick={diagramId === 'unsaved' && !isEditing ? () => setIsEditing(true) : handleSave}
        disabled={saveState === 'saving'}
        className={`
          px-3 py-1 text-xs font-medium rounded-full transition-colors
          ${saveState === 'saved' 
            ? 'bg-green-500/20 text-green-500 border border-green-500/50' 
            : saveState === 'error'
            ? 'bg-red-500/20 text-red-500 border border-red-500/50'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }
        `}
      >
        {saveState === 'saving' ? '...' : saveState === 'saved' ? '✓ Saved' : saveState === 'error' ? '✗ Error' : 'Save'}
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-border" />

      {/* Name / URL Display */}
      <div className="flex items-center gap-2 text-xs">
        {isEditing ? (
          <form onSubmit={handleNameSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              placeholder="Diagram name..."
              className="px-2 py-0.5 text-xs bg-background border border-border rounded w-32 focus:outline-none focus:border-primary"
              autoFocus
              onBlur={() => {
                if (!diagramName.trim()) setIsEditing(false);
              }}
            />
            <button type="submit" className="text-primary hover:text-primary/80">
              ✓
            </button>
          </form>
        ) : (
          <span 
            className="text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => diagramId === 'unsaved' && setIsEditing(true)}
            title={diagramId === 'unsaved' ? 'Click to name and save' : displayName}
          >
            {diagramId === 'unsaved' ? (
              <span className="italic">unsaved — click to name</span>
            ) : (
              <code className="px-1.5 py-0.5 bg-background rounded text-foreground">
                /d/{diagramId.slice(0, 8)}
              </code>
            )}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-border" />

      {/* Copy Buttons */}
      <div className="flex items-center gap-1">
        <CopyButton
          label="Copy link"
          icon="🔗"
          onClick={handleCopyLink}
          state={linkState}
        />
        <CopyButton
          label="Copy as text"
          icon="📋"
          onClick={handleCopyText}
          state={textState}
        />
        <CopyButton
          label="Copy as markdown"
          icon="📝"
          onClick={handleCopyMarkdown}
          state={markdownState}
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDiagramStore } from '@/stores/diagram-store';
import { setDiagramPublic } from '@/lib/diagram-sync';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string;
}

type CopyState = 'idle' | 'copied' | 'error';

export function ShareModal({ isOpen, onClose, diagramId }: ShareModalProps) {
  const getDiagram = useDiagramStore((s) => s.getDiagram);
  const setIsPublic = useDiagramStore((s) => s.setIsPublic);
  
  const diagram = getDiagram(diagramId);
  const [isPublic, setIsPublicLocal] = useState(diagram?.isPublic ?? false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  // Sync local state when diagram changes
  useEffect(() => {
    if (diagram) {
      setIsPublicLocal(diagram.isPublic ?? false);
    }
  }, [diagram]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://illustrate.md';
  const shareUrl = `${baseUrl}/d/${diagramId}`;

  const handleTogglePublic = useCallback(async () => {
    if (!diagram || isUpdating) return;
    
    const newValue = !isPublic;
    setIsUpdating(true);
    
    try {
      const success = await setDiagramPublic(diagramId, newValue);
      if (success) {
        setIsPublicLocal(newValue);
        setIsPublic(diagramId, newValue);
      }
    } catch (error) {
      console.error('Failed to update public status:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [diagram, diagramId, isPublic, isUpdating, setIsPublic]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [shareUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  if (!isOpen || !diagram) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Share diagram"
    >
      <div
        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Share Diagram</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Share Link */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-muted text-foreground text-sm font-mono truncate">
                {shareUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${copyState === 'copied'
                    ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                    : copyState === 'error'
                    ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }
                `}
              >
                {copyState === 'copied' ? '✓ Copied' : copyState === 'error' ? '✗ Error' : 'Copy link'}
              </button>
            </div>
          </div>

          {/* Public Toggle */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Make publicly viewable
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {isPublic
                    ? 'Anyone with the link can view'
                    : 'Only you can view'}
                </div>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={handleTogglePublic}
                disabled={isUpdating}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isPublic ? 'bg-primary' : 'bg-muted'}
                `}
                role="switch"
                aria-checked={isPublic}
                aria-label="Toggle public visibility"
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${isPublic ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Status Message */}
          <div className={`
            text-xs px-3 py-2 rounded-md
            ${isPublic
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
              : 'bg-muted text-muted-foreground'
            }
          `}>
            {isPublic ? (
              <span>🌐 This diagram is public. Anyone with the link can view it.</span>
            ) : (
              <span>🔒 This diagram is private. Share the link after making it public.</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm hover:bg-muted/80"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

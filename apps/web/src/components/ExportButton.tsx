/**
 * ExportButton — F041: Plain ASCII Text Export + F045: Copy to Clipboard
 * 
 * Provides one-click export to plain ASCII text and clipboard functionality.
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useLayerStore } from '@/stores/layer-store';
import { ClipboardButton } from '@/components/ClipboardButton';
import { TerminalPreview } from '@/components/TerminalPreview';
import { useCanvasStore } from '@/stores/canvas-store';
import { createBuffer, setChar } from '@illustrate.md/core';
import type { CanvasDocument, Buffer } from '@illustrate.md/core';

export interface ExportButtonProps {
  className?: string;
}

/**
 * ExportButton component
 * 
 * Exports the current canvas as plain ASCII text to console and clipboard.
 */
export const ExportButton: React.FC<ExportButtonProps> = ({ className }) => {
  const exportToAscii = useLayerStore((state) => state.exportToAscii);
  const layers = useLayerStore((state) => state.layers);
  const { width, height } = useCanvasStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showTerminalPreview, setShowTerminalPreview] = useState(false);

  const handleExportToConsole = useCallback(() => {
    const ascii = exportToAscii();
    console.log('=== ASCII EXPORT ===');
    console.log(ascii);
    console.log('=== END EXPORT ===');
    alert('ASCII export logged to console. Check the browser console (F12).');
    setShowMenu(false);
  }, [exportToAscii]);

  const handleDownload = useCallback(() => {
    const ascii = exportToAscii();
    const blob = new Blob([ascii], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }, [exportToAscii]);

  // Create a CanvasDocument for the ClipboardButton
  const getCanvasDocument = useCallback((): CanvasDocument => {
    return {
      id: 'current-canvas',
      title: 'Current Diagram',
      width,
      height,
      layers: layers.map(layer => {
        // Convert layer store buffer to core Buffer type
        const coreBuffer = createBuffer(layer.buffer.width, layer.buffer.height);
        
        // Copy characters from layer store buffer to core buffer
        if (Array.isArray(layer.buffer.chars)) {
          for (let row = 0; row < layer.buffer.height; row++) {
            for (let col = 0; col < layer.buffer.width; col++) {
              const idx = row * layer.buffer.width + col;
              const char = layer.buffer.chars[idx] || ' ';
              setChar(coreBuffer, row, col, char);
            }
          }
        }
        
        return {
          id: layer.id,
          name: layer.name,
          parentId: null,
          visible: layer.visible,
          locked: layer.locked,
          x: 0,
          y: 0,
          buffer: coreBuffer
        };
      }),
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }, [width, height, layers]);

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={className || 'px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors'}
          type="button"
          aria-label="Export options"
        >
          Export ▾
        </button>
        
        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
              <div className="p-2 space-y-1">
                <div className="px-3 py-2">
                  <ClipboardButton 
                    document={getCanvasDocument()}
                    className="w-full justify-start"
                    onSuccess={() => setShowMenu(false)}
                  />
                </div>
                
                <button
                  onClick={() => {
                    setShowTerminalPreview(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm transition-colors"
                >
                  🖥️ Terminal Preview
                </button>
                
                <button
                  onClick={handleDownload}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm transition-colors"
                >
                  💾 Download as .txt
                </button>
                
                <button
                  onClick={handleExportToConsole}
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm transition-colors"
                >
                  📋 Log to Console
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Terminal Preview Modal */}
      {showTerminalPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowTerminalPreview(false)}
        >
          <div 
            className="bg-card border border-border rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Terminal Preview</h3>
              <button
                onClick={() => setShowTerminalPreview(false)}
                className="px-3 py-1 text-sm hover:bg-muted rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="p-6 overflow-auto">
              <TerminalPreview document={getCanvasDocument()} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButton;

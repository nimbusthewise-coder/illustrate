/**
 * Generation Preview Component
 * F026: Prompt-to-Flow Generation
 * 
 * Preview interface for reviewing generated flows before accepting.
 */

'use client';

import { useGenerationStore } from '@/stores/generationStore';
import { useFlowGeneration } from '@/hooks/useFlowGeneration';
import type { Buffer } from '@/lib/types';

/**
 * Convert web buffer to ASCII text
 */
function webBufferToAscii(buffer: Buffer): string {
  const rows: string[] = [];
  
  for (let row = 0; row < buffer.height; row++) {
    let rowStr = '';
    
    for (let col = 0; col < buffer.width; col++) {
      const index = row * buffer.width + col;
      rowStr += buffer.chars[index];
    }
    
    // Trim trailing whitespace from this row
    rows.push(rowStr.trimEnd());
  }
  
  // Join rows with newlines
  return rows.join('\n');
}

export interface GenerationPreviewProps {
  className?: string;
}

export function GenerationPreview({ className = '' }: GenerationPreviewProps) {
  const { activeGeneration, showPreview } = useGenerationStore();
  const { accept, reject, hasActiveFlow } = useFlowGeneration();

  if (!showPreview || !hasActiveFlow || !activeGeneration) {
    return null;
  }

  const spec = activeGeneration.specification;

  // Render the first layer as ASCII preview
  const previewAscii = activeGeneration.layers.length > 0
    ? webBufferToAscii(activeGeneration.layers[0].buffer)
    : '';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${className}`}>
      <div className="w-full max-w-5xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{spec.title}</h2>
            {spec.description && (
              <p className="text-sm text-muted-foreground mt-1">{spec.description}</p>
            )}
          </div>
          <button
            onClick={reject}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Components</div>
              <div className="text-2xl font-semibold text-foreground mt-1">
                {spec.components.length}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Connections</div>
              <div className="text-2xl font-semibold text-foreground mt-1">
                {spec.connections.length}
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Layers</div>
              <div className="text-2xl font-semibold text-foreground mt-1">
                {activeGeneration.layers.length}
              </div>
            </div>
          </div>

          {/* ASCII Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Preview</h3>
            <div className="bg-terminal text-terminal-text rounded-lg p-6 overflow-auto">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre">
                {previewAscii}
              </pre>
            </div>
          </div>

          {/* Component Details */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Components</h3>
            <div className="space-y-2">
              {spec.components.map((component) => (
                <div
                  key={component.id}
                  className="bg-muted rounded-lg p-4 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono text-sm">
                    {component.type === 'box' ? '□' : component.type === 'text' ? 'T' : '◇'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{component.name}</div>
                    {component.content && (
                      <div className="text-sm text-muted-foreground mt-1 truncate">
                        {component.content}
                      </div>
                    )}
                    {component.style && (
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {component.style.width && (
                          <span>Width: {component.style.width}</span>
                        )}
                        {component.style.height && (
                          <span>Height: {component.style.height}</span>
                        )}
                        {component.style.charset && (
                          <span>Style: {component.style.charset}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Details */}
          {spec.connections.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Connections</h3>
              <div className="space-y-2">
                {spec.connections.map((connection) => {
                  const fromComp = spec.components.find(c => c.id === connection.from);
                  const toComp = spec.components.find(c => c.id === connection.to);
                  
                  return (
                    <div
                      key={connection.id}
                      className="bg-muted rounded-lg p-4 flex items-center gap-3"
                    >
                      <span className="text-sm text-foreground font-medium">
                        {fromComp?.name || connection.from}
                      </span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {toComp?.name || connection.to}
                      </span>
                      {connection.label && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {connection.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={reject}
            className="px-6 py-2
                       bg-muted text-foreground
                       rounded-lg font-medium
                       hover:bg-accent
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       transition-all"
          >
            Cancel
          </button>
          <button
            onClick={accept}
            className="px-6 py-2
                       bg-primary text-primary-foreground
                       rounded-lg font-medium
                       hover:opacity-90
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       transition-all"
          >
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Generation status indicator
 */
export interface GenerationStatusProps {
  className?: string;
}

export function GenerationStatus({ className = '' }: GenerationStatusProps) {
  const { status, progress } = useGenerationStore();

  if (status === 'idle' || status === 'completed') {
    return null;
  }

  const statusMessages = {
    processing: 'Processing prompt...',
    parsing: 'Parsing flow specification...',
    generating: 'Generating visual elements...',
    error: 'Generation failed',
  };

  const message = statusMessages[status] || 'Working...';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-info/15 text-info border border-info/30 rounded-lg ${className}`}>
      <div className="flex-shrink-0 w-5 h-5">
        <div className="w-5 h-5 border-2 border-info border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{message}</div>
        <div className="w-full bg-info/20 rounded-full h-1.5 mt-2">
          <div
            className="bg-info h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

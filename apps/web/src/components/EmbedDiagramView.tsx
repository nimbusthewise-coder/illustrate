'use client';

import { Document } from '@prisma/client';

interface EmbedDiagramViewProps {
  document: Document;
  username: string;
}

export function EmbedDiagramView({ document, username }: EmbedDiagramViewProps) {
  // Parse the document data
  const canvasData = document.data as {
    width: number;
    height: number;
    layers: Array<{
      id: string;
      name: string;
      visible: boolean;
      buffer: {
        width: number;
        height: number;
        chars: number[];
      };
    }>;
  };

  const { width, height, layers } = canvasData;

  // Composite all visible layers to get the final character at each position
  const getCellChar = (col: number, row: number): string => {
    // Composite visible layers from bottom to top
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;

      const index = row * layer.buffer.width + col;
      const charCode = layer.buffer.chars[index];

      if (charCode !== 0) {
        return String.fromCharCode(charCode);
      }
    }
    return ' ';
  };

  // Create grid
  const grid = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({
      row,
      col,
      char: getCellChar(col, row),
    }))
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {document.title || 'Untitled Diagram'}
          </h1>
          <p className="text-sm text-muted-foreground">
            by{' '}
            <span className="font-medium text-foreground">{username}</span>
            {' • '}
            {width} × {height} characters
          </p>
        </div>

        {/* Canvas display */}
        <div className="bg-card border border-border rounded-lg p-6 overflow-auto">
          <div className="bg-terminal p-4 rounded-lg overflow-auto">
            <div
              className="grid gap-0 font-mono text-sm leading-tight select-text"
              style={{
                gridTemplateColumns: `repeat(${width}, 12px)`,
                gridTemplateRows: `repeat(${height}, 18px)`,
                width: 'fit-content',
              }}
            >
              {grid.flat().map((cell) => (
                <div
                  key={`${cell.row}-${cell.col}`}
                  style={{
                    width: '12px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'text',
                  }}
                  className="text-terminal-text"
                >
                  {cell.char}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with attribution */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Created with{' '}
            <a
              href="/"
              className="text-primary hover:underline"
            >
              illustrate.md
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCanvasStore } from '@/stores/canvas-store';

/**
 * Canvas — renders a character grid at the configured dimensions.
 *
 * Each cell is a <span> in a CSS Grid layout using a monospace font,
 * per PRD §8.1 (D021 DOM character grid).
 */
export function Canvas() {
  const width = useCanvasStore((s) => s.width);
  const height = useCanvasStore((s) => s.height);

  // Build rows of empty cells
  const cells: React.ReactNode[] = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      cells.push(
        <span
          key={`${row}-${col}`}
          data-row={row}
          data-col={col}
          className="select-none text-center leading-none"
        >
          {'\u00A0' /* non-breaking space to preserve cell height */}
        </span>,
      );
    }
  }

  return (
    <div
      data-testid="canvas"
      className="inline-block bg-terminal text-terminal-text border border-border overflow-auto"
    >
      <div
        data-testid="canvas-grid"
        className="grid font-mono"
        style={{
          gridTemplateColumns: `repeat(${width}, 1ch)`,
          gridTemplateRows: `repeat(${height}, 1lh)`,
          lineHeight: '1.25',
          fontSize: '14px',
        }}
      >
        {cells}
      </div>
    </div>
  );
}

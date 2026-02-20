"use client";

import { useMemo } from "react";
import type { Buffer } from "@illustrate.md/core";
import { DEFAULT_BG, DEFAULT_FG } from "@illustrate.md/core";

export interface CanvasProps {
  buffer: Buffer;
  cellWidth?: number;   // pixels per char width
  cellHeight?: number;  // pixels per char height
  showGrid?: boolean;
}

/**
 * Unpack a uint32 RGBA value to a CSS colour string.
 * Format: 0xRRGGBBAA
 */
function rgbaToCSS(rgba: number): string {
  const r = (rgba >>> 24) & 0xff;
  const g = (rgba >>> 16) & 0xff;
  const b = (rgba >>> 8) & 0xff;
  const a = rgba & 0xff;
  return `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`;
}

/**
 * CSS-grid based canvas renderer.
 * Each cell is a <span> styled with the cell's foreground/background colours.
 * Suitable for buffers up to 256×256 (Phase 1).
 */
export function Canvas({
  buffer,
  cellWidth = 9.6,
  cellHeight = 20,
  showGrid = false,
}: CanvasProps) {
  const cells = useMemo(() => {
    const result: React.ReactElement[] = [];
    const { width, height, chars, fg, bg } = buffer;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const i = row * width + col;
        const char = String.fromCodePoint(chars[i]);
        const fgColor = fg[i];
        const bgColor = bg[i];

        // Only set styles if they differ from defaults to reduce DOM weight
        const style: React.CSSProperties = {};
        if (bgColor !== DEFAULT_BG) {
          style.backgroundColor = rgbaToCSS(bgColor);
        }
        if (fgColor !== DEFAULT_FG) {
          style.color = rgbaToCSS(fgColor);
        }

        result.push(
          <span
            key={`${col}-${row}`}
            data-col={col}
            data-row={row}
            className="inline-flex items-center justify-center select-none"
            style={style}
          >
            {char}
          </span>
        );
      }
    }
    return result;
  }, [buffer]);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${buffer.width}, ${cellWidth}px)`,
    gridTemplateRows: `repeat(${buffer.height}, ${cellHeight}px)`,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: `${Math.min(cellWidth, cellHeight) * 0.8}px`,
    lineHeight: `${cellHeight}px`,
    gap: 0,
  };

  if (showGrid) {
    gridStyle.outline = "1px solid rgba(255,255,255,0.1)";
  }

  return (
    <div
      data-testid="canvas-grid"
      className="relative overflow-auto"
      style={gridStyle}
    >
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${cellWidth}px ${cellHeight}px`,
          }}
        />
      )}
      {cells}
    </div>
  );
}

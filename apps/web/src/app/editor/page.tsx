"use client";

import { useState, useCallback } from "react";
import { createBuffer, setCell } from "@illustrate.md/core";
import type { Buffer } from "@illustrate.md/core";
import { Canvas } from "@/components/Canvas";

const DEFAULT_WIDTH = 80;
const DEFAULT_HEIGHT = 24;

function createDemoBuffer(): Buffer {
  const buf = createBuffer(DEFAULT_WIDTH, DEFAULT_HEIGHT);

  // Draw a simple box in the top-left
  const box = [
    "┌──────────────────────┐",
    "│  illustrate.md       │",
    "│  editor canvas       │",
    "└──────────────────────┘",
  ];

  for (let row = 0; row < box.length; row++) {
    const line = box[row];
    for (let col = 0; col < line.length; col++) {
      const cp = line.codePointAt(col);
      if (cp !== undefined) {
        setCell(buf, col + 2, row + 1, { char: cp });
      }
    }
  }

  return buf;
}

export default function EditorPage() {
  const [buffer, setBuffer] = useState<Buffer>(() => createDemoBuffer());
  const [showGrid, setShowGrid] = useState(true);

  const handleReset = useCallback(() => {
    setBuffer(createDemoBuffer());
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Toolbar */}
      <header className="flex items-center gap-4 px-4 py-2 border-b border-gray-800">
        <h1 className="font-mono font-bold text-sm">illustrate.md</h1>
        <span className="text-gray-600 text-xs font-mono">
          {buffer.width}×{buffer.height}
        </span>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-xs font-mono text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="accent-white"
          />
          Grid
        </label>
        <button
          onClick={handleReset}
          className="text-xs font-mono text-gray-400 hover:text-white transition-colors px-2 py-1 rounded border border-gray-700 hover:border-gray-500"
        >
          Reset
        </button>
      </header>

      {/* Canvas area */}
      <main className="flex-1 overflow-auto p-4">
        <div className="inline-block bg-[#111] rounded border border-gray-800 p-1">
          <Canvas buffer={buffer} showGrid={showGrid} />
        </div>
      </main>

      {/* Status bar */}
      <footer className="px-4 py-1 border-t border-gray-800 text-xs font-mono text-gray-500">
        Tool palette placeholder — Phase 1
      </footer>
    </div>
  );
}

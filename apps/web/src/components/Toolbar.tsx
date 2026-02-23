'use client';

import { useToolStore } from '@/stores/tool-store';
import { ToolType, EraserSize } from '@/types/tools';

interface ToolButton {
  type: ToolType;
  label: string;
  shortcut: string;
  icon: string;
}

const TOOLS: ToolButton[] = [
  { type: 'select', label: 'Select', shortcut: 'V', icon: '⌖' },
  { type: 'box', label: 'Box', shortcut: 'U', icon: '□' },
  { type: 'line', label: 'Line', shortcut: 'L', icon: '/' },
  { type: 'text', label: 'Text', shortcut: 'T', icon: 'T' },
  { type: 'eraser', label: 'Eraser', shortcut: 'E', icon: '⌫' },
  { type: 'fill', label: 'Fill', shortcut: 'F', icon: '▨' },
];

const ERASER_SIZES: EraserSize[] = [1, 3];

export function Toolbar() {
  const { currentTool, settings, setTool, setEraserSize } = useToolStore();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-4">Tools</h3>
      
      <div className="space-y-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.type}
            onClick={() => setTool(tool.type)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${
              currentTool === tool.type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-accent'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">{tool.icon}</span>
              <span className="text-sm font-medium">{tool.label}</span>
            </span>
            <span className="text-xs opacity-70 font-mono">{tool.shortcut}</span>
          </button>
        ))}
      </div>

      {/* Eraser Size Options */}
      {currentTool === 'eraser' && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-2">Eraser Size</h4>
          <div className="flex gap-2">
            {ERASER_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setEraserSize(size)}
                className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                  settings.eraserSize === size
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
                title={`${size}×${size} eraser`}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Reference */}
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-2">Shortcuts</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Swap colors</span>
            <span className="font-mono">X</span>
          </div>
          <div className="flex justify-between">
            <span>Exit text mode</span>
            <span className="font-mono">ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ToolSelector — F010: Select Tool
 *
 * UI component for selecting drawing/interaction tools.
 * Displays tool icons with keyboard shortcuts and visual feedback for active tool.
 */

'use client';

import { useToolStore } from '@/stores/tool-store';
import { TOOLS } from '@/types/tools';
import type { ToolType } from '@/types/tools';
import { useShortcuts } from '@/hooks/useShortcuts';

export function ToolSelector() {
  const activeTool = useToolStore((s) => s.activeTool);
  const setActiveTool = useToolStore((s) => s.setActiveTool);

  // Register keyboard shortcuts for all tools
  const toolShortcuts = Object.values(TOOLS)
    .filter((tool) => tool.shortcut !== 'space') // Space is handled separately for temporary pan
    .map((tool) => ({
      keys: [tool.shortcut],
      description: `Switch to ${tool.name} tool`,
      action: () => setActiveTool(tool.type),
      preventDefault: true,
    }));

  useShortcuts(toolShortcuts, { scope: 'global' });

  const handleToolClick = (toolType: ToolType) => {
    setActiveTool(toolType);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Tools</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(TOOLS)
          .filter((tool) => tool.shortcut !== 'space') // Don't show pan as a primary tool
          .map((tool) => {
            const isActive = activeTool === tool.type;
            return (
              <button
                key={tool.type}
                onClick={() => handleToolClick(tool.type)}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-md
                  border transition-all duration-150
                  ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-muted text-foreground border-border hover:bg-accent hover:border-accent-foreground/20'
                  }
                `}
                title={`${tool.description} (${tool.shortcut})`}
                aria-label={tool.name}
                aria-pressed={isActive}
              >
                <span className="text-2xl mb-1">{tool.icon}</span>
                <span className="text-xs font-medium">{tool.name}</span>
                <span className="absolute top-1 right-1 text-xs opacity-60">
                  {tool.shortcut}
                </span>
              </button>
            );
          })}
      </div>
      
      {/* Tool info display */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">{TOOLS[activeTool].name}:</span>{' '}
          {TOOLS[activeTool].description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Hold <kbd className="px-1 py-0.5 bg-muted rounded text-foreground">Space</kbd> to pan temporarily
        </p>
      </div>
    </div>
  );
}

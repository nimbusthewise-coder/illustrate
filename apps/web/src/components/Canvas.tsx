'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useLayerStore } from '@/stores/layer-store';
import { useComponentInstanceStore } from '@/stores/component-instance-store';
import { useColorStore } from '@/stores/color-store';
import { useComponents } from '@/hooks/useComponents';
import { useShortcuts, useShortcutScope } from '@/hooks/useShortcuts';
import { useToolSelection } from '@/hooks/useToolSelection';
import { useFillTool } from '@/hooks/useFillTool';
import { useZoom } from '@/hooks/useZoom';
import { ZoomControls } from '@/components/ZoomControls';
import { TOOLS } from '@/types/tools';
import { renderComponentToGrid } from '@/utils/componentRenderer';
import { drawLine, drawRectangle, drawEllipse } from '@illustrate.md/core';

/**
 * Canvas — renders a character grid at the configured dimensions.
 * F010: Integrated with tool selection system for different interaction modes.
 * F021: Supports dropping components from the library to place instances.
 * F052: Integrated with keyboard shortcuts system.
 * F064: Integrates with color picker for foreground/background colors.
 *
 * Each cell is a <span> in a CSS Grid layout using a monospace font,
 * per PRD §8.1 (D021 DOM character grid).
 */
export function Canvas() {
  const width = useCanvasStore((s) => s.width);
  const height = useCanvasStore((s) => s.height);
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const toggleLayerLock = useLayerStore((s) => s.toggleLayerLock);
  const instances = useComponentInstanceStore((s) => s.instances);
  const placeComponent = useComponentInstanceStore((s) => s.placeComponent);
  const selectInstance = useComponentInstanceStore((s) => s.selectInstance);
  const selectedInstanceId = useComponentInstanceStore((s) => s.selectedInstanceId);
  const removeInstance = useComponentInstanceStore((s) => s.removeInstance);
  const foregroundColor = useColorStore((s) => s.foreground);
  const backgroundColor = useColorStore((s) => s.background);
  const { getComponent } = useComponents();
  const gridRef = useRef<HTMLDivElement>(null);
  
  const [dragOver, setDragOver] = useState(false);
  
  // F010: Get current tool and apply tool-specific cursor
  const { effectiveTool } = useToolSelection();
  const currentTool = TOOLS[effectiveTool];

  // F003: Zoom functionality
  const { zoom, zoomPercent, zoomIn, zoomOut, resetZoom, containerRef } = useZoom();

  // Set canvas scope as active for keyboard shortcuts (F052)
  useShortcutScope('canvas');

  // Register canvas-specific shortcuts (F052)
  useShortcuts([
    {
      keys: ['delete'],
      description: 'Delete selected component',
      action: () => {
        if (selectedInstanceId) {
          removeInstance(selectedInstanceId);
        }
      },
      preventDefault: true,
    },
    {
      keys: ['backspace'],
      description: 'Delete selected component',
      action: () => {
        if (selectedInstanceId) {
          removeInstance(selectedInstanceId);
        }
      },
      preventDefault: true,
    },
    {
      keys: ['escape'],
      description: 'Deselect component',
      action: () => {
        selectInstance(null);
      },
      preventDefault: true,
    },
    {
      keys: ['l'],
      modifiers: ['ctrl'],
      description: 'Toggle lock on active layer',
      action: () => {
        toggleLayerLock(activeLayerId);
      },
      preventDefault: true,
    },
    {
      keys: ['l'],
      modifiers: ['meta'],
      description: 'Toggle lock on active layer',
      action: () => {
        toggleLayerLock(activeLayerId);
      },
      preventDefault: true,
    },
    // F003: Zoom shortcuts
    {
      keys: ['=', '+'],
      modifiers: ['ctrl'],
      description: 'Zoom in',
      action: () => {
        zoomIn();
      },
      preventDefault: true,
    },
    {
      keys: ['=', '+'],
      modifiers: ['meta'],
      description: 'Zoom in',
      action: () => {
        zoomIn();
      },
      preventDefault: true,
    },
    {
      keys: ['-'],
      modifiers: ['ctrl'],
      description: 'Zoom out',
      action: () => {
        zoomOut();
      },
      preventDefault: true,
    },
    {
      keys: ['-'],
      modifiers: ['meta'],
      description: 'Zoom out',
      action: () => {
        zoomOut();
      },
      preventDefault: true,
    },
    {
      keys: ['0'],
      modifiers: ['ctrl'],
      description: 'Reset zoom to 100%',
      action: () => {
        resetZoom();
      },
      preventDefault: true,
    },
    {
      keys: ['0'],
      modifiers: ['meta'],
      description: 'Reset zoom to 100%',
      action: () => {
        resetZoom();
      },
      preventDefault: true,
    },
  ], { scope: 'canvas' });

  // Build a character grid with component instances rendered
  const grid = useMemo(() => {
    // Initialize empty grid
    const cells: string[][] = Array.from({ length: height }, () =>
      Array(width).fill(' ')
    );

    // Render each component instance
    for (const instance of instances) {
      const component = getComponent(instance.componentId);
      if (!component) continue;

      renderComponentToGrid(cells, component, instance.x, instance.y);
    }

    return cells;
  }, [width, height, instances, getComponent]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const componentId = e.dataTransfer.getData('componentId');
    if (!componentId) return;

    // Get drop position relative to grid
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    const cellWidth = gridRect.width / width;
    const cellHeight = gridRect.height / height;

    const col = Math.floor((e.clientX - gridRect.left) / cellWidth);
    const row = Math.floor((e.clientY - gridRect.top) / cellHeight);

    // Ensure drop is within grid bounds
    if (col >= 0 && col < width && row >= 0 && row < height) {
      placeComponent(componentId, activeLayerId, col, row);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // F010: Only handle selection with select tool
    if (effectiveTool !== 'select') {
      // TODO: Handle other tool interactions (pen, line, rectangle, etc.)
      return;
    }

    // Get click position relative to grid
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    const cellWidth = gridRect.width / width;
    const cellHeight = gridRect.height / height;

    const col = Math.floor((e.clientX - gridRect.left) / cellWidth);
    const row = Math.floor((e.clientY - gridRect.top) / cellHeight);

    // Find if any instance occupies this cell
    let clickedInstanceId: string | null = null;
    
    for (const instance of instances) {
      const component = getComponent(instance.componentId);
      if (!component) continue;

      const { boundingBox } = component;
      
      // Check if click is within instance bounds
      if (
        col >= instance.x &&
        col < instance.x + boundingBox.width &&
        row >= instance.y &&
        row < instance.y + boundingBox.height
      ) {
        clickedInstanceId = instance.id;
        break;
      }
    }

    selectInstance(clickedInstanceId);
  };

  // Build cells from the rendered grid with selection highlighting
  const cells: React.ReactNode[] = [];
  
  // Determine which cells belong to selected instance
  const selectedCells = new Set<string>();
  if (selectedInstanceId) {
    const selectedInstance = instances.find((i) => i.id === selectedInstanceId);
    if (selectedInstance) {
      const component = getComponent(selectedInstance.componentId);
      if (component) {
        const { boundingBox } = component;
        for (let r = selectedInstance.y; r < selectedInstance.y + boundingBox.height; r++) {
          for (let c = selectedInstance.x; c < selectedInstance.x + boundingBox.width; c++) {
            selectedCells.add(`${r}-${c}`);
          }
        }
      }
    }
  }
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const char = grid[row][col];
      const cellKey = `${row}-${col}`;
      const isSelected = selectedCells.has(cellKey);
      
      cells.push(
        <span
          key={cellKey}
          data-row={row}
          data-col={col}
          className={`select-none text-center leading-none ${
            isSelected ? 'bg-primary/20' : ''
          }`}
        >
          {char}
        </span>,
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* F003: Zoom Controls */}
      <ZoomControls
        zoomPercent={zoomPercent}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
      />

      {/* F003: Zoomable canvas container with wheel event support */}
      <div
        ref={containerRef}
        data-testid="canvas-container"
        className="inline-block overflow-auto"
      >
        <div
          data-testid="canvas"
          className={`inline-block border border-border ${
            dragOver ? 'ring-2 ring-primary/50' : ''
          }`}
          style={{
            backgroundColor: backgroundColor,
            color: foregroundColor,
            transformOrigin: 'top left',
            transform: `scale(${zoom})`,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            ref={gridRef}
            data-testid="canvas-grid"
            className="grid font-mono"
            style={{
              gridTemplateColumns: `repeat(${width}, 1ch)`,
              gridTemplateRows: `repeat(${height}, 1lh)`,
              lineHeight: '1.25',
              fontSize: '14px',
              cursor: currentTool.cursor,
            }}
            onClick={handleCanvasClick}
          >
            {cells}
          </div>
        </div>
      </div>
    </div>
  );
}

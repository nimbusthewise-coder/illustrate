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
import { getLinePoints, getBoxPoints, BOX_CHARS, LINE_CHARS } from '@illustrate.md/core';

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
  
  // Drawing state
  const [dragOver, setDragOver] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ row: number; col: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<Array<{ row: number; col: number; char: string }>>([]);
  
  // Layer mutations
  const setCell = useLayerStore((s) => s.setCell);
  const setCells = useLayerStore((s) => s.setCells);
  const getLayer = useLayerStore((s) => s.getLayer);
  const isLayerLocked = useLayerStore((s) => s.isLayerLocked);
  
  // Fill tool
  const { applyFill, previewFill, clearPreview } = useFillTool();
  
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

  // Build a character grid from layer buffer + component instances
  const activeLayer = getLayer(activeLayerId);
  
  const grid = useMemo(() => {
    // Initialize from layer buffer if available, otherwise empty
    const cells: string[][] = Array.from({ length: height }, (_, row) =>
      Array.from({ length: width }, (_, col) => {
        if (activeLayer?.buffer) {
          const idx = row * activeLayer.buffer.width + col;
          const char = activeLayer.buffer.chars[idx];
          return char || ' ';
        }
        return ' ';
      })
    );

    // Render each component instance on top
    for (const instance of instances) {
      const component = getComponent(instance.componentId);
      if (!component) continue;

      renderComponentToGrid(cells, component, instance.x, instance.y);
    }

    return cells;
  }, [width, height, instances, getComponent, activeLayer]);

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

  // Helper to get cell coordinates from mouse event
  const getCellFromEvent = useCallback((e: React.MouseEvent): { row: number; col: number } | null => {
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return null;

    const cellWidth = gridRect.width / width;
    const cellHeight = gridRect.height / height;

    const col = Math.floor((e.clientX - gridRect.left) / cellWidth);
    const row = Math.floor((e.clientY - gridRect.top) / cellHeight);

    if (col >= 0 && col < width && row >= 0 && row < height) {
      return { row, col };
    }
    return null;
  }, [width, height]);

  // Handle mouse down — start drawing or select
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    // Check if layer is locked
    if (isLayerLocked(activeLayerId)) return;

    const { row, col } = cell;

    switch (effectiveTool) {
      case 'select': {
        // Find if any instance occupies this cell
        let clickedInstanceId: string | null = null;
        for (const instance of instances) {
          const component = getComponent(instance.componentId);
          if (!component) continue;
          const { boundingBox } = component;
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
        break;
      }

      case 'pen':
      case 'text': {
        // Single character drawing
        setCell(activeLayerId, row, col, '█');
        setIsDrawing(true);
        break;
      }

      case 'eraser': {
        // Erase character
        setCell(activeLayerId, row, col, ' ');
        setIsDrawing(true);
        break;
      }

      case 'fill': {
        // Flood fill at click position
        applyFill(row, col);
        break;
      }

      case 'line':
      case 'rectangle':
      case 'box':
      case 'ellipse':
      case 'arrow': {
        // Start shape drawing
        setIsDrawing(true);
        setDrawStart({ row, col });
        setDrawPreview([]);
        break;
      }

      default:
        break;
    }
  }, [effectiveTool, activeLayerId, instances, getComponent, selectInstance, setCell, applyFill, isLayerLocked, getCellFromEvent]);

  // Handle mouse move — continue drawing or update preview
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;

    const cell = getCellFromEvent(e);
    if (!cell) return;

    const { row, col } = cell;

    switch (effectiveTool) {
      case 'pen':
      case 'text': {
        setCell(activeLayerId, row, col, '█');
        break;
      }

      case 'eraser': {
        setCell(activeLayerId, row, col, ' ');
        break;
      }

      case 'line':
      case 'arrow': {
        if (!drawStart) return;
        // Preview line using core getLinePoints
        const start = { row: drawStart.row, col: drawStart.col };
        const end = { row, col };
        const linePoints = getLinePoints(start, end);
        const lineChar = effectiveTool === 'arrow' ? '→' : LINE_CHARS.HORIZONTAL;
        setDrawPreview(linePoints.map(p => ({ row: p.row, col: p.col, char: lineChar })));
        break;
      }

      case 'rectangle':
      case 'box': {
        if (!drawStart) return;
        // Preview box using core getBoxPoints
        const start = { row: drawStart.row, col: drawStart.col };
        const end = { row, col };
        const boxPoints = getBoxPoints(start, end, 'outline');
        // Map points to box characters based on position
        const preview = boxPoints.map(p => {
          // Determine which box char to use based on position
          const isTop = p.row === Math.min(start.row, end.row);
          const isBottom = p.row === Math.max(start.row, end.row);
          const isLeft = p.col === Math.min(start.col, end.col);
          const isRight = p.col === Math.max(start.col, end.col);
          
          let char = ' ';
          if (isTop && isLeft) char = BOX_CHARS.TOP_LEFT;
          else if (isTop && isRight) char = BOX_CHARS.TOP_RIGHT;
          else if (isBottom && isLeft) char = BOX_CHARS.BOTTOM_LEFT;
          else if (isBottom && isRight) char = BOX_CHARS.BOTTOM_RIGHT;
          else if (isTop || isBottom) char = BOX_CHARS.HORIZONTAL;
          else if (isLeft || isRight) char = BOX_CHARS.VERTICAL;
          
          return { row: p.row, col: p.col, char };
        });
        setDrawPreview(preview);
        break;
      }

      case 'ellipse': {
        if (!drawStart) return;
        // Ellipse not implemented in core - use simple circle approximation
        // For now, just draw a box outline as placeholder
        const start = { row: drawStart.row, col: drawStart.col };
        const end = { row, col };
        const boxPoints = getBoxPoints(start, end, 'outline');
        setDrawPreview(boxPoints.map(p => ({ row: p.row, col: p.col, char: '○' })));
        break;
      }

      default:
        break;
    }
  }, [isDrawing, effectiveTool, drawStart, activeLayerId, setCell, getCellFromEvent]);

  // Handle mouse up — commit shape drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    // Commit preview to canvas
    if (drawPreview.length > 0) {
      const cells = drawPreview.map(p => ({
        row: p.row,
        col: p.col,
        char: p.char,
      }));
      setCells(activeLayerId, cells);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawPreview([]);
  }, [isDrawing, drawPreview, activeLayerId, setCells]);

  // Legacy click handler (kept for component selection)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Now handled by mousedown
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
            className="grid font-mono select-none"
            style={{
              gridTemplateColumns: `repeat(${width}, 1ch)`,
              gridTemplateRows: `repeat(${height}, 1lh)`,
              lineHeight: '1.25',
              fontSize: '14px',
              cursor: currentTool.cursor,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {cells}
            {/* Render drawing preview overlay */}
            {drawPreview.map((p, i) => (
              <span
                key={`preview-${i}`}
                className="absolute pointer-events-none text-primary/70"
                style={{
                  gridColumn: p.col + 1,
                  gridRow: p.row + 1,
                }}
              >
                {p.char}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

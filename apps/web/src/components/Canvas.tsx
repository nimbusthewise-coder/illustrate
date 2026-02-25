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
 * Bresenham's line algorithm — returns all points between (x0,y0) and (x1,y1)
 * Unlike getLinePoints, this doesn't snap to angles — follows exact path.
 */
function bresenhamLine(x0: number, y0: number, x1: number, y1: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

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
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<Array<{ row: number; col: number; char: string }>>([]);
  
  // Layer mutations
  const setCell = useLayerStore((s) => s.setCell);
  const setCells = useLayerStore((s) => s.setCells);
  const getLayer = useLayerStore((s) => s.getLayer);
  const isLayerLocked = useLayerStore((s) => s.isLayerLocked);
  // Subscribe to layer data changes for live rendering
  const layers = useLayerStore((s) => s.layers);
  
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

  // Build a character grid by compositing all visible layers (bottom to top)
  const activeLayer = layers.find(l => l.id === activeLayerId);
  
  const grid = useMemo(() => {
    // Initialize empty grid
    const cells: string[][] = Array.from({ length: height }, () =>
      Array(width).fill(' ')
    );

    // Composite all visible layers (bottom to top order)
    // Layers are stored with index 0 = bottom, so iterate in order
    for (const layer of layers) {
      if (!layer.visible || !layer.buffer) continue;
      
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const idx = row * layer.buffer.width + col;
          const char = layer.buffer.chars[idx];
          // Only overwrite if not a space (transparent)
          if (char && char !== ' ') {
            cells[row][col] = char;
          }
        }
      }
    }

    // Render each component instance on top
    for (const instance of instances) {
      const component = getComponent(instance.componentId);
      if (!component) continue;

      renderComponentToGrid(cells, component, instance.x, instance.y);
    }

    return cells;
  }, [width, height, instances, getComponent, layers]);

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

      case 'pen': {
        // Single character drawing
        setCell(activeLayerId, row, col, '█');
        setIsDrawing(true);
        lastCellRef.current = { row, col };
        break;
      }

      case 'text': {
        // Text tool: prompt for text and place it starting at click position
        const text = window.prompt('Enter text:');
        if (text) {
          const cells = text.split('').map((char, i) => ({
            row,
            col: col + i,
            char,
          })).filter(c => c.col < width); // Stay in bounds
          setCells(activeLayerId, cells);
        }
        break;
      }

      case 'eraser': {
        // Erase character
        setCell(activeLayerId, row, col, ' ');
        setIsDrawing(true);
        lastCellRef.current = { row, col };
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
      case 'pen': {
        // Interpolate from last cell using raw Bresenham (no angle snapping)
        const last = lastCellRef.current;
        if (last && (last.row !== row || last.col !== col)) {
          const points = bresenhamLine(last.col, last.row, col, row);
          const cells = points.map(p => ({ row: p.y, col: p.x, char: '█' }));
          setCells(activeLayerId, cells);
        } else {
          setCell(activeLayerId, row, col, '█');
        }
        lastCellRef.current = { row, col };
        break;
      }

      case 'text': {
        // Text tool doesn't draw on drag
        break;
      }

      case 'eraser': {
        // Interpolate from last cell using raw Bresenham (no angle snapping)
        const last = lastCellRef.current;
        if (last && (last.row !== row || last.col !== col)) {
          const points = bresenhamLine(last.col, last.row, col, row);
          const cells = points.map(p => ({ row: p.y, col: p.x, char: ' ' }));
          setCells(activeLayerId, cells);
        } else {
          setCell(activeLayerId, row, col, ' ');
        }
        lastCellRef.current = { row, col };
        break;
      }

      case 'line':
      case 'arrow': {
        if (!drawStart) return;
        // Preview line using core getLinePoints (which snaps to angles)
        const start = { row: drawStart.row, col: drawStart.col };
        const end = { row, col };
        const linePoints = getLinePoints(start, end);
        
        if (linePoints.length < 2) {
          setDrawPreview([{ row: drawStart.row, col: drawStart.col, char: '·' }]);
          break;
        }
        
        // Determine character from ACTUAL snapped line direction (not input)
        const actualStart = linePoints[0];
        const actualEnd = linePoints[linePoints.length - 1];
        const dx = actualEnd.col - actualStart.col;
        const dy = actualEnd.row - actualStart.row;
        
        // Line character based on snapped direction
        let lineChar: string;
        let arrowHead: string;
        
        if (dy === 0) {
          lineChar = LINE_CHARS.HORIZONTAL;
          arrowHead = dx >= 0 ? '→' : '←';
        } else if (dx === 0) {
          lineChar = LINE_CHARS.VERTICAL;
          arrowHead = dy > 0 ? '↓' : '↑';
        } else if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
          lineChar = LINE_CHARS.DIAGONAL_DOWN; // ╲
          arrowHead = dx > 0 ? '↘' : '↖';
        } else {
          lineChar = LINE_CHARS.DIAGONAL_UP; // ╱
          arrowHead = dx > 0 ? '↗' : '↙';
        }
        
        // For arrow tool: use line chars with arrowhead at end
        if (effectiveTool === 'arrow') {
          setDrawPreview(linePoints.map((p, i) => ({
            row: p.row,
            col: p.col,
            char: i === linePoints.length - 1 ? arrowHead : lineChar,
          })));
        } else {
          setDrawPreview(linePoints.map(p => ({ row: p.row, col: p.col, char: lineChar })));
        }
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
        // Midpoint ellipse algorithm
        const x0 = Math.min(drawStart.col, col);
        const y0 = Math.min(drawStart.row, row);
        const x1 = Math.max(drawStart.col, col);
        const y1 = Math.max(drawStart.row, row);
        
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rx = (x1 - x0) / 2;
        const ry = (y1 - y0) / 2;
        
        if (rx < 1 || ry < 1) {
          setDrawPreview([{ row: Math.round(cy), col: Math.round(cx), char: '○' }]);
          break;
        }
        
        const ellipsePoints = new Set<string>();
        
        // Plot 4 symmetric points
        const plotEllipse = (ex: number, ey: number) => {
          const points = [
            { col: Math.round(cx + ex), row: Math.round(cy + ey) },
            { col: Math.round(cx - ex), row: Math.round(cy + ey) },
            { col: Math.round(cx + ex), row: Math.round(cy - ey) },
            { col: Math.round(cx - ex), row: Math.round(cy - ey) },
          ];
          for (const p of points) {
            if (p.col >= 0 && p.row >= 0 && p.col < width && p.row < height) {
              ellipsePoints.add(`${p.row}-${p.col}`);
            }
          }
        };
        
        // Midpoint ellipse algorithm
        let x = 0;
        let y = ry;
        let rx2 = rx * rx;
        let ry2 = ry * ry;
        let p1 = ry2 - rx2 * ry + 0.25 * rx2;
        
        // Region 1
        while (ry2 * x < rx2 * y) {
          plotEllipse(x, y);
          x++;
          if (p1 < 0) {
            p1 += 2 * ry2 * x + ry2;
          } else {
            y--;
            p1 += 2 * ry2 * x - 2 * rx2 * y + ry2;
          }
        }
        
        // Region 2
        let p2 = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;
        while (y >= 0) {
          plotEllipse(x, y);
          y--;
          if (p2 > 0) {
            p2 -= 2 * rx2 * y + rx2;
          } else {
            x++;
            p2 += 2 * ry2 * x - 2 * rx2 * y + rx2;
          }
        }
        
        const preview = Array.from(ellipsePoints).map(key => {
          const [r, c] = key.split('-').map(Number);
          return { row: r, col: c, char: '○' };
        });
        setDrawPreview(preview);
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
    lastCellRef.current = null;
    setDrawPreview([]);
  }, [isDrawing, drawPreview, activeLayerId, setCells]);

  // Legacy click handler (kept for component selection)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Now handled by mousedown
  };

  // Build cells from the rendered grid with selection highlighting
  const cells: React.ReactNode[] = [];
  
  // Build preview lookup map for O(1) access
  const previewMap = new Map<string, string>();
  for (const p of drawPreview) {
    previewMap.set(`${p.row}-${p.col}`, p.char);
  }
  
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
      const cellKey = `${row}-${col}`;
      const previewChar = previewMap.get(cellKey);
      const char = previewChar || grid[row][col];
      const isSelected = selectedCells.has(cellKey);
      const isPreview = !!previewChar;
      
      cells.push(
        <span
          key={cellKey}
          data-row={row}
          data-col={col}
          className={`select-none text-center leading-none ${
            isSelected ? 'bg-primary/20' : ''
          } ${isPreview ? 'text-primary/70' : ''}`}
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
          </div>
        </div>
      </div>
    </div>
  );
}

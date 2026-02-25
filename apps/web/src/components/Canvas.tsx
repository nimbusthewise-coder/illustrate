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
import { useSelectionStore } from '@/stores/selection-store';

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
  const moveInstance = useComponentInstanceStore((s) => s.moveInstance);
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
  
  // Text editing state
  const [textCursor, setTextCursor] = useState<{ row: number; col: number } | null>(null);
  const [textStartCol, setTextStartCol] = useState<number>(0); // For Enter key
  
  // Selection state for drawn content (synced to store for component creation)
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ row: number; col: number } | null>(null);
  const setGlobalSelection = useSelectionStore((s) => s.setSelection);
  const copySelection = useSelectionStore((s) => s.copySelection);
  const clipboard = useSelectionStore((s) => s.clipboard);
  const getSelectedChars = useSelectionStore((s) => s.getSelectedChars);
  
  // Instance dragging state
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  
  // Selection dragging state (for move tool)
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [selectionDragOffset, setSelectionDragOffset] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [selectionContent, setSelectionContent] = useState<Array<{ row: number; col: number; char: string }>>([]);
  const [selectionOriginalBounds, setSelectionOriginalBounds] = useState<{ minRow: number; minCol: number; maxRow: number; maxCol: number } | null>(null);
  
  // Layer mutations
  const setCell = useLayerStore((s) => s.setCell);
  const setCells = useLayerStore((s) => s.setCells);
  const setCellsWithUndo = useLayerStore((s) => s.setCellsWithUndo);
  const undo = useLayerStore((s) => s.undo);
  const redo = useLayerStore((s) => s.redo);
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
    {
      keys: ['z'],
      modifiers: ['meta'],
      description: 'Undo',
      action: () => undo(),
      preventDefault: true,
    },
    {
      keys: ['z'],
      modifiers: ['ctrl'],
      description: 'Undo',
      action: () => undo(),
      preventDefault: true,
    },
    {
      keys: ['z'],
      modifiers: ['meta', 'shift'],
      description: 'Redo',
      action: () => redo(),
      preventDefault: true,
    },
    {
      keys: ['z'],
      modifiers: ['ctrl', 'shift'],
      description: 'Redo',
      action: () => redo(),
      preventDefault: true,
    },
    {
      keys: ['y'],
      modifiers: ['ctrl'],
      description: 'Redo',
      action: () => redo(),
      preventDefault: true,
    },
    // Copy/paste
    {
      keys: ['c'],
      modifiers: ['meta'],
      description: 'Copy selection',
      action: () => {
        copySelection(layers);
      },
      preventDefault: true,
    },
    {
      keys: ['c'],
      modifiers: ['ctrl'],
      description: 'Copy selection',
      action: () => {
        copySelection(layers);
      },
      preventDefault: true,
    },
    {
      keys: ['v'],
      modifiers: ['meta'],
      description: 'Paste',
      action: () => {
        if (!clipboard) return;
        // Paste at selection start or (0,0)
        const pasteRow = selectionStart?.row ?? 0;
        const pasteCol = selectionStart?.col ?? 0;
        const cells: Array<{ row: number; col: number; char: string }> = [];
        for (let r = 0; r < clipboard.height; r++) {
          for (let c = 0; c < clipboard.width; c++) {
            const char = clipboard.chars[r]?.[c];
            if (char && char !== ' ') {
              cells.push({ row: pasteRow + r, col: pasteCol + c, char });
            }
          }
        }
        if (cells.length > 0) {
          setCellsWithUndo(activeLayerId, cells);
        }
      },
      preventDefault: true,
    },
    {
      keys: ['v'],
      modifiers: ['ctrl'],
      description: 'Paste',
      action: () => {
        if (!clipboard) return;
        const pasteRow = selectionStart?.row ?? 0;
        const pasteCol = selectionStart?.col ?? 0;
        const cells: Array<{ row: number; col: number; char: string }> = [];
        for (let r = 0; r < clipboard.height; r++) {
          for (let c = 0; c < clipboard.width; c++) {
            const char = clipboard.chars[r]?.[c];
            if (char && char !== ' ') {
              cells.push({ row: pasteRow + r, col: pasteCol + c, char });
            }
          }
        }
        if (cells.length > 0) {
          setCellsWithUndo(activeLayerId, cells);
        }
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

  // Text editing keyboard handler
  useEffect(() => {
    if (!textCursor || effectiveTool !== 'text') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { row, col } = textCursor;

      switch (e.key) {
        case 'Escape':
          // Exit text mode
          setTextCursor(null);
          e.preventDefault();
          break;

        case 'ArrowUp':
          if (row > 0) setTextCursor({ row: row - 1, col });
          e.preventDefault();
          break;

        case 'ArrowDown':
          if (row < height - 1) setTextCursor({ row: row + 1, col });
          e.preventDefault();
          break;

        case 'ArrowLeft':
          if (col > 0) setTextCursor({ row, col: col - 1 });
          e.preventDefault();
          break;

        case 'ArrowRight':
          if (col < width - 1) setTextCursor({ row, col: col + 1 });
          e.preventDefault();
          break;

        case 'Enter':
          // Move down, back to start column
          if (row < height - 1) {
            setTextCursor({ row: row + 1, col: textStartCol });
          }
          e.preventDefault();
          break;

        case 'Backspace':
          // Move left and clear
          if (col > 0) {
            setCell(activeLayerId, row, col - 1, ' ');
            setTextCursor({ row, col: col - 1 });
          }
          e.preventDefault();
          break;

        case ' ':
          // Space character - handle explicitly to prevent pan tool capture
          setCell(activeLayerId, row, col, ' ');
          if (col < width - 1) {
            setTextCursor({ row, col: col + 1 });
          }
          e.preventDefault();
          e.stopPropagation();
          break;

        default:
          // Type printable characters
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            setCell(activeLayerId, row, col, e.key);
            // Move cursor right
            if (col < width - 1) {
              setTextCursor({ row, col: col + 1 });
            }
            e.preventDefault();
            e.stopPropagation();
          }
          break;
      }
    };

    // Use capture phase to get events before other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [textCursor, effectiveTool, textStartCol, width, height, activeLayerId, setCell]);

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
        // Marquee tool (M) - rectangle selection only
        setTextCursor(null);
        selectInstance(null);
        setDraggingInstanceId(null);
        setSelectionStart({ row, col });
        setSelectionEnd({ row, col });
        setIsDrawing(true);
        break;
      }

      case 'move': {
        // Move tool (V) - move instances or selections
        setTextCursor(null);
        
        // Check for component instance click first
        let clickedInstance: typeof instances[0] | null = null;
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
            clickedInstance = instance;
            break;
          }
        }
        
        if (clickedInstance) {
          // Select and start dragging the instance
          selectInstance(clickedInstance.id);
          setDraggingInstanceId(clickedInstance.id);
          setDragOffset({ row: row - clickedInstance.y, col: col - clickedInstance.x });
          setSelectionStart(null);
          setSelectionEnd(null);
          setIsDraggingSelection(false);
        } else if (selectionStart && selectionEnd) {
          // Check if clicking inside existing selection
          const minRow = Math.min(selectionStart.row, selectionEnd.row);
          const maxRow = Math.max(selectionStart.row, selectionEnd.row);
          const minCol = Math.min(selectionStart.col, selectionEnd.col);
          const maxCol = Math.max(selectionStart.col, selectionEnd.col);
          
          if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
            // Start dragging the selection
            setIsDraggingSelection(true);
            setSelectionDragOffset({ row: row - minRow, col: col - minCol });
            setSelectionOriginalBounds({ minRow, minCol, maxRow, maxCol });
            
            // Capture the content being moved directly from layers
            const content: Array<{ row: number; col: number; char: string }> = [];
            const height = maxRow - minRow + 1;
            const width = maxCol - minCol + 1;
            
            // Composite visible layers within selection bounds
            for (const layer of layers) {
              if (!layer.visible || !layer.buffer) continue;
              for (let r = 0; r < height; r++) {
                for (let c = 0; c < width; c++) {
                  const sourceRow = minRow + r;
                  const sourceCol = minCol + c;
                  const idx = sourceRow * layer.buffer.width + sourceCol;
                  const char = layer.buffer.chars[idx];
                  if (char && char !== ' ') {
                    // Check if we already have content at this position
                    const existingIdx = content.findIndex(item => item.row === r && item.col === c);
                    if (existingIdx === -1) {
                      content.push({ row: r, col: c, char });
                    } else {
                      // Layer compositing: upper layers override
                      content[existingIdx].char = char;
                    }
                  }
                }
              }
            }
            setSelectionContent(content);
          } else {
            // Clicking outside selection - clear it
            setSelectionStart(null);
            setSelectionEnd(null);
            setGlobalSelection(null);
            setIsDraggingSelection(false);
          }
        } else {
          selectInstance(null);
          setDraggingInstanceId(null);
          setIsDraggingSelection(false);
        }
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
        // Text tool: place cursor for typing
        setTextCursor({ row, col });
        setTextStartCol(col);
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
  }, [effectiveTool, activeLayerId, instances, getComponent, selectInstance, setCell, applyFill, isLayerLocked, getCellFromEvent, selectionStart, selectionEnd, getSelectedChars, layers, setGlobalSelection]);

  // Handle mouse move — continue drawing or update preview
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const { row, col } = cell;
    
    // Handle instance dragging (separate from drawing)
    if (draggingInstanceId) {
      const newX = col - dragOffset.col;
      const newY = row - dragOffset.row;
      moveInstance(draggingInstanceId, newX, newY);
      return;
    }
    
    // Handle selection dragging (move tool)
    if (isDraggingSelection && selectionOriginalBounds) {
      const newMinRow = row - selectionDragOffset.row;
      const newMinCol = col - selectionDragOffset.col;
      const height = selectionOriginalBounds.maxRow - selectionOriginalBounds.minRow;
      const width = selectionOriginalBounds.maxCol - selectionOriginalBounds.minCol;
      
      // Update selection bounds to show new position
      setSelectionStart({ row: newMinRow, col: newMinCol });
      setSelectionEnd({ row: newMinRow + height, col: newMinCol + width });
      return;
    }

    if (!isDrawing) return;

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

      case 'select': {
        // Update selection rectangle
        if (selectionStart) {
          setSelectionEnd({ row, col });
        }
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
  }, [isDrawing, effectiveTool, drawStart, activeLayerId, setCell, getCellFromEvent, draggingInstanceId, dragOffset, moveInstance, isDraggingSelection, selectionOriginalBounds, selectionDragOffset]);

  // Handle mouse up — commit shape drawing
  const handleMouseUp = useCallback(() => {
    // Stop instance dragging
    if (draggingInstanceId) {
      setDraggingInstanceId(null);
      return;
    }
    
    // Commit selection move
    if (isDraggingSelection && selectionOriginalBounds && selectionContent.length > 0 && selectionStart) {
      // Calculate where content should be placed
      const newMinRow = selectionStart.row;
      const newMinCol = selectionStart.col;
      
      // Erase from original position
      const eraseCells: Array<{ row: number; col: number; char: string }> = [];
      for (const item of selectionContent) {
        eraseCells.push({
          row: selectionOriginalBounds.minRow + item.row,
          col: selectionOriginalBounds.minCol + item.col,
          char: ' ',
        });
      }
      
      // Place at new position
      const placeCells: Array<{ row: number; col: number; char: string }> = [];
      for (const item of selectionContent) {
        placeCells.push({
          row: newMinRow + item.row,
          col: newMinCol + item.col,
          char: item.char,
        });
      }
      
      // Apply both as one undoable operation
      setCellsWithUndo(activeLayerId, [...eraseCells, ...placeCells]);
      
      // Update selection to new position
      const height = selectionOriginalBounds.maxRow - selectionOriginalBounds.minRow;
      const width = selectionOriginalBounds.maxCol - selectionOriginalBounds.minCol;
      setSelectionEnd({ row: newMinRow + height, col: newMinCol + width });
      setGlobalSelection({
        startRow: newMinRow,
        startCol: newMinCol,
        endRow: newMinRow + height,
        endCol: newMinCol + width,
      });
      
      // Reset drag state
      setIsDraggingSelection(false);
      setSelectionContent([]);
      setSelectionOriginalBounds(null);
      return;
    }

    if (!isDrawing) return;

    // For select tool, keep the selection visible and sync to global store
    if (effectiveTool === 'select' && selectionStart && selectionEnd) {
      // Sync to global store for CreateComponentDialog
      setGlobalSelection({
        startRow: selectionStart.row,
        startCol: selectionStart.col,
        endRow: selectionEnd.row,
        endCol: selectionEnd.col,
      });
      setIsDrawing(false);
      return;
    }

    // Commit preview to canvas with undo tracking
    if (drawPreview.length > 0) {
      const cells = drawPreview.map(p => ({
        row: p.row,
        col: p.col,
        char: p.char,
      }));
      setCellsWithUndo(activeLayerId, cells);
    }

    setIsDrawing(false);
    setDrawStart(null);
    lastCellRef.current = null;
    setDrawPreview([]);
  }, [isDrawing, drawPreview, activeLayerId, setCellsWithUndo, effectiveTool, selectionStart, selectionEnd, draggingInstanceId, isDraggingSelection, selectionOriginalBounds, selectionContent, setGlobalSelection]);

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
      const isTextCursor = textCursor?.row === row && textCursor?.col === col;
      
      // Check if cell is in selection rectangle
      let isInSelection = false;
      if (selectionStart && selectionEnd) {
        const minRow = Math.min(selectionStart.row, selectionEnd.row);
        const maxRow = Math.max(selectionStart.row, selectionEnd.row);
        const minCol = Math.min(selectionStart.col, selectionEnd.col);
        const maxCol = Math.max(selectionStart.col, selectionEnd.col);
        isInSelection = row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
      }
      
      cells.push(
        <span
          key={cellKey}
          data-row={row}
          data-col={col}
          className={`select-none text-center leading-none ${
            isSelected ? 'bg-primary/20' : ''
          } ${isPreview ? 'text-primary/70' : ''} ${
            isTextCursor ? 'bg-primary text-primary-foreground animate-pulse' : ''
          } ${isInSelection ? 'bg-blue-500/30' : ''}`}
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

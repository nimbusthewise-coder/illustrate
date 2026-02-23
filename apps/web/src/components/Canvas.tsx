'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useToolStore } from '@/stores/tool-store';
import { useColourStore } from '@/stores/colour-store';

export function Canvas() {
  const { document, activeLayerId, eraseCells, writeChar, drawLine, drawBox, selection, setSelection, clearSelection, colourOnlyMode, paintCell } = useCanvasStore();
  const { currentTool, settings, textCursor, setTextCursor, setInputActive } = useToolStore();
  const { foreground } = useColourStore();
  const [isErasing, setIsErasing] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  const [lineStart, setLineStart] = useState<{ col: number; row: number } | null>(null);
  const [boxStart, setBoxStart] = useState<{ col: number; row: number } | null>(null);
  const [selectStart, setSelectStart] = useState<{ col: number; row: number } | null>(null);

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsErasing(false);
      setIsPainting(false);
      setLineStart(null); // Cancel line drawing if mouse released outside canvas
      setBoxStart(null); // Cancel box drawing if mouse released outside canvas
      setSelectStart(null); // Cancel selection if mouse released outside canvas
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Handle selection keyboard controls
  useEffect(() => {
    if (currentTool !== 'select' || !selection || !activeLayerId || !document) return;

    function handleSelectionKeyboard(event: KeyboardEvent) {
      if (!selection || !activeLayerId || !document) return;

      const minCol = Math.min(selection.startCol, selection.endCol);
      const maxCol = Math.max(selection.startCol, selection.endCol);
      const minRow = Math.min(selection.startRow, selection.endRow);
      const maxRow = Math.max(selection.startRow, selection.endRow);
      const selWidth = maxCol - minCol + 1;
      const selHeight = maxRow - minRow + 1;

      // Escape key - clear selection
      if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
        return;
      }

      // Delete key - clear selected cells
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        const layer = document.layers.find((l) => l.id === activeLayerId);
        if (!layer || layer.locked) return;

        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            const index = row * layer.buffer.width + col;
            layer.buffer.chars[index] = 0;
            layer.buffer.fg[index] = 0;
            layer.buffer.bg[index] = 0;
            layer.buffer.flags[index] = 0;
          }
        }
        // Trigger re-render by updating the document
        useCanvasStore.setState({
          document: {
            ...document,
            updatedAt: Date.now(),
          },
        });
        return;
      }

      // Cmd/Ctrl+C - copy selection
      if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
        event.preventDefault();
        
        // Build text representation of selection
        const lines: string[] = [];
        for (let row = minRow; row <= maxRow; row++) {
          let line = '';
          for (let col = minCol; col <= maxCol; col++) {
            // Composite visible layers (respecting opacity)
            let char = ' ';
            for (let i = document.layers.length - 1; i >= 0; i--) {
              const layer = document.layers[i];
              if (!layer.visible || layer.opacity === 0) continue;
              const index = row * layer.buffer.width + col;
              const charCode = layer.buffer.chars[index];
              if (charCode !== 0) {
                char = String.fromCharCode(charCode);
                break;
              }
            }
            line += char;
          }
          lines.push(line);
        }
        
        navigator.clipboard.writeText(lines.join('\n')).catch((err) => {
          console.error('Failed to copy selection:', err);
        });
        return;
      }

      // Arrow keys - move selection
      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        
        let deltaCol = 0;
        let deltaRow = 0;
        
        if (event.key === 'ArrowLeft') deltaCol = -1;
        if (event.key === 'ArrowRight') deltaCol = 1;
        if (event.key === 'ArrowUp') deltaRow = -1;
        if (event.key === 'ArrowDown') deltaRow = 1;
        
        // Check bounds
        const newMinCol = minCol + deltaCol;
        const newMaxCol = maxCol + deltaCol;
        const newMinRow = minRow + deltaRow;
        const newMaxRow = maxRow + deltaRow;
        
        if (
          newMinCol >= 0 && newMaxCol < document.width &&
          newMinRow >= 0 && newMaxRow < document.height
        ) {
          setSelection(
            selection.startCol + deltaCol,
            selection.startRow + deltaRow,
            selection.endCol + deltaCol,
            selection.endRow + deltaRow
          );
        }
        return;
      }
    }

    window.addEventListener('keydown', handleSelectionKeyboard);
    return () => window.removeEventListener('keydown', handleSelectionKeyboard);
  }, [currentTool, selection, activeLayerId, document, setSelection, clearSelection]);

  // Handle text input when text cursor is active
  useEffect(() => {
    if (!textCursor?.visible || !activeLayerId || !document) return;

    function handleTextInput(event: KeyboardEvent) {
      if (!textCursor?.visible || !activeLayerId || !document) return;

      const { col, row } = textCursor;
      const { width, height } = document;

      // Arrow key navigation
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const newCol = Math.max(0, col - 1);
        setTextCursor({ col: newCol, row, visible: true });
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const newCol = Math.min(width - 1, col + 1);
        setTextCursor({ col: newCol, row, visible: true });
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const newRow = Math.max(0, row - 1);
        setTextCursor({ col, row: newRow, visible: true });
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const newRow = Math.min(height - 1, row + 1);
        setTextCursor({ col, row: newRow, visible: true });
        return;
      }

      // Backspace
      if (event.key === 'Backspace') {
        event.preventDefault();
        if (col > 0) {
          const prevCol = col - 1;
          writeChar(activeLayerId, prevCol, row, ' ');
          setTextCursor({ col: prevCol, row, visible: true });
        }
        return;
      }

      // Enter/Return - move to next line
      if (event.key === 'Enter') {
        event.preventDefault();
        const newRow = Math.min(height - 1, row + 1);
        setTextCursor({ col: 0, row: newRow, visible: true });
        return;
      }

      // Printable characters
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        writeChar(activeLayerId, col, row, event.key);
        
        // Move cursor to next position
        const nextCol = col + 1;
        if (nextCol < width) {
          setTextCursor({ col: nextCol, row, visible: true });
        } else {
          // Wrap to next line if at end of row
          const nextRow = row + 1;
          if (nextRow < height) {
            setTextCursor({ col: 0, row: nextRow, visible: true });
          }
        }
      }
    }

    window.addEventListener('keydown', handleTextInput);
    return () => window.removeEventListener('keydown', handleTextInput);
  }, [textCursor, activeLayerId, document, writeChar, setTextCursor]);

  // Helper: convert hex colour string to number
  const hexToNumber = (hex: string): number => {
    return parseInt(hex.replace('#', ''), 16);
  };

  // Early return AFTER all hooks have been called
  if (!document) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center text-muted-foreground">
        No canvas loaded. Initialize a canvas from the settings panel.
      </div>
    );
  }

  const { width, height, layers } = document;
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  // Handle mouse down
  const handleMouseDown = (col: number, row: number) => {
    if (currentTool === 'paint' && activeLayerId) {
      setIsPainting(true);
      paintCell(activeLayerId, col, row, hexToNumber(foreground));
    } else if (colourOnlyMode && currentTool !== 'eraser' && currentTool !== 'select' && activeLayerId) {
      // In colour-only mode, most tools paint colours
      setIsPainting(true);
      paintCell(activeLayerId, col, row, hexToNumber(foreground));
    } else if (currentTool === 'eraser' && activeLayerId) {
      setIsErasing(true);
      eraseCells(activeLayerId, col, row, settings.eraserSize);
    } else if (currentTool === 'text') {
      // Place text cursor at clicked position
      setTextCursor({ col, row, visible: true });
    } else if (currentTool === 'line') {
      // Start line drawing
      setLineStart({ col, row });
    } else if (currentTool === 'box') {
      // Start box drawing
      setBoxStart({ col, row });
    } else if (currentTool === 'select') {
      // Check if clicking inside existing selection
      if (selection) {
        const minCol = Math.min(selection.startCol, selection.endCol);
        const maxCol = Math.max(selection.startCol, selection.endCol);
        const minRow = Math.min(selection.startRow, selection.endRow);
        const maxRow = Math.max(selection.startRow, selection.endRow);
        
        if (col >= minCol && col <= maxCol && row >= minRow && row <= maxRow) {
          // Clicking inside selection - keep it
          return;
        }
      }
      // Start new selection
      clearSelection();
      setSelectStart({ col, row });
    }
  };

  // Handle mouse move (for dragging)
  const handleMouseMove = (col: number, row: number) => {
    setHoveredCell({ col, row });
    
    if (isPainting && activeLayerId) {
      paintCell(activeLayerId, col, row, hexToNumber(foreground));
    } else if (isErasing && currentTool === 'eraser' && activeLayerId) {
      eraseCells(activeLayerId, col, row, settings.eraserSize);
    }
  };

  // Handle mouse up
  const handleMouseUp = (col: number, row: number) => {
    setIsErasing(false);
    setIsPainting(false);
    
    // Complete line drawing
    if (currentTool === 'line' && lineStart && activeLayerId) {
      drawLine(activeLayerId, lineStart.col, lineStart.row, col, row);
      setLineStart(null);
    }
    
    // Complete box drawing
    if (currentTool === 'box' && boxStart && activeLayerId) {
      drawBox(activeLayerId, boxStart.col, boxStart.row, col, row);
      setBoxStart(null);
    }
    
    // Complete selection
    if (currentTool === 'select' && selectStart) {
      setSelection(selectStart.col, selectStart.row, col, row);
      setSelectStart(null);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsErasing(false);
    setIsPainting(false);
    setHoveredCell(null);
  };

  // Check if cell is in selection preview (during drag)
  const isInSelectionPreview = (col: number, row: number): boolean => {
    if (currentTool !== 'select' || !selectStart || !hoveredCell) return false;
    
    const minCol = Math.min(selectStart.col, hoveredCell.col);
    const maxCol = Math.max(selectStart.col, hoveredCell.col);
    const minRow = Math.min(selectStart.row, hoveredCell.row);
    const maxRow = Math.max(selectStart.row, hoveredCell.row);
    
    // Check if on border of selection rectangle
    const isOnBorder = (
      (row === minRow || row === maxRow) && col >= minCol && col <= maxCol
    ) || (
      (col === minCol || col === maxCol) && row >= minRow && row <= maxRow
    );
    
    return isOnBorder;
  };

  // Check if cell is in final selection
  const isInSelection = (col: number, row: number): boolean => {
    if (currentTool !== 'select' || !selection) return false;
    
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    
    return col >= minCol && col <= maxCol && row >= minRow && row <= maxRow;
  };

  // Check if cell is on the border of final selection
  const isOnSelectionBorder = (col: number, row: number): boolean => {
    if (currentTool !== 'select' || !selection) return false;
    
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    
    const isInside = col >= minCol && col <= maxCol && row >= minRow && row <= maxRow;
    if (!isInside) return false;
    
    // Check if on border
    return (
      row === minRow || row === maxRow || col === minCol || col === maxCol
    );
  };

  // Check if cell is in eraser preview area
  const isInEraserPreview = (col: number, row: number): boolean => {
    if (currentTool !== 'eraser' || !hoveredCell) return false;
    
    const halfSize = Math.floor(settings.eraserSize / 2);
    return (
      col >= hoveredCell.col - halfSize &&
      col <= hoveredCell.col + halfSize &&
      row >= hoveredCell.row - halfSize &&
      row <= hoveredCell.row + halfSize
    );
  };

  // Check if cell is in line preview
  const isInLinePreview = (col: number, row: number): boolean => {
    if (currentTool !== 'line' || !lineStart || !hoveredCell) return false;
    
    // Calculate snapped end position
    const dx = hoveredCell.col - lineStart.col;
    const dy = hoveredCell.row - lineStart.row;
    
    let snappedEndCol = hoveredCell.col;
    let snappedEndRow = hoveredCell.row;
    
    if (dx === 0) {
      // Vertical
    } else if (dy === 0) {
      // Horizontal
    } else {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (absDx > absDy * 1.5) {
        snappedEndRow = lineStart.row;
      } else if (absDy > absDx * 1.5) {
        snappedEndCol = lineStart.col;
      } else {
        const diagonal = Math.min(absDx, absDy);
        snappedEndCol = lineStart.col + Math.sign(dx) * diagonal;
        snappedEndRow = lineStart.row + Math.sign(dy) * diagonal;
      }
    }
    
    const finalDx = snappedEndCol - lineStart.col;
    const finalDy = snappedEndRow - lineStart.row;
    const steps = Math.max(Math.abs(finalDx), Math.abs(finalDy));
    
    if (steps === 0) return col === lineStart.col && row === lineStart.row;
    
    // Check if this cell is on the line
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lineCol = Math.round(lineStart.col + finalDx * t);
      const lineRow = Math.round(lineStart.row + finalDy * t);
      
      if (lineCol === col && lineRow === row) return true;
    }
    
    return false;
  };

  // Check if cell is in box preview
  const isInBoxPreview = (col: number, row: number): boolean => {
    if (currentTool !== 'box' || !boxStart || !hoveredCell) return false;
    
    const minCol = Math.min(boxStart.col, hoveredCell.col);
    const maxCol = Math.max(boxStart.col, hoveredCell.col);
    const minRow = Math.min(boxStart.row, hoveredCell.row);
    const maxRow = Math.max(boxStart.row, hoveredCell.row);

    const boxWidth = maxCol - minCol + 1;
    const boxHeight = maxRow - minRow + 1;

    // Don't preview if below minimum 2×2 size
    if (boxWidth < 2 || boxHeight < 2) {
      return false;
    }

    // Check if this cell is on the box border
    const isOnBorder = (
      (row === minRow || row === maxRow) && col >= minCol && col <= maxCol
    ) || (
      (col === minCol || col === maxCol) && row >= minRow && row <= maxRow
    );

    return isOnBorder;
  };

  // Render cell from composited layers, respecting opacity and composite mode
  const getCellData = (col: number, row: number): { char: string; opacity: number; bgColour: number | null } => {
    // Composite visible layers from bottom (index 0) to top
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      if (layer.opacity === 0) continue;
      
      const index = row * layer.buffer.width + col;
      const charCode = layer.buffer.chars[index];
      const bgValue = layer.buffer.bg[index];
      
      if (charCode !== 0) {
        // For multiply mode with opacity < 100, reduce visual opacity further
        let effectiveOpacity = (layer.opacity ?? 100) / 100;
        if (layer.compositeMode === 'multiply') {
          // In text/ASCII context, multiply darkens — we approximate by reducing opacity
          effectiveOpacity *= 0.7;
        }
        return { 
          char: String.fromCharCode(charCode), 
          opacity: effectiveOpacity,
          bgColour: bgValue !== 0 ? bgValue : null,
        };
      }
    }
    return { char: ' ', opacity: 1, bgColour: null };
  };

  // Helper: convert number colour to CSS hex string
  const numberToHex = (num: number): string => {
    return '#' + num.toString(16).padStart(6, '0');
  };

  // Create grid
  const grid = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => {
      const cellData = getCellData(col, row);
      return {
        row,
        col,
        char: cellData.char,
        opacity: cellData.opacity,
        bgColour: cellData.bgColour,
      };
    })
  );

  // Handle clicking outside the grid to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (currentTool === 'select' && e.target === e.currentTarget) {
      clearSelection();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Canvas</h3>
        <p className="text-sm text-muted-foreground">
          Grid: {width} × {height} characters ({width * height} cells)
          {activeLayer && ` • Active: ${activeLayer.name}`}
          {colourOnlyMode && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
              Pixel Art Mode
            </span>
          )}
        </p>
      </div>

      <div 
        className="bg-terminal p-4 rounded-lg overflow-auto"
        onClick={handleCanvasClick}
      >
        <div
          className="grid gap-0 font-mono text-sm leading-tight select-none"
          style={{
            gridTemplateColumns: `repeat(${width}, 12px)`,
            gridTemplateRows: `repeat(${height}, 18px)`,
            width: 'fit-content',
          }}
          onMouseLeave={handleMouseLeave}
        >
          {grid.flat().map((cell) => {
            const inEraserPreview = isInEraserPreview(cell.col, cell.row);
            const inLinePreview = isInLinePreview(cell.col, cell.row);
            const inBoxPreview = isInBoxPreview(cell.col, cell.row);
            const inSelectionPreview = isInSelectionPreview(cell.col, cell.row);
            const inSelection = isInSelection(cell.col, cell.row);
            const onSelectionBorder = isOnSelectionBorder(cell.col, cell.row);
            const isTextCursor = textCursor?.visible && 
                                 textCursor.col === cell.col && 
                                 textCursor.row === cell.row;
            
            // Determine background and border for selection
            let backgroundColor = 'transparent';
            let borderStyle = '1px solid rgba(255, 255, 255, 0.05)';
            
            // In colour-only mode, show bg colour as solid block
            if (colourOnlyMode && cell.bgColour !== null) {
              backgroundColor = numberToHex(cell.bgColour);
            } else if (inEraserPreview) {
              backgroundColor = 'rgba(255, 0, 0, 0.3)';
            } else if (inLinePreview) {
              backgroundColor = 'rgba(100, 150, 255, 0.4)';
            } else if (inBoxPreview) {
              backgroundColor = 'rgba(100, 255, 150, 0.4)';
            } else if (isTextCursor) {
              backgroundColor = 'rgba(255, 255, 255, 0.3)';
            } else if (inSelectionPreview) {
              // Dashed border for selection preview
              borderStyle = '1px dashed rgba(59, 130, 246, 0.8)';
            } else if (inSelection) {
              // Semi-transparent overlay for final selection
              backgroundColor = 'rgba(59, 130, 246, 0.15)';
              if (onSelectionBorder) {
                // Solid border for final selection
                borderStyle = '1px solid rgba(59, 130, 246, 0.8)';
              }
            }
            
            return (
              <div
                key={`${cell.row}-${cell.col}`}
                style={{
                  width: '12px',
                  height: '18px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  border: borderStyle,
                  backgroundColor: backgroundColor,
                  opacity: cell.opacity < 1 ? cell.opacity : undefined,
                  cursor: currentTool === 'eraser' 
                    ? 'crosshair' 
                    : currentTool === 'paint'
                    ? 'crosshair'
                    : currentTool === 'text' 
                    ? 'text' 
                    : currentTool === 'line'
                    ? 'crosshair'
                    : currentTool === 'box'
                    ? 'crosshair'
                    : currentTool === 'select'
                    ? 'crosshair'
                    : colourOnlyMode
                    ? 'crosshair'
                    : 'default',
                }}
                className="text-terminal-text"
                onMouseDown={() => handleMouseDown(cell.col, cell.row)}
                onMouseMove={() => handleMouseMove(cell.col, cell.row)}
                onMouseUp={() => handleMouseUp(cell.col, cell.row)}
              >
                {colourOnlyMode ? '' : cell.char}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

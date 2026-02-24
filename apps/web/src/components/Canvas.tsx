'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useLayerStore } from '@/stores/layer-store';
import { useComponentInstanceStore } from '@/stores/component-instance-store';
import { useComponents } from '@/hooks/useComponents';
import { renderComponentToGrid } from '@/utils/componentRenderer';

/**
 * Canvas — renders a character grid at the configured dimensions.
 * F021: Supports dropping components from the library to place instances.
 *
 * Each cell is a <span> in a CSS Grid layout using a monospace font,
 * per PRD §8.1 (D021 DOM character grid).
 */
export function Canvas() {
  const width = useCanvasStore((s) => s.width);
  const height = useCanvasStore((s) => s.height);
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const instances = useComponentInstanceStore((s) => s.instances);
  const placeComponent = useComponentInstanceStore((s) => s.placeComponent);
  const selectInstance = useComponentInstanceStore((s) => s.selectInstance);
  const selectedInstanceId = useComponentInstanceStore((s) => s.selectedInstanceId);
  const removeInstance = useComponentInstanceStore((s) => s.removeInstance);
  const { getComponent } = useComponents();
  const gridRef = useRef<HTMLDivElement>(null);
  
  const [dragOver, setDragOver] = useState(false);

  // Handle keyboard shortcuts for selected instance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedInstanceId && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Prevent default backspace navigation
        e.preventDefault();
        removeInstance(selectedInstanceId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInstanceId, removeInstance]);

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
    <div
      data-testid="canvas"
      className={`inline-block bg-terminal text-terminal-text border border-border overflow-auto ${
        dragOver ? 'ring-2 ring-primary/50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        ref={gridRef}
        data-testid="canvas-grid"
        className="grid font-mono cursor-pointer"
        style={{
          gridTemplateColumns: `repeat(${width}, 1ch)`,
          gridTemplateRows: `repeat(${height}, 1lh)`,
          lineHeight: '1.25',
          fontSize: '14px',
        }}
        onClick={handleCanvasClick}
      >
        {cells}
      </div>
    </div>
  );
}

/**
 * Fill Tool Hook — F009: Fill Tool
 * 
 * React hook providing fill tool operations with undo/redo support.
 */

import { useCallback } from 'react';
import { useLayerStore } from '@/stores/layer-store';
import { useToolStore } from '@/stores/tool-store';
import { floodFill, canFill } from '@illustrate.md/core';
import type { CellDelta, OperationDelta } from '@/lib/types';

export function useFillTool() {
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const getLayer = useLayerStore((s) => s.getLayer);
  const setCells = useLayerStore((s) => s.setCells);
  const pushOperation = useLayerStore((s) => s.pushOperation);
  const isLayerLocked = useLayerStore((s) => s.isLayerLocked);
  
  const fillCharacter = useToolStore((s) => s.fillCharacter);
  const setPreviewPositions = useToolStore((s) => s.setPreviewPositions);
  const clearPreview = useToolStore((s) => s.clearPreview);

  /**
   * Preview fill operation without applying changes
   */
  const previewFill = useCallback((row: number, col: number) => {
    const layer = getLayer(activeLayerId);
    if (!layer || isLayerLocked(activeLayerId)) {
      clearPreview();
      return;
    }

    const { buffer } = layer;
    const { chars, width, height } = buffer;

    // Check if fill would have any effect
    if (!canFill(chars, width, height, row, col, fillCharacter)) {
      clearPreview();
      return;
    }

    // Calculate positions that would be filled
    const result = floodFill(chars, width, height, row, col);
    setPreviewPositions(result.positions);
  }, [
    activeLayerId,
    getLayer,
    isLayerLocked,
    fillCharacter,
    setPreviewPositions,
    clearPreview,
  ]);

  /**
   * Apply fill operation at the specified position
   */
  const applyFill = useCallback((row: number, col: number) => {
    const layer = getLayer(activeLayerId);
    if (!layer || isLayerLocked(activeLayerId)) {
      return;
    }

    const { buffer } = layer;
    const { chars, width, height } = buffer;

    // Check if fill would have any effect
    if (!canFill(chars, width, height, row, col, fillCharacter)) {
      return;
    }

    // Calculate positions to fill
    const result = floodFill(chars, width, height, row, col);
    
    if (result.positions.length === 0) {
      return;
    }

    // Build delta for undo/redo
    const cellDeltas: CellDelta[] = result.positions.map((pos) => ({
      row: pos.row,
      col: pos.col,
      before: result.targetChar,
      after: fillCharacter,
    }));

    const delta: OperationDelta = {
      layerId: activeLayerId,
      cells: cellDeltas,
    };

    // Apply changes
    const cells = result.positions.map((pos) => ({
      row: pos.row,
      col: pos.col,
      char: fillCharacter,
    }));

    setCells(activeLayerId, cells);
    pushOperation(delta);
    clearPreview();
  }, [
    activeLayerId,
    getLayer,
    isLayerLocked,
    fillCharacter,
    setCells,
    pushOperation,
    clearPreview,
  ]);

  return {
    previewFill,
    applyFill,
    clearPreview,
  };
}

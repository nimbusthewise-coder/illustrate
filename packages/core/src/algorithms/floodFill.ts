/**
 * Flood Fill Algorithm — F010: Fill Tool
 * 
 * Stub implementation for build compatibility.
 * TODO: Implement actual flood fill algorithm.
 */

export interface FillPosition {
  row: number;
  col: number;
}

/**
 * Check if a position can be filled
 */
export function canFill(
  chars: string[],
  width: number,
  height: number,
  row: number,
  col: number,
  fillCharacter: string
): boolean {
  if (row < 0 || row >= height || col < 0 || col >= width) {
    return false;
  }
  const idx = row * width + col;
  // Can fill if current cell is different from fill character
  return chars[idx] !== fillCharacter;
}

export interface FloodFillResult {
  positions: FillPosition[];
  targetChar: string;
}

/**
 * Perform flood fill operation
 * Returns object with positions array
 */
export function floodFill(
  chars: string[],
  width: number,
  height: number,
  startRow: number,
  startCol: number
): FloodFillResult {
  // Stub: return just the start position
  // TODO: Implement actual flood fill algorithm
  if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) {
    return { positions: [], targetChar: '' };
  }
  const idx = startRow * width + startCol;
  const targetChar = chars[idx] || ' ';
  return { positions: [{ row: startRow, col: startCol }], targetChar };
}

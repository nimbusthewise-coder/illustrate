/**
 * Flood Fill Algorithm — F009: Fill Tool
 * 
 * Iterative flood-fill implementation that identifies all connected cells
 * with the same character value, avoiding stack overflow on large areas.
 */

export interface FillPosition {
  row: number;
  col: number;
}

export interface FillResult {
  positions: FillPosition[];
  targetChar: string;
}

/**
 * Perform flood-fill starting from (startRow, startCol)
 * Returns all positions that should be filled with the new character
 * 
 * @param chars - Flat array of characters (row-major order)
 * @param width - Grid width
 * @param height - Grid height
 * @param startRow - Starting row position
 * @param startCol - Starting column position
 * @returns Array of positions to fill and the original character
 */
export function floodFill(
  chars: string[],
  width: number,
  height: number,
  startRow: number,
  startCol: number
): FillResult {
  // Validate starting position
  if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) {
    return { positions: [], targetChar: '' };
  }

  const startIdx = startRow * width + startCol;
  const targetChar = chars[startIdx];
  
  // Track visited cells to avoid duplicates
  const visited = new Set<number>();
  const positions: FillPosition[] = [];
  
  // Queue for iterative BFS
  const queue: FillPosition[] = [{ row: startRow, col: startCol }];
  visited.add(startIdx);
  
  while (queue.length > 0) {
    const pos = queue.shift()!;
    positions.push(pos);
    
    // Check all 4 adjacent cells (up, down, left, right)
    const adjacents: FillPosition[] = [
      { row: pos.row - 1, col: pos.col }, // up
      { row: pos.row + 1, col: pos.col }, // down
      { row: pos.row, col: pos.col - 1 }, // left
      { row: pos.row, col: pos.col + 1 }, // right
    ];
    
    for (const adj of adjacents) {
      // Check bounds
      if (adj.row < 0 || adj.row >= height || adj.col < 0 || adj.col >= width) {
        continue;
      }
      
      const adjIdx = adj.row * width + adj.col;
      
      // Skip if already visited
      if (visited.has(adjIdx)) {
        continue;
      }
      
      // Check if adjacent cell has the same character
      if (chars[adjIdx] === targetChar) {
        visited.add(adjIdx);
        queue.push(adj);
      }
    }
  }
  
  return { positions, targetChar };
}

/**
 * Check if filling would affect any cells
 * (useful for preview/validation before applying)
 */
export function canFill(
  chars: string[],
  width: number,
  height: number,
  startRow: number,
  startCol: number,
  newChar: string
): boolean {
  if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) {
    return false;
  }
  
  const startIdx = startRow * width + startCol;
  const targetChar = chars[startIdx];
  
  // If target is already the new character, no fill needed
  return targetChar !== newChar;
}

/**
 * Calculate bounding box of fill area
 * Useful for preview highlighting
 */
export function getFillBounds(positions: FillPosition[]): {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
} | null {
  if (positions.length === 0) {
    return null;
  }
  
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;
  
  for (const pos of positions) {
    minRow = Math.min(minRow, pos.row);
    maxRow = Math.max(maxRow, pos.row);
    minCol = Math.min(minCol, pos.col);
    maxCol = Math.max(maxCol, pos.col);
  }
  
  return { minRow, maxRow, minCol, maxCol };
}

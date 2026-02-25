/**
 * Flood Fill Algorithm — F010: Fill Tool
 * 
 * Standard 4-connected flood fill using a queue (BFS).
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
  const currentChar = chars[idx] || ' ';
  // Can fill if current cell is different from fill character
  return currentChar !== fillCharacter;
}

export interface FloodFillResult {
  positions: FillPosition[];
  targetChar: string;
}

/**
 * Perform flood fill operation using BFS
 * Returns all positions that should be filled
 */
export function floodFill(
  chars: string[],
  width: number,
  height: number,
  startRow: number,
  startCol: number
): FloodFillResult {
  if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) {
    return { positions: [], targetChar: '' };
  }
  
  const startIdx = startRow * width + startCol;
  const targetChar = chars[startIdx] || ' ';
  
  // Track visited cells
  const visited = new Set<string>();
  const positions: FillPosition[] = [];
  
  // BFS queue
  const queue: FillPosition[] = [{ row: startRow, col: startCol }];
  
  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    const key = `${row}-${col}`;
    
    // Skip if out of bounds or already visited
    if (row < 0 || row >= height || col < 0 || col >= width) continue;
    if (visited.has(key)) continue;
    
    // Check if this cell matches the target character
    const idx = row * width + col;
    const cellChar = chars[idx] || ' ';
    if (cellChar !== targetChar) continue;
    
    // Mark as visited and add to result
    visited.add(key);
    positions.push({ row, col });
    
    // Add 4-connected neighbors to queue
    queue.push({ row: row - 1, col });  // up
    queue.push({ row: row + 1, col });  // down
    queue.push({ row, col: col - 1 });  // left
    queue.push({ row, col: col + 1 });  // right
  }
  
  return { positions, targetChar };
}

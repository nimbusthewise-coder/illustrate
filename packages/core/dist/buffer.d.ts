/**
 * Buffer model — flat typed arrays for terminal-style cell grids.
 * See PRD §5.1.
 */
export declare const FLAG_BOLD = 1;
export declare const FLAG_ITALIC = 2;
export declare const FLAG_UNDERLINE = 4;
export declare const DEFAULT_CHAR = 32;
export declare const DEFAULT_FG = 4294967295;
export declare const DEFAULT_BG = 0;
export declare const DEFAULT_FLAGS = 0;
export interface Cell {
    char: number;
    fg: number;
    bg: number;
    flags: number;
}
export interface Buffer {
    width: number;
    height: number;
    chars: Uint16Array;
    fg: Uint32Array;
    bg: Uint32Array;
    flags: Uint8Array;
}
/** Compute flat array index for (col, row). Throws on out-of-bounds. */
export declare function index(buffer: Buffer, col: number, row: number): number;
/** Create a new buffer initialised with empty (space) cells. */
export declare function createBuffer(width: number, height: number): Buffer;
/** Read the cell at (col, row). */
export declare function getCell(buffer: Buffer, col: number, row: number): Cell;
/** Write a cell at (col, row). */
export declare function setCell(buffer: Buffer, col: number, row: number, cell: Partial<Cell>): void;
/** Reset every cell in the buffer to defaults. */
export declare function clearBuffer(buffer: Buffer): void;
/** Deep-copy a buffer. Mutating the clone will not affect the original. */
export declare function cloneBuffer(buffer: Buffer): Buffer;
/**
 * Resize a buffer, preserving content that fits in the new dimensions.
 * Returns a **new** Buffer; the original is not mutated.
 */
export declare function resizeBuffer(buffer: Buffer, newWidth: number, newHeight: number): Buffer;
//# sourceMappingURL=buffer.d.ts.map
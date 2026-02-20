/**
 * Buffer model — flat typed arrays for terminal-style cell grids.
 * See PRD §5.1.
 */
// ── Flag bit masks ──────────────────────────────────────────────────
export const FLAG_BOLD = 0b0000_0001;
export const FLAG_ITALIC = 0b0000_0010;
export const FLAG_UNDERLINE = 0b0000_0100;
// ── Default cell values ─────────────────────────────────────────────
export const DEFAULT_CHAR = 0x20; // space
export const DEFAULT_FG = 0xFFFFFFFF; // white, fully opaque
export const DEFAULT_BG = 0x00000000; // transparent black
export const DEFAULT_FLAGS = 0;
// ── Helpers ─────────────────────────────────────────────────────────
/** Compute flat array index for (col, row). Throws on out-of-bounds. */
export function index(buffer, col, row) {
    if (col < 0 || col >= buffer.width || row < 0 || row >= buffer.height) {
        throw new RangeError(`Cell (${col}, ${row}) out of bounds for ${buffer.width}×${buffer.height} buffer`);
    }
    return row * buffer.width + col;
}
// ── Factory ─────────────────────────────────────────────────────────
/** Create a new buffer initialised with empty (space) cells. */
export function createBuffer(width, height) {
    if (width < 0 || height < 0) {
        throw new RangeError(`Buffer dimensions must be non-negative: ${width}×${height}`);
    }
    const size = width * height;
    const chars = new Uint16Array(size);
    chars.fill(DEFAULT_CHAR);
    const fg = new Uint32Array(size);
    fg.fill(DEFAULT_FG);
    const bg = new Uint32Array(size);
    bg.fill(DEFAULT_BG);
    const flags = new Uint8Array(size);
    // flags default to 0, which matches DEFAULT_FLAGS
    return { width, height, chars, fg, bg, flags };
}
// ── Accessors ───────────────────────────────────────────────────────
/** Read the cell at (col, row). */
export function getCell(buffer, col, row) {
    const i = index(buffer, col, row);
    return {
        char: buffer.chars[i],
        fg: buffer.fg[i],
        bg: buffer.bg[i],
        flags: buffer.flags[i],
    };
}
/** Write a cell at (col, row). */
export function setCell(buffer, col, row, cell) {
    const i = index(buffer, col, row);
    if (cell.char !== undefined)
        buffer.chars[i] = cell.char;
    if (cell.fg !== undefined)
        buffer.fg[i] = cell.fg;
    if (cell.bg !== undefined)
        buffer.bg[i] = cell.bg;
    if (cell.flags !== undefined)
        buffer.flags[i] = cell.flags;
}
// ── Bulk operations ─────────────────────────────────────────────────
/** Reset every cell in the buffer to defaults. */
export function clearBuffer(buffer) {
    buffer.chars.fill(DEFAULT_CHAR);
    buffer.fg.fill(DEFAULT_FG);
    buffer.bg.fill(DEFAULT_BG);
    buffer.flags.fill(DEFAULT_FLAGS);
}
/** Deep-copy a buffer. Mutating the clone will not affect the original. */
export function cloneBuffer(buffer) {
    return {
        width: buffer.width,
        height: buffer.height,
        chars: new Uint16Array(buffer.chars),
        fg: new Uint32Array(buffer.fg),
        bg: new Uint32Array(buffer.bg),
        flags: new Uint8Array(buffer.flags),
    };
}
/**
 * Resize a buffer, preserving content that fits in the new dimensions.
 * Returns a **new** Buffer; the original is not mutated.
 */
export function resizeBuffer(buffer, newWidth, newHeight) {
    if (newWidth < 0 || newHeight < 0) {
        throw new RangeError(`Buffer dimensions must be non-negative: ${newWidth}×${newHeight}`);
    }
    const dst = createBuffer(newWidth, newHeight);
    const copyW = Math.min(buffer.width, newWidth);
    const copyH = Math.min(buffer.height, newHeight);
    for (let row = 0; row < copyH; row++) {
        const srcOff = row * buffer.width;
        const dstOff = row * newWidth;
        dst.chars.set(buffer.chars.subarray(srcOff, srcOff + copyW), dstOff);
        dst.fg.set(buffer.fg.subarray(srcOff, srcOff + copyW), dstOff);
        dst.bg.set(buffer.bg.subarray(srcOff, srcOff + copyW), dstOff);
        dst.flags.set(buffer.flags.subarray(srcOff, srcOff + copyW), dstOff);
    }
    return dst;
}
//# sourceMappingURL=buffer.js.map
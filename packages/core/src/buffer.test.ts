import { describe, it, expect } from "vitest";
import {
  createBuffer,
  getCell,
  setCell,
  clearBuffer,
  cloneBuffer,
  resizeBuffer,
  index,
  DEFAULT_CHAR,
  DEFAULT_FG,
  DEFAULT_BG,
  DEFAULT_FLAGS,
  FLAG_BOLD,
  FLAG_ITALIC,
  FLAG_UNDERLINE,
} from "./buffer.js";

// ── createBuffer ────────────────────────────────────────────────────

describe("createBuffer", () => {
  it("creates a buffer with correct dimensions", () => {
    const buf = createBuffer(10, 5);
    expect(buf.width).toBe(10);
    expect(buf.height).toBe(5);
    expect(buf.chars.length).toBe(50);
    expect(buf.fg.length).toBe(50);
    expect(buf.bg.length).toBe(50);
    expect(buf.flags.length).toBe(50);
  });

  it("initialises cells with defaults", () => {
    const buf = createBuffer(3, 2);
    for (let i = 0; i < 6; i++) {
      expect(buf.chars[i]).toBe(DEFAULT_CHAR);
      expect(buf.fg[i]).toBe(DEFAULT_FG);
      expect(buf.bg[i]).toBe(DEFAULT_BG);
      expect(buf.flags[i]).toBe(DEFAULT_FLAGS);
    }
  });

  it("creates a 0×0 buffer", () => {
    const buf = createBuffer(0, 0);
    expect(buf.chars.length).toBe(0);
  });

  it("throws on negative dimensions", () => {
    expect(() => createBuffer(-1, 5)).toThrow(RangeError);
  });
});

// ── index ───────────────────────────────────────────────────────────

describe("index", () => {
  it("computes row * width + col", () => {
    const buf = createBuffer(10, 5);
    expect(index(buf, 0, 0)).toBe(0);
    expect(index(buf, 9, 0)).toBe(9);
    expect(index(buf, 0, 1)).toBe(10);
    expect(index(buf, 3, 2)).toBe(23);
  });

  it("throws on out-of-bounds access", () => {
    const buf = createBuffer(10, 5);
    expect(() => index(buf, -1, 0)).toThrow(RangeError);
    expect(() => index(buf, 10, 0)).toThrow(RangeError);
    expect(() => index(buf, 0, -1)).toThrow(RangeError);
    expect(() => index(buf, 0, 5)).toThrow(RangeError);
  });
});

// ── getCell / setCell roundtrip ─────────────────────────────────────

describe("getCell / setCell", () => {
  it("reads default cell", () => {
    const buf = createBuffer(5, 5);
    const cell = getCell(buf, 2, 3);
    expect(cell.char).toBe(DEFAULT_CHAR);
    expect(cell.fg).toBe(DEFAULT_FG);
    expect(cell.bg).toBe(DEFAULT_BG);
    expect(cell.flags).toBe(DEFAULT_FLAGS);
  });

  it("roundtrips a full cell write", () => {
    const buf = createBuffer(5, 5);
    setCell(buf, 1, 2, {
      char: 0x41, // 'A'
      fg: 0xFF0000FF,
      bg: 0x00FF00FF,
      flags: FLAG_BOLD | FLAG_UNDERLINE,
    });
    const cell = getCell(buf, 1, 2);
    expect(cell.char).toBe(0x41);
    expect(cell.fg).toBe(0xFF0000FF);
    expect(cell.bg).toBe(0x00FF00FF);
    expect(cell.flags).toBe(FLAG_BOLD | FLAG_UNDERLINE);
  });

  it("supports partial cell updates", () => {
    const buf = createBuffer(5, 5);
    setCell(buf, 0, 0, { char: 0x42 });
    const cell = getCell(buf, 0, 0);
    expect(cell.char).toBe(0x42);
    expect(cell.fg).toBe(DEFAULT_FG); // unchanged
  });

  it("throws on out-of-bounds get/set", () => {
    const buf = createBuffer(5, 5);
    expect(() => getCell(buf, 5, 0)).toThrow(RangeError);
    expect(() => setCell(buf, 0, 5, { char: 0x41 })).toThrow(RangeError);
  });
});

// ── clearBuffer ─────────────────────────────────────────────────────

describe("clearBuffer", () => {
  it("resets all cells to defaults", () => {
    const buf = createBuffer(3, 3);
    setCell(buf, 1, 1, { char: 0x58, fg: 0x12345678, flags: FLAG_ITALIC });
    clearBuffer(buf);
    const cell = getCell(buf, 1, 1);
    expect(cell.char).toBe(DEFAULT_CHAR);
    expect(cell.fg).toBe(DEFAULT_FG);
    expect(cell.flags).toBe(DEFAULT_FLAGS);
  });
});

// ── cloneBuffer ─────────────────────────────────────────────────────

describe("cloneBuffer", () => {
  it("produces an independent copy", () => {
    const buf = createBuffer(4, 4);
    setCell(buf, 2, 2, { char: 0x5A, fg: 0xAABBCCDD });
    const clone = cloneBuffer(buf);

    // Clone has same data
    expect(getCell(clone, 2, 2).char).toBe(0x5A);
    expect(getCell(clone, 2, 2).fg).toBe(0xAABBCCDD);

    // Mutating clone doesn't affect original
    setCell(clone, 2, 2, { char: 0x00 });
    expect(getCell(buf, 2, 2).char).toBe(0x5A);
    expect(getCell(clone, 2, 2).char).toBe(0x00);
  });
});

// ── resizeBuffer ────────────────────────────────────────────────────

describe("resizeBuffer", () => {
  it("grows and preserves content", () => {
    const buf = createBuffer(3, 3);
    setCell(buf, 2, 2, { char: 0x41 });
    const bigger = resizeBuffer(buf, 5, 5);

    expect(bigger.width).toBe(5);
    expect(bigger.height).toBe(5);
    // Preserved cell
    expect(getCell(bigger, 2, 2).char).toBe(0x41);
    // New cell has defaults
    expect(getCell(bigger, 4, 4).char).toBe(DEFAULT_CHAR);
  });

  it("shrinks and clips content", () => {
    const buf = createBuffer(5, 5);
    setCell(buf, 4, 4, { char: 0x42 });
    setCell(buf, 1, 1, { char: 0x43 });
    const smaller = resizeBuffer(buf, 3, 3);

    expect(smaller.width).toBe(3);
    expect(smaller.height).toBe(3);
    // Preserved cell
    expect(getCell(smaller, 1, 1).char).toBe(0x43);
    // Clipped cell is gone
    expect(() => getCell(smaller, 4, 4)).toThrow(RangeError);
  });

  it("does not mutate the original buffer", () => {
    const buf = createBuffer(3, 3);
    setCell(buf, 0, 0, { char: 0x44 });
    const resized = resizeBuffer(buf, 5, 5);
    setCell(resized, 0, 0, { char: 0x00 });
    expect(getCell(buf, 0, 0).char).toBe(0x44);
  });

  it("throws on negative dimensions", () => {
    const buf = createBuffer(3, 3);
    expect(() => resizeBuffer(buf, -1, 3)).toThrow(RangeError);
  });
});

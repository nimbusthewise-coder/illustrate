/**
 * Tests for ASCII Export — F041: Plain ASCII Text Export
 */

import { describe, it, expect } from 'vitest';
import {
  compositeLayers,
  exportToAscii,
  exportLayersToAscii,
} from './export';
import type { Layer, Buffer } from './types';

function createEmptyBuffer(width: number, height: number): Buffer {
  return {
    width,
    height,
    chars: new Array(width * height).fill(' '),
    fg: new Array(width * height).fill(''),
    bg: new Array(width * height).fill(''),
    flags: new Array(width * height).fill(0),
  };
}

function createLayer(
  id: string,
  name: string,
  buffer: Buffer,
  options: {
    visible?: boolean;
    x?: number;
    y?: number;
  } = {}
): Layer {
  return {
    id,
    name,
    parentId: null,
    visible: options.visible ?? true,
    locked: false,
    x: options.x ?? 0,
    y: options.y ?? 0,
    buffer,
  };
}

describe('compositeLayers', () => {
  it('should create empty buffer for no layers', () => {
    const result = compositeLayers([], 10, 5);
    expect(result.width).toBe(10);
    expect(result.height).toBe(5);
    expect(result.chars.every((c) => c === ' ')).toBe(true);
  });

  it('should composite single layer', () => {
    const buffer = createEmptyBuffer(3, 2);
    buffer.chars[0] = 'A';
    buffer.chars[1] = 'B';
    buffer.chars[2] = 'C';

    const layer = createLayer('layer1', 'Layer 1', buffer);
    const result = compositeLayers([layer], 3, 2);

    expect(result.chars[0]).toBe('A');
    expect(result.chars[1]).toBe('B');
    expect(result.chars[2]).toBe('C');
  });

  it('should skip invisible layers', () => {
    const buffer1 = createEmptyBuffer(3, 1);
    buffer1.chars[0] = 'A';

    const buffer2 = createEmptyBuffer(3, 1);
    buffer2.chars[0] = 'B';

    const layer1 = createLayer('layer1', 'Layer 1', buffer1, { visible: true });
    const layer2 = createLayer('layer2', 'Layer 2', buffer2, {
      visible: false,
    });

    const result = compositeLayers([layer1, layer2], 3, 1);
    expect(result.chars[0]).toBe('A');
  });

  it('should composite multiple layers in order', () => {
    const buffer1 = createEmptyBuffer(3, 1);
    buffer1.chars[0] = 'A';

    const buffer2 = createEmptyBuffer(3, 1);
    buffer2.chars[1] = 'B';

    const layer1 = createLayer('layer1', 'Layer 1', buffer1);
    const layer2 = createLayer('layer2', 'Layer 2', buffer2);

    const result = compositeLayers([layer1, layer2], 3, 1);
    expect(result.chars[0]).toBe('A');
    expect(result.chars[1]).toBe('B');
    expect(result.chars[2]).toBe(' ');
  });

  it('should handle layer offsets (x, y)', () => {
    const buffer = createEmptyBuffer(2, 2);
    buffer.chars[0] = 'X';

    const layer = createLayer('layer1', 'Layer 1', buffer, { x: 1, y: 1 });
    const result = compositeLayers([layer], 4, 4);

    // X should appear at position (1, 1) in canvas
    const index = 1 * 4 + 1; // row 1, col 1
    expect(result.chars[index]).toBe('X');
  });

  it('should clip layers that extend beyond canvas bounds', () => {
    const buffer = createEmptyBuffer(3, 3);
    buffer.chars[0] = 'A';
    buffer.chars[2] = 'B';

    const layer = createLayer('layer1', 'Layer 1', buffer, { x: -1, y: 0 });
    const result = compositeLayers([layer], 2, 3);

    // A at (-1, 0) is clipped, B at (1, 0) becomes (0, 0)
    expect(result.chars[0]).toBe(' '); // A is out of bounds
  });

  it('should overlay later layers on top of earlier ones', () => {
    const buffer1 = createEmptyBuffer(2, 1);
    buffer1.chars[0] = 'A';
    buffer1.chars[1] = 'B';

    const buffer2 = createEmptyBuffer(2, 1);
    buffer2.chars[0] = 'X';

    const layer1 = createLayer('layer1', 'Layer 1', buffer1);
    const layer2 = createLayer('layer2', 'Layer 2', buffer2);

    const result = compositeLayers([layer1, layer2], 2, 1);
    expect(result.chars[0]).toBe('X'); // layer2 overwrites
    expect(result.chars[1]).toBe('B'); // layer1 shows through
  });

  it('should skip transparent cells (space with no background)', () => {
    const buffer1 = createEmptyBuffer(2, 1);
    buffer1.chars[0] = 'A';
    buffer1.chars[1] = 'B';

    const buffer2 = createEmptyBuffer(2, 1);
    buffer2.chars[0] = ' '; // transparent
    buffer2.bg[0] = ''; // no background

    const layer1 = createLayer('layer1', 'Layer 1', buffer1);
    const layer2 = createLayer('layer2', 'Layer 2', buffer2);

    const result = compositeLayers([layer1, layer2], 2, 1);
    expect(result.chars[0]).toBe('A'); // layer2 transparent, layer1 shows through
    expect(result.chars[1]).toBe('B');
  });

  it('should render space with background color', () => {
    const buffer1 = createEmptyBuffer(2, 1);
    buffer1.chars[0] = 'A';

    const buffer2 = createEmptyBuffer(2, 1);
    buffer2.chars[0] = ' '; // space
    buffer2.bg[0] = '#ff0000'; // but has background

    const layer1 = createLayer('layer1', 'Layer 1', buffer1);
    const layer2 = createLayer('layer2', 'Layer 2', buffer2);

    const result = compositeLayers([layer1, layer2], 2, 1);
    expect(result.chars[0]).toBe(' '); // space overwrites A
    expect(result.bg[0]).toBe('#ff0000');
  });
});

describe('exportToAscii', () => {
  it('should export empty buffer', () => {
    const buffer = createEmptyBuffer(3, 2);
    const result = exportToAscii(buffer);
    expect(result).toBe('\n');
  });

  it('should export single line', () => {
    const buffer = createEmptyBuffer(5, 1);
    buffer.chars[0] = 'H';
    buffer.chars[1] = 'e';
    buffer.chars[2] = 'l';
    buffer.chars[3] = 'l';
    buffer.chars[4] = 'o';

    const result = exportToAscii(buffer);
    expect(result).toBe('Hello');
  });

  it('should export multiple lines', () => {
    const buffer = createEmptyBuffer(3, 3);
    buffer.chars[0] = 'A';
    buffer.chars[1] = 'B';
    buffer.chars[2] = 'C';
    buffer.chars[3] = 'D';
    buffer.chars[4] = 'E';
    buffer.chars[5] = 'F';
    buffer.chars[6] = 'G';
    buffer.chars[7] = 'H';
    buffer.chars[8] = 'I';

    const result = exportToAscii(buffer);
    expect(result).toBe('ABC\nDEF\nGHI');
  });

  it('should trim trailing whitespace per F041 AC', () => {
    const buffer = createEmptyBuffer(5, 2);
    buffer.chars[0] = 'A';
    buffer.chars[1] = 'B';
    // chars[2-4] are spaces

    buffer.chars[5] = 'C';
    // chars[6-9] are spaces

    const result = exportToAscii(buffer);
    expect(result).toBe('AB\nC');
  });

  it('should preserve leading whitespace', () => {
    const buffer = createEmptyBuffer(5, 1);
    buffer.chars[2] = 'X';

    const result = exportToAscii(buffer);
    expect(result).toBe('  X');
  });

  it('should preserve internal whitespace', () => {
    const buffer = createEmptyBuffer(5, 1);
    buffer.chars[0] = 'A';
    buffer.chars[2] = 'B';
    buffer.chars[4] = 'C';

    const result = exportToAscii(buffer);
    expect(result).toBe('A B C');
  });

  it('should handle box-drawing characters', () => {
    const buffer = createEmptyBuffer(3, 3);
    buffer.chars[0] = '┌';
    buffer.chars[1] = '─';
    buffer.chars[2] = '┐';
    buffer.chars[3] = '│';
    buffer.chars[4] = ' ';
    buffer.chars[5] = '│';
    buffer.chars[6] = '└';
    buffer.chars[7] = '─';
    buffer.chars[8] = '┘';

    const result = exportToAscii(buffer);
    expect(result).toBe('┌─┐\n│ │\n└─┘');
  });
});

describe('exportLayersToAscii', () => {
  it('should composite and export in one call', () => {
    const buffer1 = createEmptyBuffer(3, 2);
    buffer1.chars[0] = 'A';
    buffer1.chars[1] = 'B';

    const buffer2 = createEmptyBuffer(3, 2);
    buffer2.chars[3] = 'C';
    buffer2.chars[4] = 'D';

    const layer1 = createLayer('layer1', 'Layer 1', buffer1);
    const layer2 = createLayer('layer2', 'Layer 2', buffer2);

    const result = exportLayersToAscii([layer1, layer2], 3, 2);
    expect(result).toBe('AB\nCD');
  });

  it('should match canvas dimensions exactly per F041 AC', () => {
    const buffer = createEmptyBuffer(2, 2);
    buffer.chars[0] = 'A';

    const layer = createLayer('layer1', 'Layer 1', buffer);

    const result = exportLayersToAscii([layer], 5, 3);
    const lines = result.split('\n');

    expect(lines).toHaveLength(3); // height = 3
    expect(lines[0]).toBe('A'); // width = 5, trailing spaces trimmed
  });

  it('should handle empty canvas', () => {
    const result = exportLayersToAscii([], 10, 5);
    const lines = result.split('\n');

    expect(lines).toHaveLength(5);
    expect(lines.every((line) => line === '')).toBe(true);
  });

  it('should produce newline-delimited rows per F041 AC', () => {
    const buffer = createEmptyBuffer(2, 3);
    buffer.chars[0] = 'A';
    buffer.chars[2] = 'B';
    buffer.chars[4] = 'C';

    const layer = createLayer('layer1', 'Layer 1', buffer);

    const result = exportLayersToAscii([layer], 2, 3);
    expect(result).toBe('A\nB\nC');
    expect(result.split('\n')).toHaveLength(3);
  });
});

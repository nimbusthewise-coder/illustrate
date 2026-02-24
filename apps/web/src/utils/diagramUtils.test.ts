/**
 * Tests for diagram utility functions — F048
 */

import { describe, it, expect } from 'vitest';
import {
  generateDiagramId,
  generateThumbnail,
  countNonEmptyCells,
  extractUniqueTags,
  formatDate,
  fuzzyMatch,
  exportAsAscii,
  exportAsSvg,
  DIAGRAM_TEMPLATES,
} from './diagramUtils';

describe('generateDiagramId', () => {
  it('generates unique IDs starting with "diag-"', () => {
    const id1 = generateDiagramId();
    const id2 = generateDiagramId();
    expect(id1).toMatch(/^diag-/);
    expect(id2).toMatch(/^diag-/);
    expect(id1).not.toBe(id2);
  });
});

describe('generateThumbnail', () => {
  it('generates a thumbnail from visible layers', () => {
    const layers = [
      {
        visible: true,
        buffer: {
          width: 5,
          height: 2,
          chars: ['H', 'e', 'l', 'l', 'o', 'W', 'o', 'r', 'l', 'd'],
        },
      },
    ];
    const thumb = generateThumbnail(layers);
    expect(thumb).toContain('H');
  });

  it('returns empty string for empty layers', () => {
    expect(generateThumbnail([])).toBe('');
  });
});

describe('countNonEmptyCells', () => {
  it('counts non-space characters', () => {
    expect(countNonEmptyCells(['a', ' ', 'b', ' ', 'c'])).toBe(3);
  });

  it('returns 0 for all spaces', () => {
    expect(countNonEmptyCells([' ', ' ', ' '])).toBe(0);
  });

  it('handles empty array', () => {
    expect(countNonEmptyCells([])).toBe(0);
  });
});

describe('extractUniqueTags', () => {
  it('extracts and sorts unique tags', () => {
    const diagrams = [
      { tags: ['beta', 'alpha'] },
      { tags: ['gamma', 'alpha'] },
      { tags: ['beta'] },
    ];
    expect(extractUniqueTags(diagrams)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns empty array for no tags', () => {
    expect(extractUniqueTags([])).toEqual([]);
  });
});

describe('formatDate', () => {
  it('returns "Just now" for very recent timestamps', () => {
    expect(formatDate(Date.now())).toBe('Just now');
  });

  it('returns minutes ago for recent timestamps', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(formatDate(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago for same-day timestamps', () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    expect(formatDate(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = Date.now() - 25 * 60 * 60 * 1000;
    expect(formatDate(yesterday)).toBe('Yesterday');
  });

  it('returns days ago for recent past', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(formatDate(threeDaysAgo)).toBe('3d ago');
  });
});

describe('fuzzyMatch', () => {
  it('matches all query words anywhere in text', () => {
    expect(fuzzyMatch('Hello World', 'hello')).toBe(true);
    expect(fuzzyMatch('Hello World', 'world hello')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(fuzzyMatch('Hello World', 'HELLO')).toBe(true);
  });

  it('returns false for non-matching', () => {
    expect(fuzzyMatch('Hello World', 'foo')).toBe(false);
  });

  it('returns true for empty query', () => {
    expect(fuzzyMatch('anything', '')).toBe(true);
  });
});

describe('exportAsAscii', () => {
  it('exports visible layer content', () => {
    const layers = [
      {
        visible: true,
        buffer: {
          width: 5,
          height: 2,
          chars: ['H', 'e', 'l', 'l', 'o', ' ', ' ', ' ', ' ', ' '],
        },
      },
    ];
    const result = exportAsAscii(layers);
    expect(result).toBe('Hello');
  });

  it('composites multiple visible layers', () => {
    const layers = [
      {
        visible: true,
        buffer: {
          width: 3,
          height: 1,
          chars: ['A', ' ', 'C'],
        },
      },
      {
        visible: true,
        buffer: {
          width: 3,
          height: 1,
          chars: [' ', 'B', ' '],
        },
      },
    ];
    const result = exportAsAscii(layers);
    expect(result).toBe('ABC');
  });

  it('skips hidden layers', () => {
    const layers = [
      {
        visible: true,
        buffer: { width: 3, height: 1, chars: ['A', ' ', ' '] },
      },
      {
        visible: false,
        buffer: { width: 3, height: 1, chars: ['X', 'Y', 'Z'] },
      },
    ];
    const result = exportAsAscii(layers);
    expect(result).toBe('A');
  });

  it('returns empty string for no layers', () => {
    expect(exportAsAscii([])).toBe('');
  });
});

describe('exportAsSvg', () => {
  it('generates valid SVG markup', () => {
    const svg = exportAsSvg('Hello\nWorld');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('Hello');
    expect(svg).toContain('World');
  });

  it('escapes special characters', () => {
    const svg = exportAsSvg('<test>&');
    expect(svg).toContain('&lt;test&gt;&amp;');
  });

  it('applies custom options', () => {
    const svg = exportAsSvg('Hi', { fontSize: 20, bg: '#000000', fg: '#ffffff' });
    expect(svg).toContain('font-size="20"');
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill="#ffffff"');
  });
});

describe('DIAGRAM_TEMPLATES', () => {
  it('has at least 5 templates', () => {
    expect(DIAGRAM_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('every template has required fields', () => {
    for (const template of DIAGRAM_TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(template.tags.length).toBeGreaterThan(0);
      expect(template.width).toBeGreaterThan(0);
      expect(template.height).toBeGreaterThan(0);
      expect(template.ascii).toBeTruthy();
    }
  });

  it('templates have unique IDs', () => {
    const ids = DIAGRAM_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

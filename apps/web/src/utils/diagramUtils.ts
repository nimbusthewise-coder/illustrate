/**
 * Diagram utility functions
 * F048: Diagram Library
 */

/**
 * Generate a unique ID for diagrams
 */
export function generateDiagramId(): string {
  return `diag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a simple ASCII thumbnail from layers
 * Returns a compact string representation of the diagram
 */
export function generateThumbnail(
  layers: Array<{ visible: boolean; buffer: { width: number; height: number; chars: string[] } }>,
  maxWidth = 40,
  maxHeight = 12
): string {
  if (layers.length === 0) return '';

  const firstVisible = layers.find((l) => l.visible) ?? layers[0];
  const { buffer } = firstVisible;
  const scaleX = Math.max(1, Math.ceil(buffer.width / maxWidth));
  const scaleY = Math.max(1, Math.ceil(buffer.height / maxHeight));

  const rows: string[] = [];
  for (let y = 0; y < buffer.height && rows.length < maxHeight; y += scaleY) {
    let row = '';
    for (let x = 0; x < buffer.width && row.length < maxWidth; x += scaleX) {
      const idx = y * buffer.width + x;
      const ch = buffer.chars[idx] ?? ' ';
      row += ch;
    }
    rows.push(row);
  }

  return rows.join('\n');
}

/**
 * Count non-empty cells in a buffer
 */
export function countNonEmptyCells(
  chars: string[]
): number {
  return chars.filter((ch) => ch !== ' ' && ch !== '').length;
}

/**
 * Extract all unique tags from a list of diagrams
 */
export function extractUniqueTags(
  diagrams: Array<{ tags: string[] }>
): string[] {
  const tagSet = new Set<string>();
  for (const d of diagrams) {
    for (const t of d.tags) {
      tagSet.add(t);
    }
  }
  return Array.from(tagSet).sort();
}

/**
 * Format a timestamp into a human-readable date string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Simple fuzzy search match — checks if all words in query appear in text
 */
export function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((w) => lowerText.includes(w));
}

/**
 * Export a diagram's buffer content as plain ASCII text
 */
export function exportAsAscii(
  layers: Array<{ visible: boolean; buffer: { width: number; height: number; chars: string[] } }>
): string {
  if (layers.length === 0) return '';

  const visibleLayers = layers.filter((l) => l.visible);
  if (visibleLayers.length === 0) return '';

  const first = visibleLayers[0];
  const { width, height } = first.buffer;
  const merged = new Array(width * height).fill(' ');

  // Composite layers bottom to top
  for (const layer of visibleLayers) {
    for (let i = 0; i < layer.buffer.chars.length; i++) {
      const ch = layer.buffer.chars[i];
      if (ch && ch !== ' ') {
        merged[i] = ch;
      }
    }
  }

  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += merged[y * width + x];
    }
    rows.push(row.trimEnd());
  }

  // Remove trailing empty rows
  while (rows.length > 0 && rows[rows.length - 1] === '') {
    rows.pop();
  }

  return rows.join('\n');
}

/**
 * Generate SVG from ASCII text (simple monospace rendering)
 */
export function exportAsSvg(
  asciiText: string,
  options: { fontSize?: number; fontFamily?: string; padding?: number; bg?: string; fg?: string } = {}
): string {
  const {
    fontSize = 14,
    fontFamily = "'SF Mono', 'JetBrains Mono', monospace",
    padding = 16,
    bg = '#ffffff',
    fg = '#000000',
  } = options;

  const lines = asciiText.split('\n');
  const maxCols = Math.max(...lines.map((l) => l.length), 1);
  const charWidth = fontSize * 0.6;
  const lineHeight = fontSize * 1.4;
  const width = maxCols * charWidth + padding * 2;
  const height = lines.length * lineHeight + padding * 2;

  const escapedLines = lines.map((line, i) => {
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const y = padding + (i + 1) * lineHeight;
    return `<text x="${padding}" y="${y}">${escaped}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g font-family="${fontFamily}" font-size="${fontSize}" fill="${fg}" xml:space="preserve">
    ${escapedLines.join('\n    ')}
  </g>
</svg>`;
}

/**
 * Template diagrams for the gallery
 */
export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  ascii: string;
}

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'tmpl-flowchart',
    name: 'Simple Flowchart',
    description: 'A basic top-down flowchart with decision nodes',
    category: 'flowchart',
    tags: ['flowchart', 'decision', 'process'],
    width: 40,
    height: 16,
    ascii: `┌─────────┐
│  Start  │
└────┬────┘
     │
┌────▼────┐
│ Process │
└────┬────┘
     │
 ┌───▼───┐
 │  End  │
 └───────┘`,
  },
  {
    id: 'tmpl-box-diagram',
    name: 'Box Layout',
    description: 'A container layout with nested boxes',
    category: 'layout',
    tags: ['layout', 'container', 'boxes'],
    width: 50,
    height: 12,
    ascii: `┌──────────────────────────────────┐
│  Header                          │
├────────────┬─────────────────────┤
│            │                     │
│  Sidebar   │  Main Content       │
│            │                     │
│            │                     │
├────────────┴─────────────────────┤
│  Footer                          │
└──────────────────────────────────┘`,
  },
  {
    id: 'tmpl-sequence',
    name: 'Sequence Diagram',
    description: 'A simple sequence diagram with two actors',
    category: 'sequence',
    tags: ['sequence', 'actors', 'messages'],
    width: 50,
    height: 14,
    ascii: `  Client          Server         Database
    │                │                │
    │───request────►│                │
    │                │───query──────►│
    │                │◄──results─────│
    │◄──response────│                │
    │                │                │`,
  },
  {
    id: 'tmpl-tree',
    name: 'Tree Structure',
    description: 'A hierarchical tree diagram',
    category: 'hierarchy',
    tags: ['tree', 'hierarchy', 'organization'],
    width: 40,
    height: 10,
    ascii: `       Root
      ┌──┴──┐
    Node A  Node B
    ┌─┴─┐    │
  Leaf1 Leaf2 Leaf3`,
  },
  {
    id: 'tmpl-table',
    name: 'Data Table',
    description: 'A simple ASCII table structure',
    category: 'table',
    tags: ['table', 'data', 'grid'],
    width: 50,
    height: 8,
    ascii: `┌──────┬───────────┬────────┐
│ ID   │ Name      │ Status │
├──────┼───────────┼────────┤
│ 001  │ Widget A  │ Active │
│ 002  │ Widget B  │ Draft  │
│ 003  │ Widget C  │ Active │
└──────┴───────────┴────────┘`,
  },
  {
    id: 'tmpl-network',
    name: 'Network Topology',
    description: 'A basic network diagram with connected nodes',
    category: 'network',
    tags: ['network', 'topology', 'infrastructure'],
    width: 50,
    height: 12,
    ascii: `    ┌────────┐
    │ Router │
    └───┬────┘
   ┌────┼────┐
   │    │    │
┌──▼─┐┌─▼──┐┌▼───┐
│ PC1 ││ PC2 ││ PC3 │
└────┘└────┘└────┘`,
  },
];

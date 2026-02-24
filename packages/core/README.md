# @illustrate.md/core

Core rendering and export logic for illustrate.md - a renderer-agnostic canvas library for ASCII diagrams.

## Installation

```bash
npm install @illustrate.md/core
# or
pnpm add @illustrate.md/core
# or
yarn add @illustrate.md/core
```

## Features

- **Buffer-based canvas** - Efficient flat typed array representation
- **Layer compositing** - Multiple layers with offsets and visibility control
- **Plain ASCII export** (F041) - Clean text output with trailing whitespace trimmed
- **Zero dependencies** - Lightweight and portable
- **TypeScript support** - Full type definitions included

## Quick Start

```typescript
import { 
  createBuffer, 
  createLayer, 
  setChar, 
  exportPlainAscii 
} from '@illustrate.md/core';

// Create a layer
const layer = createLayer('layer1', 'My Layer', 10, 3);

// Draw a box
setChar(layer.buffer, 0, 0, '╔');
setChar(layer.buffer, 0, 1, '═');
setChar(layer.buffer, 0, 2, '╗');
setChar(layer.buffer, 1, 0, '║');
setChar(layer.buffer, 1, 2, '║');
setChar(layer.buffer, 2, 0, '╚');
setChar(layer.buffer, 2, 1, '═');
setChar(layer.buffer, 2, 2, '╝');

// Create document
const document = {
  id: 'doc1',
  title: 'Example',
  width: 10,
  height: 3,
  layers: [layer],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Export to ASCII
const ascii = exportPlainAscii(document);
console.log(ascii);
// Output:
// ╔═╗
// ║ ║
// ╚═╝
```

## API Reference

### Buffer Operations

#### `createBuffer(width: number, height: number): Buffer`
Create a new buffer with specified dimensions (1-256 characters).

#### `setChar(buffer: Buffer, row: number, col: number, char: string, fg?: number, bg?: number, flags?: number): void`
Set a character at a specific position with optional color and styling.

#### `getChar(buffer: Buffer, row: number, col: number): string`
Get the character at a specific position. Returns space for empty cells.

#### `clearCell(buffer: Buffer, row: number, col: number): void`
Clear a cell (set to empty).

#### `cloneBuffer(buffer: Buffer): Buffer`
Create an independent copy of a buffer.

### Layer Operations

#### `createLayer(id: string, name: string, width: number, height: number, parentId?: string | null): Layer`
Create a new layer with the specified dimensions.

#### `compositeLayers(layers: Layer[], width: number, height: number): Buffer`
Composite multiple layers into a single buffer. Only visible layers are included.

### Export

#### `exportPlainAscii(document: CanvasDocument): string`
**F041: Plain ASCII text export**

Export a canvas document to plain ASCII text:
- Composites all visible layers
- Trims trailing whitespace from each row
- Returns newline-delimited rows

### Types

#### `Buffer`
```typescript
interface Buffer {
  width: number;
  height: number;
  chars: Uint16Array;   // Unicode character codes
  fg: Uint32Array;      // Foreground color (RGBA)
  bg: Uint32Array;      // Background color (RGBA)
  flags: Uint8Array;    // Bold, italic, underline, etc.
}
```

#### `Layer`
```typescript
interface Layer {
  id: string;
  name: string;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  x: number;  // Offset within canvas
  y: number;
  buffer: Buffer;
}
```

#### `CanvasDocument`
```typescript
interface CanvasDocument {
  id: string;
  title: string;
  width: number;
  height: number;
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Type check
pnpm lint

# Run example
pnpm build && node example.js
```

## License

MIT

## Related

Part of the [illustrate.md](https://github.com/illustrate-md) project - an ASCII wireframing tool designed to bridge the communication gap between human design intent and AI language models.

# @illustrate.md/cli

Terminal UI for illustrate.md - ASCII wireframing and diagramming.

## Features

### F054: Render Diagram in Terminal

View diagrams with box-drawing characters and ANSI colors directly in your terminal.

```bash
illustrate view {id}
illustrate view {username}/{id}
```

**Features:**
- Box-drawing character rendering using Unicode characters (┌─┐│└┘)
- ANSI color support with auto-detection
- Graceful fallback for terminals without color support
- Optional title frame with `--frame` / `--no-frame`
- Color level override with `--color <level>`

**Color Levels:**
- `none` - No color (1-bit, plain text)
- `basic` - 16 colors (ANSI basic)
- `256` - 256 colors (ANSI extended)
- `truecolor` - 16 million colors (24-bit RGB)

### F063: Local .illustrate File Operations

Work with local `.illustrate` files on your filesystem.

**Open and render local files:**
```bash
illustrate open {file.illustrate}
illustrate open my-diagram.illustrate
illustrate open ../designs/wireframe.illustrate
```

**Save diagrams to local files:**
```bash
illustrate save {id} --out {file}
illustrate save abc123 --out my-diagram.illustrate
```

**File Format:**
The `.illustrate` format is a versioned JSON structure (PRD 5.4):
```json
{
  "version": "1",
  "document": {
    "id": "...",
    "title": "...",
    "width": 80,
    "height": 24,
    "layers": [...],
    ...
  }
}
```

### Examples

**Remote diagrams:**
```bash
# View diagram with auto-detected colors
illustrate view abc123

# View with specific color level
illustrate view abc123 --color 256

# View without frame
illustrate view abc123 --no-frame

# View user's diagram
illustrate view alice/wireframe-v2
```

**Local files:**
```bash
# Open a local file
illustrate open my-diagram.illustrate

# Save remote diagram to local file
illustrate save abc123 --out backup.illustrate

# Open with custom color settings
illustrate open wireframe.illustrate --color 256 --no-frame
```

## Installation

```bash
pnpm install @illustrate.md/cli
```

Or globally:

```bash
pnpm install -g @illustrate.md/cli
```

## Development

```bash
# Build
pnpm build

# Run tests
pnpm test

# Run terminal rendering demo
pnpm demo

# Run local file operations demo
pnpm demo:local
```

The `demo:local` script creates an `example.illustrate` file that you can view with:
```bash
illustrate open example.illustrate
```

## Requirements

- Node.js >= 20
- Terminal with Unicode support (for box-drawing characters)
- Optional: Terminal with ANSI color support (truecolor recommended)

## Graceful Fallback

The renderer automatically detects terminal capabilities:

1. **Truecolor** (24-bit RGB) - Modern terminals (iTerm2, VS Code, etc.)
2. **256-color** - Most terminal emulators
3. **16-color** - Basic ANSI
4. **No color** - Plain text fallback

Box-drawing characters work in any Unicode-capable terminal, regardless of color support.

## Related

- [@illustrate.md/core](../core) - Core data types and rendering
- [PRD.md](../../PRD.md) - Full product requirements

# @illustrate.md/cli

Command-line interface for illustrate.md diagrams.

## Installation

```bash
npm install -g @illustrate.md/cli
```

## Commands

### `export` - Export Diagram as Plain ASCII

Export a diagram to plain ASCII text (suitable for piping).

```bash
# Export from cloud (future feature)
illustrate export my-diagram

# Export from local file
illustrate export my-diagram --file diagram.illustrate

# Pipe to clipboard (macOS)
illustrate export my-diagram --file diagram.illustrate | pbcopy

# Save to file
illustrate export my-diagram --file diagram.illustrate > output.txt

# Pipe to other tools
illustrate export my-diagram --file diagram.illustrate | less
```

**Options:**
- `-f, --file <path>` - Load from local .illustrate file

---

### `copy` - Copy Diagram to Clipboard

Copy a diagram directly to the system clipboard.

```bash
# Copy plain ASCII
illustrate copy my-diagram --file diagram.illustrate

# Copy with ANSI color codes
illustrate copy my-diagram --file diagram.illustrate --colors

# Verbose output
illustrate copy my-diagram --file diagram.illustrate --verbose
```

**Options:**
- `-f, --file <path>` - Load from local .illustrate file
- `-c, --colors` - Include ANSI color codes
- `-v, --verbose` - Show detailed progress

---

### `render` - Render Diagram in Terminal (F054)

Render a diagram directly in your terminal with colors, borders, and interactive navigation for large diagrams.

```bash
# Basic rendering with auto-detection
illustrate render my-diagram --file diagram.illustrate

# Without colors (monochrome)
illustrate render my-diagram --file diagram.illustrate --no-color

# Without border decoration
illustrate render my-diagram --file diagram.illustrate --no-border

# Disable interactive navigation (static output)
illustrate render my-diagram --file diagram.illustrate --no-interactive

# Force streaming mode for very large diagrams
illustrate render my-diagram --file diagram.illustrate --stream
```

**Options:**
- `-f, --file <path>` - Load from local .illustrate file
- `--no-color` - Disable ANSI color codes (monochrome output)
- `--no-border` - Disable border around diagram
- `--no-interactive` - Disable interactive navigation for large diagrams
- `--stream` - Use streaming rendering for very large diagrams

**Features:**
- **Auto-Detection**: Automatically detects terminal capabilities (color support, dimensions)
- **Color Levels**: Supports 16 colors, 256 colors, and truecolor (24-bit) with fallbacks
- **Interactive Mode**: For diagrams larger than the terminal, provides keyboard navigation:
  - Arrow Keys / WASD - Pan view
  - Page Up/Down - Scroll by page
  - Home - Go to top-left
  - End - Go to bottom
  - H or ? - Show help
  - Q or Esc or Ctrl+C - Quit
- **Box Drawing**: Uses Unicode box-drawing characters when supported, falls back to ASCII
- **Status Display**: Shows viewport position and remaining content for large diagrams

**Examples:**

```bash
# Render a small diagram with colors and border
illustrate render flowchart --file flowchart.illustrate

# Render a large diagram with interactive navigation
illustrate render architecture --file architecture.illustrate
# (Use arrow keys to navigate, Q to quit)

# Pipe to less for scrolling
illustrate render docs --file docs.illustrate --no-interactive | less -R

# Save colored output to file
illustrate render diagram --file diagram.illustrate > output.ansi

# Screenshot-friendly output (no colors, no border)
illustrate render diagram --file diagram.illustrate --no-color --no-border
```

**Terminal Compatibility:**
- ✅ macOS Terminal.app, iTerm2
- ✅ Linux xterm, gnome-terminal, konsole
- ✅ Windows Terminal
- ✅ VSCode integrated terminal
- ✅ Traditional terminals (with feature detection)

---

## File Format

Diagrams are stored as `.illustrate` files containing JSON with:
- Document metadata (id, title, dimensions)
- Layers with buffers (chars, colors, flags)
- Design system reference (optional)
- Tags and timestamps

See the core package documentation for details.

## Environment Variables

- `NO_COLOR` - Disable color output (respected by render and copy commands)
- `COLORTERM=truecolor` - Enable 24-bit color support
- `TERM` - Terminal type detection (e.g., `xterm-256color`)

## Cloud Integration (Future)

Currently, commands require `--file` to load from local files. Future versions will support:
- Cloud diagram loading by ID
- User authentication
- Diagram synchronization

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Development mode
pnpm dev
```

## Related Packages

- `@illustrate.md/core` - Core buffer model and rendering logic
- `web` - Web application for visual editing

## License

MIT

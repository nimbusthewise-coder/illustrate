# illustrate.md — Product Requirements Document

> *"An illustrate.md is worth 1000 tokens."*

---

**Document History**

| Version | Date | Changes |
|---|---|---|
| 0.1 | 2026-02-21 | Initial draft |
| 0.2 | 2026-02-21 | TUI repositioned as CLI companion; web app is the sole creation tool |
| 0.3 | 2026-02-21 | Vision statement corrected; "built with AI, for AI" narrative added; embed URL structure formalised; CanvasDocument tags field added; `.illustrate` file format defined; column guide pain point elevated; Phase 5 npm contradiction resolved |

---

## 1. Overview

### 1.1 Product Summary

**illustrate.md** is an ASCII wireframing and diagramming tool designed to bridge the communication gap between human design intent and AI language models. It provides a drawing-app experience on a character grid canvas, producing structured ASCII output that is both human-readable and optimally parseable by LLMs.

Where natural language is ambiguous about spatial relationships, layout, and visual hierarchy, illustrate.md provides clarity through structured ASCII diagrams — communicating design intent with precision and without token overhead.

illustrate.md is itself built in collaboration with AI — a tool designed to improve human-to-AI communication, developed through the same human-AI workflow it enables. This is not incidental; it is the product's founding story and shapes its design philosophy at every level.

### 1.2 Problem Statement

When working with LLMs on UI design, layout, or screen flows, natural language description is lossy. Describing a layout in words requires many tokens, invites misinterpretation, and often requires iterative re-prompting to correct spatial misunderstandings. Developers and designers already reach for ASCII diagrams instinctively in GitHub issues, Slack messages, and READMEs — but the tooling to create them is either absent or frustrating (manual space-counting, alignment anxiety, no reusable components).

### 1.3 Vision

A professional-grade, WYSIWYG ASCII canvas editor that makes creating, sharing, and embedding structured diagrams as frictionless as writing markdown — with a web app as the primary creation tool, a CLI companion for terminal workflows, and a portable embed standard that works anywhere markdown renders.

---

## 2. Target Audience

| Audience | Use Case |
|---|---|
| Developers | Wireframing UI intent for AI-assisted development |
| Designers | Communicating layout structure in low-fidelity |
| Technical writers | Embedding living diagrams in documentation |
| AI power users | Reducing token overhead when describing visual layouts |
| TUI / terminal enthusiasts | Pixel art, logos, avatars for terminal applications |

---

## 3. Core Principles

- **Grid-first.** Everything lives on a character grid. Alignment is guaranteed by the medium, not by the user.
- **AI-optimised output.** The ASCII format is the product — clean, structured, unambiguous.
- **Portable by default.** Diagrams are embeddable anywhere markdown renders.
- **Web-first creation.** The web app is the primary creation tool. The TUI is a companion, not a replacement.
- **Open source.** Built with the developer community, for the developer community.

---

## 4. Platform Architecture

### 4.1 Monorepo Structure

```
illustrate.md/
  packages/
    core/          @illustrate.md/core
  apps/
    web/           Next.js web application
    tui/           Ink (React) terminal application
  turbo.json
  package.json
```

**Tooling:** Turborepo + pnpm workspaces

### 4.2 Package Responsibilities

**`@illustrate.md/core`**
The renderer-agnostic logic layer. Zero UI dependencies.
- Grid buffer model and state management
- Shape primitives and drawing operations
- Design system definitions and component model
- Serialisation / deserialisation
- Undo/redo delta system
- Embed URL generation and resolution

**`@illustrate.md/web`** (Next.js)
The primary creation tool. Mouse-driven with full keyboard support. This is where all diagram authoring happens.

**`@illustrate.md/tui`** (Ink)
A CLI companion tool for terminal-based workflows. Not a creation tool — focused on viewing, querying, and integrating diagrams into developer workflows. See section 7.2 for full scope.

---

## 5. Core Data Model

### 5.1 Buffer Structure

The canvas is represented as a set of parallel flat typed arrays with associated metadata. This provides O(1) cell read/write, cache-friendly iteration, and trivial serialisation.

```ts
interface Buffer {
  width:  number
  height: number
  chars:  Uint16Array   // Unicode character codes
  fg:     Uint32Array   // Foreground colour (RGBA)
  bg:     Uint32Array   // Background colour (RGBA)
  flags:  Uint8Array    // Bold, italic, underline, etc.
}
```

Cell index: `row * width + col`

### 5.2 Layer Model

Layers are named, ordered buffer instances with positional offsets. They form the scene graph.

```ts
interface Layer {
  id:       string
  name:     string
  parentId: string | null
  visible:  boolean
  locked:   boolean
  x:        number       // Offset within root canvas
  y:        number
  buffer:   Buffer
}
```

Compositing iterates layers in order; transparent/empty cells fall through to the layer below.

### 5.3 Canvas Document

```ts
interface CanvasDocument {
  id:           string
  title:        string
  width:        number
  height:       number
  layers:       Layer[]
  designSystem: DesignSystem | null
  tags:         string[]
  createdAt:    number
  updatedAt:    number
}
```

### 5.4 File Format

Documents are serialised to `.illustrate` files — versioned JSON containing the full `CanvasDocument` structure. The format is versioned from day one to allow future migration without breaking existing files.

```json
{
  "version": "1",
  "document": { ... }
}
```

### 5.5 Undo / Redo

Delta-based undo/redo. Only affected cells are recorded per operation, keeping memory overhead minimal at typical canvas sizes.

```ts
interface Delta {
  index:  number
  before: [charCode: number, fg: number, bg: number, flags: number]
  after:  [charCode: number, fg: number, bg: number, flags: number]
}

interface UndoEntry {
  timestamp: number
  label:     string
  deltas:    Delta[]
}
```

- `undoStack` and `redoStack` are capped at 100 entries each
- Operations are batched via `beginBatch()` / `endBatch()` so multi-cell operations (draw box, fill, paste) appear as a single undo step
- Committing a new operation clears the `redoStack`

---

## 6. Feature Requirements

### 6.1 Canvas & Grid

| Feature | Priority |
|---|---|
| Configurable grid dimensions | P0 |
| Character grid rendering with guaranteed alignment | P0 |
| Zoom in / out (web) | P1 |
| Grid size presets (80×24, 120×40, custom) | P1 |
| Rulers and guides | P2 |

### 6.2 Drawing Tools

| Tool | Description | Priority |
|---|---|---|
| Box tool | Drag to draw bordered rectangle with box-drawing characters | P0 |
| Line tool | Horizontal, vertical, diagonal lines | P0 |
| Text tool | Place and edit text within grid cells | P0 |
| Fill tool | Flood fill a region with a character or style | P1 |
| Select tool | Select, move, copy, paste regions | P1 |
| Eraser | Clear cells to empty | P0 |
| Column / row guides | Define fixed-width column structures that maintain alignment without manual space counting — solving the "is that 7 or 8 spaces?" problem | P1 |
| Arrow / connector tool | Connect boxes with directional lines | P1 |

### 6.3 Layers

| Feature | Priority |
|---|---|
| Create, rename, delete layers | P0 |
| Show / hide layers | P0 |
| Lock layers | P1 |
| Reorder layers | P0 |
| Layer opacity / compositing modes | P2 |
| Parent / child layer relationships | P1 |

### 6.4 Design System

A design system is a named collection of reusable components — predefined ASCII patterns (chat bubble, button, modal, nav bar, etc.) that can be placed and resized on the canvas.

| Feature | Priority |
|---|---|
| Define reusable named components | P0 |
| Place components on canvas | P0 |
| Components flex to fit their content | P1 |
| Share design systems across documents | P1 |
| Community design system library | P2 |

### 6.5 AI-Assisted Flow Generation

With a design system defined, users can prompt to generate multi-screen flows that compose design system components intelligently.

| Feature | Priority |
|---|---|
| Prompt-to-flow generation using active design system | P1 |
| Iterative refinement via follow-up prompts | P1 |
| LLM-readable export format with semantic annotations | P1 |

### 6.6 Embed System

Each saved diagram is assigned a unique, persistent URL following the structure:

```
illustrate.md/{username}/{diagram-id}
```

This URL can be embedded in any markdown document using native image syntax, requiring zero plugins or extensions:

```markdown
![Dashboard wireframe](illustrate.md/jp/sm30vjsv)
```

This maps directly to the standard markdown image format `![alt](src)`, meaning it renders natively in GitHub, Notion, Linear, and any other markdown renderer that fetches remote images. The endpoint returns an SVG representation of the diagram. When the source diagram is updated, embeds reflect the change — living diagrams.

| Feature | Priority |
|---|---|
| Unique persistent embed URL per diagram (`/{username}/{id}`) | P0 |
| SVG render endpoint for embed URLs | P0 |
| PNG render endpoint | P1 |
| Plain ASCII text render endpoint | P0 |
| Living diagram updates on source change | P1 |
| Versioned / pinned embed URLs (`/{username}/{id}@v2`) | P2 |
| Works natively in GitHub, Notion, Linear, READMEs | P0 |

### 6.7 Pixel Art Mode

An alternate canvas mode that ignores character data and drives purely from colour values, mapping brightness to block characters from a configurable lookup table.

| Feature | Priority |
|---|---|
| Colour-only canvas mode | P1 |
| Brightness-to-character mapping (` ░▒▓█` etc.) | P1 |
| Style presets: monochrome, greyscale, 4-colour, full | P1 |
| Import low-res image and convert to pixel art | P2 |
| Export as character art for TUI apps | P1 |

### 6.8 Export

| Format | Priority |
|---|---|
| Plain ASCII text | P0 |
| Markdown code block | P0 |
| SVG | P1 |
| PNG | P1 |
| Copy to clipboard | P0 |

---

## 7. Platform-Specific Requirements

### 7.1 Web (Next.js)

- Mouse-driven drawing interactions (drag, click, hover)
- Keyboard shortcuts for all tools
- Colour picker for fg/bg
- Layer panel UI
- Design system editor
- Document persistence (cloud-backed)
- User accounts and diagram library
- Public / private diagram visibility

### 7.2 TUI (Ink) — CLI Companion

The TUI is not a creation tool. It is a terminal-native companion for developers who want to integrate illustrate.md into their existing workflows without leaving the terminal.

**Viewing**
- Render any diagram by ID or embed URL directly in the terminal
- 256-colour and true-colour terminal support
- Watch mode — monitor a diagram for changes and re-render on update, useful in a split pane alongside an editor

**Embed Management**
- List all diagrams in a user's library
- Search diagrams by name or tag
- Copy embed URL or ASCII output to clipboard
- Display embed snippet ready to paste into a markdown document

**AI Generation**
- Prompt a flow from the command line using the active design system
- Pipe ASCII output to stdout for use in scripts or editors
- Example: `illustrate generate "3-screen onboarding flow" --design-system my-app`

**Local File Operations**
- Save diagram ASCII output to a local file
- Open a local `.illustrate` file and render it in the terminal

---

## 8. Technical Considerations

### 8.1 Rendering

- Web canvas rendering via HTML Canvas API or a character-grid React component
- TUI rendering via Ink's React-based terminal renderer
- Both renderers consume the same `@illustrate.md/core` buffer state

### 8.2 Serialisation

- Primary format: `.illustrate` — versioned JSON as defined in section 5.4
- Canvas sizes are intentionally small; uncompressed serialisation is acceptable initially
- RLE compression is a candidate future optimisation for larger canvases

### 8.3 Embed Endpoint

- Hosted on illustrate.md with CDN caching
- SVG generation server-side from buffer state
- Cache invalidation on diagram update for living diagrams
- Rate limiting on unauthenticated embed renders

### 8.4 Open Source

- MIT licensed
- Monorepo published to GitHub
- `@illustrate.md/core` published to npm for third-party integrations
- Contribution guidelines and issue templates from launch

---

## 9. Out of Scope (v1)

- Real-time multiplayer / collaborative editing
- Vector drawing (bezier curves, freeform paths)
- Animation or transitions
- Mobile native apps
- Plugin system

---

## 10. Success Metrics

| Metric | Target |
|---|---|
| Embed URLs referenced in public GitHub READMEs | Growth indicator |
| Core npm package downloads | Adoption indicator |
| TUI companion covers all P0/P1 companion features | Completeness check |
| Round-trip: ASCII export parseable by Claude without clarification | Qualitative benchmark |

---

## 11. Phased Roadmap

### Phase 1 — Foundation
Core buffer model, basic drawing tools (box, line, text, eraser), plain ASCII export, undo/redo, web canvas MVP.

### Phase 2 — Platform
Layer system, design system definition and placement, cloud persistence, user accounts. TUI CLI companion for viewing, embed management, and AI generation from the terminal.

### Phase 3 — Embed & Share
Embed URL system, SVG render endpoint, living diagrams, GitHub rendering validation.

### Phase 4 — AI Integration
Prompt-to-flow generation, LLM-optimised export format, AI-assisted component suggestion.

### Phase 5 — Ecosystem
Pixel art mode, community design system library, RLE optimisation. `@illustrate.md/core` is available on npm from Phase 1; this phase focuses on third-party integration documentation, examples, and community tooling built on top of it.

---

*PRD version 0.3 — illustrate.md*

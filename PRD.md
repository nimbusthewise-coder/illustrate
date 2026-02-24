# illustrate.md — Product Requirements Document

> *"An illustrate.md is worth 1000 tokens."*

**Created:** 2026-02-21
**Updated:** 2026-02-24
**Version:** 1.5

---

**Document History**

| Version | Date | Changes |
|---|---|---|
| 0.1 | 2026-02-21 | Initial draft |
| 0.2 | 2026-02-21 | TUI repositioned as CLI companion; web app is the sole creation tool |
| 0.3 | 2026-02-21 | Vision statement corrected; "built with AI, for AI" narrative added; embed URL structure formalised; CanvasDocument tags field added; `.illustrate` file format defined; column guide pain point elevated; Phase 5 npm contradiction resolved |
| 0.4 | 2026-02-21 | Feature IDs (F001–F042) added; draft acceptance criteria for all features; dependency map (§12); DesignSystem data model (§5.6); Auth & Accounts feature section (§6.9); Decision log (§13) |
| 0.5 | 2026-02-21 | Phase 2 decomposed into 2a/2b/2c; F005 promoted P2→P1; F028 moved to Phase 2b; parallel track guidance added; Decision D006 |
| 0.6 | 2026-02-21 | AC refinements (F013, F022, F033); F052 Keyboard Shortcuts + F053 Local/Offline added; TUI features assigned IDs (F054–F063); Success Metrics v1 targets; Decisions D007–D009 |
| 0.7 | 2026-02-21 | Future Developments section (§14); Phase 6 Monetisation roadmap; Pricing tiers (Free/Pro/Team); Features F060–F068 |
| 1.3 | 2026-02-24 | D021 DOM character grid; D022 open source strategy; §17.3 open source setup guide; §8.4 expanded; all Phase 0 tech decisions resolved |
| 1.2 | 2026-02-24 | Setup guides: OAuth registration (§17.1), Stripe account (§17.2); 20 of 22 decisions resolved or guided |

| 0.9 | 2026-02-24 | PRD template alignment: header metadata, glossary (§3.5), architecture additions (repo path, file conventions, testing strategy in §4), feature status fields, acceptance criteria converted to checkboxes, inline dependencies added |
| 1.5 | 2026-02-24 | **REBUILD PREP**: All features reset to draft (building from scratch via tinker rebuild); phases decomposed into smaller batches (11 micro-phases); T-shirt size estimates added; §21 Rebuild Guide added; §15 Retrospective preserved as lessons learned; D023 rebuild decision |

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

### 3.5 Glossary

| Term | Definition |
|------|------------|
| **Buffer** | A flat typed-array representation of a canvas region — stores character codes, foreground/background colours, and style flags per cell. The fundamental data structure. |
| **Layer** | A named, positioned Buffer instance within a document. Layers stack; transparent cells fall through to layers below. |
| **Compositing** | The process of merging all visible layers into a single output buffer for rendering or export. |
| **Delta** | A record of cell-level changes (before/after) used by the undo/redo system. Only changed cells are stored. |
| **CanvasDocument** | The top-level document model containing layers, dimensions, metadata, and an optional design system. Serialised to `.illustrate` files. |
| **Design System** | A named, portable collection of reusable ASCII components with a consistent character set. Analogous to a CSS framework theme. |
| **Component** | A reusable ASCII pattern (e.g. Button, Modal, NavBar) with a semantic role, defined dimensions, and editable slots. |
| **Slot** | A named, editable region within a component (e.g. "title", "body"). Slots allow component content to change without breaking structure. |
| **CharacterSet** | The set of box-drawing, connector, arrow, and fill characters used by a design system. Ensures visual consistency. |
| **ComponentRole** | A semantic category for components: `container`, `navigation`, `input`, `display`, `layout`, or `feedback`. |
| **Embed URL** | A persistent URL (`/{username}/{id}`) that resolves to a diagram's SVG, PNG, or ASCII representation. |
| **Living Diagram** | An embedded diagram that auto-updates when the source document is saved. |
| **.illustrate** | The file format for illustrate.md documents — versioned JSON wrapping a `CanvasDocument`. |
| **Manhattan Routing** | A pathfinding algorithm that connects two points using only horizontal and vertical line segments (no diagonals). Used by the arrow/connector tool. |
| **Modal Input** | A UI state where keyboard shortcuts are suppressed (e.g. while the text tool is active). ESCAPE exits modal input. |

Agents MUST use these terms consistently.

---

## 4. Platform Architecture

**Stack:** TypeScript, Next.js, Ink (React), Turborepo, pnpm
**Repo:** `illustrate.md/` (monorepo — see structure below)

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

### 4.3 File Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Package source | `packages/{name}/src/` | `packages/core/src/buffer.ts` |
| App source | `apps/{name}/src/` or `apps/{name}/app/` (Next.js App Router) | `apps/web/app/editor/page.tsx` |
| Tests | Co-located `*.test.ts` or `__tests__/` directory | `packages/core/src/buffer.test.ts` |
| Types | Exported from package index, defined in `types.ts` | `packages/core/src/types.ts` |
| Components | PascalCase `.tsx` files | `apps/web/src/components/Canvas.tsx` |
| Utilities | camelCase `.ts` files | `packages/core/src/utils/grid.ts` |
| Config files | Root-level for monorepo, package-level for overrides | `turbo.json`, `apps/web/next.config.js` |
| Design systems | `.illustrate-system` JSON files | `systems/mobile-app.illustrate-system` |

### 4.4 Testing Strategy

**Test Framework:** Vitest
**Test Commands:**
- One-shot execution: `pnpm run test:run` or `npx vitest run`
- Watch mode (development only): `pnpm test` or `vitest`
- Coverage: `pnpm run test:coverage`

**⚠️ Important:** Agents and CI must always use one-shot execution (`vitest run`, `test:run`) to avoid hanging in watch mode during automated execution. See §15.4 Lesson #4.

**Test organisation:**
- Unit tests for `@illustrate.md/core` — buffer operations, drawing primitives, serialisation, undo/redo
- Component tests for web UI — React Testing Library for canvas interactions, tool behaviour
- Integration tests for TUI — CLI command output verification
- Export round-trip tests — ASCII export → re-parse → compare structure

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

### 5.6 Design System

A design system is a named, portable collection of reusable ASCII components. Inspired by the automodern design system's pattern of named semantic tokens and switchable contexts, the illustrate.md design system provides named components with semantic roles that can be shared across documents and swapped between projects.

```ts
interface DesignSystem {
  id:          string
  name:        string           // e.g. "mobile-app", "dashboard", "cli-ui"
  description: string
  version:     string           // semver for shared systems
  charset:     CharacterSet     // which box-drawing chars, connectors, fills to use
  components:  Component[]
  createdAt:   number
  updatedAt:   number
}

interface CharacterSet {
  boxLight:    BoxChars         // ┌ ─ ┐ │ └ ┘
  boxHeavy:    BoxChars         // ┏ ━ ┓ ┃ ┗ ┛
  boxDouble:   BoxChars         // ╔ ═ ╗ ║ ╚ ╝
  boxRound:    BoxChars         // ╭ ─ ╮ │ ╰ ╯
  connectors:  ConnectorChars   // ├ ┤ ┬ ┴ ┼ etc.
  arrows:      ArrowChars       // ← → ↑ ↓ ◀ ▶ ▲ ▼
  fills:       string[]         // [' ', '░', '▒', '▓', '█']
}

interface BoxChars {
  tl: string   // top-left
  tr: string   // top-right
  bl: string   // bottom-left
  br: string   // bottom-right
  h:  string   // horizontal
  v:  string   // vertical
}

interface Component {
  id:          string
  name:        string           // e.g. "Button", "Modal", "NavBar", "ChatBubble"
  description: string
  role:        ComponentRole    // semantic category
  minWidth:    number
  minHeight:   number
  resizable:   boolean
  template:    Buffer           // the ASCII pattern at default size
  slots:       Slot[]           // named editable regions within the component
  tags:        string[]
}

type ComponentRole =
  | 'container'    // modals, cards, panels
  | 'navigation'   // nav bars, tabs, breadcrumbs
  | 'input'        // buttons, text fields, dropdowns
  | 'display'      // labels, badges, status indicators
  | 'layout'       // dividers, spacers, grids
  | 'feedback'     // alerts, toasts, progress bars

interface Slot {
  name:   string    // e.g. "title", "body", "icon"
  x:      number
  y:      number
  width:  number
  height: number
  default: string   // placeholder text
}
```

**Design philosophy:** A `DesignSystem` is to illustrate.md what a theme is to a CSS framework — it provides the vocabulary of parts so you can compose screens without reinventing every element. The `CharacterSet` ensures visual consistency across components (all boxes use the same corner style, all arrows match). The `Slot` system enables components to be resizable while maintaining structural integrity.

---

## 6. Feature Requirements

### 6.1 Canvas & Grid

#### [F001] Configurable Grid Dimensions
**Status:** draft · **Priority:** P0 · **Depends:** —
- [ ] User can set width/height in characters
- [ ] Canvas renders at specified dimensions
- [ ] Minimum 1×1, maximum 256×256

#### [F002] Character Grid Rendering with Guaranteed Alignment
**Status:** draft · **Priority:** P0 · **Depends:** —
- [ ] All characters align to grid; no sub-character positioning
- [ ] Monospace font enforced
- [ ] Consistent across browsers

#### [F003] Zoom In / Out (Web)
**Status:** draft · **Priority:** P1 · **Depends:** F001, F002
- [ ] Zoom levels 50%–400% in discrete steps
- [ ] Keyboard shortcut (Cmd/Ctrl +/-)
- [ ] Zoom indicator visible
- [ ] Grid alignment preserved at all zoom levels

#### [F004] Grid Size Presets
**Status:** draft · **Priority:** P1 · **Depends:** F001
- [ ] At least 3 presets available (80×24, 120×40, custom)
- [ ] Custom input accepts width×height
- [ ] Preset selection on new document and via resize

#### [F005] Rulers and Guides
**Status:** draft · **Priority:** P1 · **Depends:** F001
- [ ] Row/column numbers displayed on edges
- [ ] Snap-to-guide for drawing tools
- [ ] Guides togglable
**Note:** Promoted from P2 — required by F012 Column Guides

### 6.2 Drawing Tools

#### [F006] Box Tool
**Status:** draft · **Priority:** P0 · **Depends:** F001, F002
Drag to draw bordered rectangle with box-drawing characters.
- [ ] Click-drag creates rectangle
- [ ] Uses active charset box chars
- [ ] Minimum 2×2
- [ ] Undo-able as single operation

#### [F007] Line Tool
**Status:** draft · **Priority:** P0 · **Depends:** F001, F002
Horizontal, vertical, diagonal lines.
- [ ] Click-drag draws line
- [ ] Snaps to H/V/45° angles
- [ ] Uses appropriate line chars (─ │ ╲ ╱)
- [ ] Intersection characters auto-resolve

#### [F008] Text Tool
**Status:** draft · **Priority:** P0 · **Depends:** F001
Place and edit text within grid cells.
- [ ] Click to place cursor; type to insert characters
- [ ] Arrow keys navigate; supports multi-line text
- [ ] Text wraps within bounds if constrained
- [ ] **Text input is modal** — all tool shortcuts suppressed while typing
- [ ] ESCAPE exits text input mode and returns to normal tool switching
**Technical Notes:** See BUG-001 — modal suppression was missing at Phase 1 ship. AC updated to make it explicit.

#### [F009] Fill Tool
**Status:** draft · **Priority:** P1 · **Depends:** F001, F002
Flood fill a region with a character or style.
- [ ] Click fills contiguous same-character region
- [ ] Respects boundaries
- [ ] Character and style configurable
- [ ] Undo-able

#### [F010] Select Tool
**Status:** draft · **Priority:** P1 · **Depends:** F001, F014
Select, move, copy, paste regions.
- [ ] Click-drag to select rectangle with **live selection preview during drag** (marching ants or highlight)
- [ ] Move selection with arrow keys or drag
- [ ] Cmd/Ctrl+C/V for copy/paste; paste creates floating selection
- [ ] Selected region supports delete (backspace/delete clears to empty)
**Technical Notes:** See BUG-004 — selection preview was missing at Phase 1 ship.

#### [F011] Eraser
**Status:** draft · **Priority:** P0 · **Depends:** F001
Clear cells to empty.
- [ ] Click or drag to clear cells (null character, transparent bg)
- [ ] Configurable eraser size (1×1, 3×3)

#### [F012] Column / Row Guides
**Status:** draft · **Priority:** P1 · **Depends:** F001, F005
Define fixed-width column structures.
- [ ] User defines column widths (e.g. 20-40-20)
- [ ] Visual guides render on canvas
- [ ] Drawing tools snap to column boundaries
- [ ] Guides don't appear in export

#### [F013] Arrow / Connector Tool
**Status:** draft · **Priority:** P1 · **Depends:** F006, F007
Connect boxes with directional lines.
- [ ] Click source → click target
- [ ] Manhattan routing (horizontal/vertical segments only)
- [ ] Routing algorithm capped at 100 iterations; toast on failure: `Route failed. Re-run? [(y)es] / [(n)o]`
- [ ] Routing is deterministic (same input → same route) to prevent jitter
- [ ] Arrowhead at terminus
- [ ] Re-routes when connected elements move

### 6.3 Layers

#### [F014] Create, Rename, Delete Layers
**Status:** draft · **Priority:** P0 · **Depends:** —
- [ ] New layer button
- [ ] Double-click to rename
- [ ] Delete with confirmation
- [ ] At least one layer must exist

#### [F015] Show / Hide Layers
**Status:** draft · **Priority:** P0 · **Depends:** F014
- [ ] Eye icon toggle per layer
- [ ] Hidden layers excluded from compositing and export
- [ ] Visual indicator for hidden state

#### [F016] Lock Layers
**Status:** draft · **Priority:** P1 · **Depends:** F014
- [ ] Lock icon toggle
- [ ] Locked layers reject drawing operations
- [ ] Visual indicator
- [ ] Selection tool skips locked layer content

#### [F017] Reorder Layers
**Status:** draft · **Priority:** P0 · **Depends:** F014
- [ ] Drag-and-drop reorder in layer panel
- [ ] Compositing order updates immediately
- [ ] Keyboard shortcuts for move up/down

#### [F018] Layer Opacity / Compositing Modes
**Status:** draft · **Priority:** P2 · **Depends:** F014, F015
- [ ] Opacity slider 0–100%
- [ ] At minimum: normal, multiply compositing
- [ ] Affects final render and export

#### [F019] Parent / Child Layer Relationships
**Status:** draft · **Priority:** P1 · **Depends:** F014, F017
- [ ] Drag layer onto another to nest
- [ ] Child layers move with parent
- [ ] Collapse/expand groups in panel
- [ ] Visibility/lock cascades to children

### 6.4 Design System

#### [F020] Define Reusable Named Components
**Status:** draft · **Priority:** P0 · **Depends:** F001, F006, F008
- [ ] Create component from selection
- [ ] Name, description, role assignment
- [ ] Template buffer captured
- [ ] Slots definable
- [ ] Component appears in library panel

#### [F021] Place Components on Canvas
**Status:** draft · **Priority:** P0 · **Depends:** F020, F014
- [ ] Drag from library to canvas
- [ ] Places on active layer
- [ ] Maintains template structure
- [ ] Slots are editable after placement

#### [F022] Components Flex to Fit Content
**Status:** draft · **Priority:** P1 · **Depends:** F020, F021
- [ ] Slot text overflow triggers component resize
- [ ] Min/max size constraints defined by component author at creation time
- [ ] Border characters re-render on resize
- [ ] Constraints editable after creation via component properties

#### [F023] Share Design Systems Across Documents
**Status:** draft · **Priority:** P1 · **Depends:** F020, F046
- [ ] Export design system as standalone JSON
- [ ] Import into another document
- [ ] Version tracking
- [ ] Linked vs. embedded modes

#### [F024] Community Design System Library
**Status:** draft · **Priority:** P2 · **Depends:** F023, F047
- [ ] Browse public design systems
- [ ] One-click import
- [ ] Rating/popularity sorting
- [ ] Submission flow for contributors

#### [F025] Character Set Switching
**Status:** draft · **Priority:** P1 · **Depends:** F020
- [ ] Switch active charset (light/heavy/double/round)
- [ ] All components re-render with new charset
- [ ] Preview before applying

### 6.5 AI-Assisted Flow Generation

#### [F026] Prompt-to-Flow Generation
**Status:** draft · **Priority:** P1 · **Depends:** F020, F021, F028
Uses active design system to generate layouts from text prompts.
- [ ] Text prompt input
- [ ] Generates multi-screen layout using current design system components
- [ ] Output placed on new layer(s)
- [ ] Respects canvas dimensions

#### [F027] Iterative Refinement via Follow-up Prompts
**Status:** draft · **Priority:** P1 · **Depends:** F026
- [ ] Follow-up prompts modify existing generated content
- [ ] Change history preserved
- [ ] User can accept/reject individual changes

#### [F028] LLM-Readable Export Format with Semantic Annotations
**Status:** draft · **Priority:** P1 · **Depends:** F041, F020
- [ ] Export includes component names, roles, slot contents, spatial relationships as structured metadata alongside ASCII
- [ ] Round-trip parseable by Claude
**Technical Notes:** Moved from Phase 4 to Phase 2b — dependencies (F041 + F020) are met by then. Shipping semantic export alongside the design system makes the AI story testable early.

### 6.6 Embed System

#### [F029] Unique Persistent Embed URL per Diagram
**Status:** draft · **Priority:** P0 · **Depends:** F046, F047, F050
- [ ] Every saved diagram gets `/{username}/{id}` URL
- [ ] URL is stable across edits
- [ ] URL resolves to diagram content

#### [F030] SVG Render Endpoint
**Status:** draft · **Priority:** P0 · **Depends:** F029
- [ ] `GET /{username}/{id}` returns SVG
- [ ] Monospace font rendering; colours preserved
- [ ] Content-Type: image/svg+xml

#### [F031] PNG Render Endpoint
**Status:** draft · **Priority:** P1 · **Depends:** F030
- [ ] `GET /{username}/{id}.png` returns PNG
- [ ] Configurable resolution
- [ ] Transparent background option

#### [F032] Plain ASCII Text Render Endpoint
**Status:** draft · **Priority:** P0 · **Depends:** F029, F041
- [ ] `GET /{username}/{id}.txt` returns plain text
- [ ] No colour, no styling
- [ ] Clean ASCII for LLM consumption

#### [F033] Living Diagram Updates on Source Change
**Status:** draft · **Priority:** P1 · **Depends:** F029, F050
- [ ] Embed reflects latest saved version
- [ ] Best-effort CDN cache invalidation (typically within 60s, not a hard SLA)
- [ ] Stale content acceptable briefly during propagation

#### [F034] Versioned / Pinned Embed URLs
**Status:** draft · **Priority:** P2 · **Depends:** F029, F050
- [ ] `/{username}/{id}@v2` syntax
- [ ] Version auto-incremented on save
- [ ] Pinned URLs never change
- [ ] Version history browsable

#### [F035] Works Natively in GitHub, Notion, Linear, READMEs
**Status:** draft · **Priority:** P0 · **Depends:** F029, F030
- [ ] `![alt](url)` syntax renders diagram in all listed platforms
- [ ] Validated with real embeds in each platform

### 6.7 Pixel Art Mode

#### [F036] Colour-Only Canvas Mode
**Status:** draft · **Priority:** P1 · **Depends:** F001
- [ ] Toggle to pixel art mode
- [ ] Character data hidden; colour picker is primary tool
- [ ] Grid renders as coloured blocks

#### [F037] Brightness-to-Character Mapping
**Status:** draft · **Priority:** P1 · **Depends:** F036
- [ ] Configurable LUT (` ░▒▓█` default)
- [ ] Brightness calculated from colour
- [ ] ASCII export uses mapped characters

#### [F038] Style Presets
**Status:** draft · **Priority:** P1 · **Depends:** F036
- [ ] At least 4 presets: monochrome, greyscale, 4-colour, full
- [ ] One-click switching
- [ ] Custom palette support

#### [F039] Import Low-Res Image and Convert to Pixel Art
**Status:** draft · **Priority:** P2 · **Depends:** F036, F037
- [ ] Upload PNG/JPG
- [ ] Auto-resize to canvas dimensions
- [ ] Colour quantisation to active palette
- [ ] Manual adjustment after import

#### [F040] Export as Character Art for TUI Apps
**Status:** draft · **Priority:** P1 · **Depends:** F036, F037
- [ ] Export with ANSI colour codes
- [ ] Preview in terminal-style viewer
- [ ] Copy to clipboard with escape sequences

### 6.8 Export

#### [F041] Plain ASCII Text Export
**Status:** draft · **Priority:** P0 · **Depends:** F001, F014
- [ ] All visible layers composited
- [ ] Trailing whitespace trimmed
- [ ] Output matches canvas exactly
- [ ] Newline-delimited rows

#### [F042] Markdown Code Block Export
**Status:** draft · **Priority:** P0 · **Depends:** F041
- [ ] Wrapped in triple backticks
- [ ] Language hint optional (e.g. ```ascii)
- [ ] Copy-ready for pasting into .md files

#### [F043] SVG Export
**Status:** draft · **Priority:** P1 · **Depends:** F001, F002
- [ ] Vector output
- [ ] Monospace font embedded or referenced
- [ ] Colours preserved
- [ ] Scalable without pixelation

#### [F044] PNG Export
**Status:** draft · **Priority:** P1 · **Depends:** F043
- [ ] Raster output
- [ ] Configurable DPI (72, 144, 288)
- [ ] Transparent background option
- [ ] Anti-aliased text

#### [F045] Copy to Clipboard
**Status:** draft · **Priority:** P0 · **Depends:** F041
- [ ] One-click copy
- [ ] Plain text format by default
- [ ] Option for rich format (with colours) where supported

### 6.9 Authentication & Accounts

User accounts are the foundation for cloud persistence, embed URLs, and sharing. Without auth, the product is a local-only drawing tool.

#### [F046] User Registration and Login
**Status:** draft · **Priority:** P0 · **Depends:** —
- [ ] Email + password auth
- [ ] OAuth (GitHub, Google) as primary flow
- [ ] Email verification
- [ ] Session management

#### [F047] User Profile and Username
**Status:** draft · **Priority:** P0 · **Depends:** F046
- [ ] Unique username (used in embed URLs)
- [ ] Display name
- [ ] Avatar optional
- [ ] Username immutable after initial set (or changeable with redirect)

#### [F048] Diagram Library
**Status:** draft · **Priority:** P0 · **Depends:** F046, F050
- [ ] List all user's diagrams
- [ ] Sort by date, name
- [ ] Search by title and tags
- [ ] Grid and list view

#### [F049] Public / Private Diagram Visibility
**Status:** draft · **Priority:** P1 · **Depends:** F046, F048
- [ ] Default private
- [ ] Toggle to public
- [ ] Public diagrams accessible via embed URL without auth
- [ ] Private diagrams require auth

#### [F050] Cloud Persistence
**Status:** draft · **Priority:** P0 · **Depends:** F046
- [ ] Auto-save on edit
- [ ] Manual save trigger
- [ ] Conflict resolution (last-write-wins initially)
- [ ] Offline indicator

#### [F051] API Keys for Programmatic Access
**Status:** draft · **Priority:** P2 · **Depends:** F046
- [ ] Generate API keys in settings
- [ ] Scoped permissions (read/write)
- [ ] Rate limited
- [ ] Key rotation

### 6.10 Web Application Features

#### [F052] Keyboard Shortcuts System
**Status:** draft · **Priority:** P0 · **Depends:** F001
- [ ] Adobe Photoshop shortcut conventions as defaults (V=move, M=marquee, B=brush, E=eraser, T=text, U=shape, Z=zoom)
- [ ] All tools accessible via keyboard
- [ ] Shortcut hints shown in tooltips
- [ ] Customisable keybindings in settings
- [ ] Conflicts detected and flagged
- [ ] **Modal input suppression**: tool-switching shortcuts suppressed during active input mode; ESCAPE exits
**Technical Notes:** See BUG-001 — modal suppression was incomplete at Phase 1 ship. Partially shipped; customisation deferred.

#### [F053] Local / Offline Mode
**Status:** draft · **Priority:** P1 · **Depends:** F050
- [ ] Documents auto-save to browser localStorage/IndexedDB when cloud is unreachable
- [ ] Sync to server when connection restored
- [ ] Offline indicator in UI
- [ ] Conflict resolution on reconnect (last-write-wins with notification)
- [ ] ASCII-rendered 404 error page when navigating to missing diagrams 😎

#### [F064] Colour Picker for fg/bg
**Status:** draft · **Priority:** P0 · **Depends:** F001
- [ ] Foreground and background colour selection
- [ ] Supports hex input, preset palette, and recently-used colours
- [ ] Active colours displayed in toolbar
- [ ] Keyboard shortcut to swap fg/bg (X)

---

## 7. Platform-Specific Requirements

### 7.1 Web (Next.js)

The web app is the primary creation tool. The following are platform-level implementation concerns — most map directly to tracked features:

- Mouse-driven drawing interactions (drag, click, hover) — *inherent to web platform*
- Keyboard shortcuts for all tools → **F052**
- Colour picker for fg/bg → **F064**
- Layer panel UI — *UI for F014–F019*
- Design system editor — *UI for F020–F025*
- Document persistence (cloud-backed) → **F050**
- User accounts and diagram library → **F046, F048**
- Public / private diagram visibility → **F049**

### 7.2 TUI (Ink) — CLI Companion

The TUI is not a creation tool. It is a terminal-native companion for developers who want to integrate illustrate.md into their existing workflows without leaving the terminal.

#### [F054] Render Diagram in Terminal
**Status:** draft · **Priority:** P0 · **Depends:** F041 · **Category:** Viewing
- [ ] `illustrate view {id}` or `illustrate view {username}/{id}` renders diagram with box-drawing chars and colour
- [ ] Graceful fallback for unsupported terminals

#### [F055] Terminal Colour Support
**Status:** draft · **Priority:** P1 · **Depends:** F054 · **Category:** Viewing
- [ ] Auto-detect 256-colour and truecolour capability
- [ ] Fallback to 16-colour/mono
- [ ] `--color` flag to override

#### [F056] Watch Mode
**Status:** draft · **Priority:** P1 · **Depends:** F054, F050 · **Category:** Viewing
- [ ] `illustrate watch {id}` monitors diagram for changes
- [ ] Re-renders on update
- [ ] Useful in split pane alongside editor
- [ ] Ctrl+C to exit

#### [F057] List Diagrams
**Status:** draft · **Priority:** P0 · **Depends:** F046, F048 · **Category:** Embed Mgmt
- [ ] `illustrate list` shows all user diagrams
- [ ] Columns: title, id, updated, public/private
- [ ] `--format json` for scripting

#### [F058] Search Diagrams
**Status:** draft · **Priority:** P1 · **Depends:** F057 · **Category:** Embed Mgmt
- [ ] `illustrate search {query}` filters by name and tags
- [ ] Supports `--tag` flag
- [ ] Results same format as list

#### [F059] Copy Embed URL / ASCII to Clipboard
**Status:** draft · **Priority:** P1 · **Depends:** F029, F054 · **Category:** Embed Mgmt
- [ ] `illustrate copy {id}` copies embed URL
- [ ] `illustrate copy {id} --ascii` copies ASCII text
- [ ] `--markdown` wraps in `![alt](url)`

#### [F060] Display Embed Snippet
**Status:** draft · **Priority:** P1 · **Depends:** F029 · **Category:** Embed Mgmt
- [ ] `illustrate embed {id}` prints ready-to-paste markdown embed snippet to stdout

#### [F061] CLI Prompt-to-Flow Generation
**Status:** draft · **Priority:** P1 · **Depends:** F026, F054 · **Category:** AI Gen
- [ ] `illustrate generate "{prompt}" --design-system {name}` generates flow using active design system
- [ ] Output to stdout or `--out {file}`

#### [F062] Pipe ASCII to Stdout
**Status:** draft · **Priority:** P0 · **Depends:** F041 · **Category:** Embed Mgmt
- [ ] `illustrate export {id}` pipes plain ASCII to stdout
- [ ] Composable with unix pipes (`illustrate export abc | pbcopy`)

#### [F063] Local .illustrate File Operations
**Status:** draft · **Priority:** P0 · **Depends:** F054 · **Category:** Local
- [ ] `illustrate open {file.illustrate}` renders local file in terminal
- [ ] `illustrate save {id} --out {file}` saves to local file

---

## 8. Technical Considerations

### 8.1 Rendering

- Web canvas rendering via **DOM-based character grid** — each cell is a `<span>` in a CSS Grid layout, rendered by React. See Decision D021.
- TUI rendering via Ink's React-based terminal renderer
- Both renderers consume the same `@illustrate.md/core` buffer state
- **Font stack:** `'SF Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace` — SF Mono is primary (Apple platforms); JetBrains Mono self-hosted as cross-platform fallback
- **UI framework:** Tailwind CSS + shadcn/ui (Radix) for application shell; Zustand for state management

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

- **License:** MIT — permissive, maximises adoption, standard for dev tools
- **Repository:** Public monorepo on GitHub (see §17.3 for full setup guide)
- **npm:** `@illustrate.md/core` published to npm for third-party integrations
- **Community health files:** README, CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue/PR templates, SECURITY.md — all from launch
- **Versioning:** Semantic versioning (semver) with conventional commits
- **CI:** Automated tests, linting, and type checking on all PRs
- **Branch protection:** `prod` and `dev` branches protected; PRs required; no force push

---

## 9. Out of Scope (v1)

- Real-time multiplayer / collaborative editing
- Vector drawing (bezier curves, freeform paths)
- Animation or transitions
- Mobile native apps
- Plugin system

---

## 10. Success Metrics

### 10.1 Launch Metrics (Phase 1–2 complete, first 90 days)

| Metric | Target | Measurement |
|---|---|---|
| Registered accounts | 500 | Server-side count |
| Diagrams created | 2,000 | Total non-empty saved documents |
| Weekly active creators | 100 | Users who create or edit ≥1 diagram per week |
| ASCII export → LLM round-trip accuracy | 90% | Automated test suite: export 50 reference diagrams, feed to Claude, score structural fidelity of re-creation |

| Metric | Target | Measurement |
|---|---|---|
| Public embed URLs in GitHub repos | 200 | GitHub code search for `illustrate.md/` in markdown files |
| `@illustrate.md/core` weekly npm downloads | 500 | npm registry stats |
| Monthly active users (web + TUI) | 1,000 | Distinct authenticated users with ≥1 action/month |
| Median time-to-first-diagram | < 5 minutes | Analytics: account creation → first save |

### 10.3 Quality Metrics (ongoing)

| Metric | Target | Measurement |
|---|---|---|
| Embed render latency (p95) | < 200ms | CDN edge monitoring |
| Uptime (embed endpoint) | 99.5% | Synthetic monitoring |
| TUI P0/P1 feature coverage | 100% | Feature checklist vs. shipped |
| Cloud save success rate | 99.9% | Server-side error rate tracking |

---

## 11. Phased Roadmap

> **⚠️ REBUILD NOTE:** All phases below are being built from scratch via `tinker rebuild`. No prior implementation carries forward. Lessons learned from the previous build attempt are preserved in §15 — use them to avoid repeating mistakes.
>
> **T-shirt sizes:** S = 1–2 days · M = 3–5 days · L = 1–2 weeks · XL = 2–4 weeks
>
> **Design principle:** Smaller phases = less blocking = faster iteration. Each phase is scoped to be completable in a single focused sprint.

### Phase 0 — Application Shell · Size: M
The editor layout shell. All future features plug INTO this shell. Must be verified before any feature work.
**Features:** F000 (Application Shell Layout)
**Acceptance:** Shell renders with placeholder content in all panels. Layout responsive. Route is `/editor`.

### Phase 1a — Core Data Model · Size: M
The `@illustrate.md/core` foundation. Buffer model, types, undo/redo system. Zero UI — pure logic layer with tests.
**Features:** Buffer (§5.1), Layer model (§5.2), CanvasDocument (§5.3), Undo/Redo (§5.5), Serialisation (§5.4)
**Acceptance:** All core types exported. Buffer CRUD operations tested. Undo/redo stack tested. Serialisation round-trip tested.

### Phase 1b — Canvas & Grid Rendering · Size: M
Grid rendering on web. DOM character grid with monospace alignment. Colour picker for fg/bg.
**Features:** F001 (Grid Dimensions), F002 (Grid Alignment), F064 (Colour Picker)
**Acceptance:** Canvas renders in shell center panel. Characters align. Colours selectable. Grid dimensions configurable from right sidebar.

### Phase 1c — Basic Drawing Tools · Size: L
Core drawing tools that make the canvas usable.
**Features:** F006 (Box), F007 (Line), F008 (Text), F011 (Eraser)
**Acceptance:** All four tools functional in shell toolbar. Each tool undo-able. Text input is modal (shortcuts suppressed while typing).

### Phase 1d — Layers & Export · Size: M
Layer management and basic export. Makes the editor "complete enough" to produce output.
**Features:** F014 (Layer CRUD), F015 (Show/Hide), F017 (Reorder), F041 (ASCII Export), F042 (Markdown Export), F045 (Copy to Clipboard), F052 (Keyboard Shortcuts)
**Acceptance:** Layer panel functional in sidebar. Export produces correct ASCII. Keyboard shortcuts work with modal suppression.

### Phase 2a — Canvas Polish · Size: M
Refinements that make the canvas feel professional.
**Features:** F003 (Zoom), F004 (Grid Presets), F005 (Rulers/Guides), F009 (Fill Tool)
**Acceptance:** Zoom in/out works. Presets available. Rulers visible. Fill tool functional.

### Phase 2b — Advanced Tools · Size: L
Power tools that unlock complex diagram creation.
**Features:** F010 (Select), F012 (Column Guides), F013 (Arrows/Connectors), F016 (Lock Layers), F019 (Parent/Child Layers)
**Acceptance:** Select with live preview. Arrows route between boxes. Layer locking and nesting work.

### Phase 2c — Design System · Size: XL
Component model and design system authoring. This is where illustrate.md becomes a design vocabulary.
**Features:** F020 (Define Components), F021 (Place Components), F022 (Flex Components), F025 (Charset Switching), F028 (LLM Export Format)
**Acceptance:** Components creatable from selection. Placeable on canvas. Charset switching works. LLM export includes semantic metadata.

### Phase 3a — Auth & Accounts · Size: M
User accounts via Supabase. Foundation for cloud and embeds.
**Features:** F046 (Auth/Login), F047 (Profile/Username)
**Requires:** Supabase project + OAuth apps configured (§17.1, §19.2)
**Acceptance:** GitHub + Google OAuth login works. Username set. Session persists.

### Phase 3b — Cloud & Library · Size: L
Cloud persistence and diagram management. Completes the platform layer.
**Features:** F048 (Diagram Library), F049 (Public/Private), F050 (Cloud Persistence), F053 (Local/Offline)
**Requires:** Phase 3a (auth)
**Acceptance:** Diagrams save to cloud. Library lists user's diagrams. Offline fallback works.

### Phase 3c — Design System Sharing · Size: S
Share design systems across documents (requires auth for ownership).
**Features:** F023 (Share Design Systems)
**Requires:** Phase 2c + Phase 3a
**Acceptance:** Export/import design system JSON. Version tracking.

### Phase 4a — Embed Core · Size: L
Embed URL system and render endpoints. The "shareable" layer.
**Features:** F029 (Embed URL), F030 (SVG Endpoint), F032 (ASCII Endpoint), F035 (Platform Rendering)
**Requires:** Phase 3b (cloud + usernames)
**Acceptance:** `/{username}/{id}` resolves. SVG and ASCII endpoints return correct content. Embeds render in GitHub README.

### Phase 4b — Embed Polish · Size: M
Additional export formats and living diagram updates.
**Features:** F031 (PNG Endpoint), F033 (Living Diagrams), F043 (SVG Export), F044 (PNG Export)
**Requires:** Phase 4a
**Acceptance:** PNG renders. Embeds update on save. Local SVG/PNG export works.

### Phase 5 — TUI CLI · Size: L
Terminal companion app. Viewing, querying, piping.
**Features:** F054 (Terminal Render), F055 (Colour Support), F056 (Watch Mode), F057 (List), F058 (Search), F059 (Copy Embed), F060 (Embed Snippet), F062 (Pipe ASCII), F063 (Local File Ops)
**Requires:** Phase 4a (embed URLs for remote features); local features can start after Phase 1d
**Acceptance:** `illustrate view`, `illustrate list`, `illustrate export` all functional.

### Phase 6 — AI Integration · Size: L
Prompt-to-flow generation using design system components.
**Features:** F026 (Prompt-to-Flow), F027 (Iterative Refinement), F061 (CLI AI Gen)
**Requires:** Phase 2c (design system) + Phase 3a (auth for metering)
**Acceptance:** Text prompt generates multi-screen layout. Follow-up prompts refine. CLI version works.

### Phase 7 — Pixel Art & Ecosystem · Size: XL
Pixel art mode, community features, and ecosystem polish.
**Features:** F018 (Layer Opacity), F024 (Community Library), F034 (Versioned Embeds), F036 (Pixel Art Mode), F037 (Brightness Mapping), F038 (Style Presets), F039 (Image Import), F040 (TUI Export), F051 (API Keys)
**Acceptance:** Pixel art mode toggleable. Community design systems browsable. API keys generatable.

### Phase 8 — Monetisation · Size: XL
Billing, tiers, and team features. See §14 for full details.
**Features:** F065–F073
**Requires:** Phase 4a (embeds for badge), Phase 6 (AI for metering)
**Acceptance:** Stripe checkout works. Tier enforcement gates features. Team workspaces functional.

### Execution Flow

```
Phase 0 (Shell)
    │
    └──→ Phase 1a (Core) ──→ Phase 1b (Canvas) ──→ Phase 1c (Tools) ──→ Phase 1d (Layers/Export)
                                                                              │
              ┌───────────────────────────────────────────────────────────────┘
              │
              ├──→ Phase 2a (Canvas Polish) ──→ Phase 2b (Advanced Tools) ──→ Phase 2c (Design System)
              │                                                                      │
              ├──→ Phase 3a (Auth) ──→ Phase 3b (Cloud/Library) ──→ Phase 3c (DS Sharing)
              │                              │
              │                              └──→ Phase 4a (Embed Core) ──→ Phase 4b (Embed Polish)
              │
              └──→ Phase 5 (TUI — local features can start early)

Phase 2c + 3a ──→ Phase 6 (AI)
Phase 4a + 6  ──→ Phase 7 (Pixel Art & Ecosystem)
Phase 7       ──→ Phase 8 (Monetisation)
```

**Parallel tracks:** Phases 2a/2b/2c and 3a/3b can run in parallel once Phase 1d is complete — they share no dependencies until Phase 3c and 4a converge.

---

## 12. Dependency Map

### Critical Path

```
F001 (Grid) ──→ F006 (Box) ──→ F020 (Define Components) ──→ F028 (LLM Export) ──→ F026 (AI Flow Gen)
     │               │                    │
     ├──→ F007 (Line)├──→ F013 (Arrows)   ├──→ F021 (Place Components)
     ├──→ F008 (Text) │                    ├──→ F022 (Flex Components)
     └──→ F011 (Eraser)                   └──→ F025 (Charset Switching)
                      │
F002 (Alignment) ─────┘

F001 (Grid) ──→ F005 (Rulers) ──→ F012 (Column Guides)

F046 (Auth) ──→ F047 (Username) ──→ F029 (Embed URL) ──→ F030 (SVG) ──→ F035 (Platform)
     │                                      │
     ├──→ F050 (Cloud) ──→ F048 (Library)   ├──→ F032 (ASCII Endpoint)
     │                        │              └──→ F033 (Living Diagrams)
     └──→ F049 (Pub/Priv) ───┘
```

### Dependency Chains

| Feature | Depends On | Rationale |
|---|---|---|
| **F003** Zoom | F001, F002 | Grid must exist and align before zoom transforms |
| **F005** Rulers | F001 | Rulers reference grid dimensions |
| **F009** Fill | F001, F002 | Needs grid and boundary detection |
| **F010** Select | F001, F014 | Needs grid buffer and layer awareness |
| **F012** Column guides | F001, F005 | Extends rulers concept — snapping builds on guide infrastructure |
| **F013** Arrows/connectors | F006, F007 | Builds on line tool + needs box detection for connection points |
| **F016** Lock layers | F014 | Layer CRUD must exist first |
| **F017** Reorder layers | F014 | Layer CRUD must exist first |
| **F018** Layer compositing | F014, F015 | Needs layers + visibility toggle |
| **F019** Parent/child layers | F014, F017 | Needs layers + reorder |
| **F020** Define components | F001, F006, F008 | Components are composed of boxes and text |
| **F021** Place components | F020, F014 | Needs component definitions + layers |
| **F022** Flex components | F020, F021 | Needs placeable components first |
| **F023** Share design systems | F020, F046 | Needs defined components + user accounts |
| **F024** Community library | F023, F047 | Needs shareable systems + user profiles |
| **F025** Charset switching | F020 | Components need to re-render with new charset |
| **F026** AI flow generation | F020, F021, F028 | Needs design system + placement + semantic format |
| **F027** Iterative refinement | F026 | Needs initial generation |
| **F028** LLM export format | F041, F020 | Needs ASCII export + component metadata |
| **F029** Embed URL | F046, F047, F050 | Needs auth + username + cloud storage |
| **F030** SVG endpoint | F029 | Needs embed URL to resolve |
| **F031** PNG endpoint | F030 | Builds on SVG rendering pipeline |
| **F032** ASCII endpoint | F029, F041 | Needs embed URL + ASCII export |
| **F033** Living diagrams | F029, F050 | Needs embed URL + save detection |
| **F034** Versioned embeds | F029, F050 | Needs embed URL + version history |
| **F035** Platform rendering | F029, F030 | Needs URL + SVG endpoint working |
| **F036** Pixel art mode | F001 | Alternate canvas mode |
| **F037** Brightness mapping | F036 | Needs colour-only mode |
| **F038** Style presets | F036 | Needs pixel art mode |
| **F039** Image import | F036, F037 | Needs colour mode + mapping |
| **F040** TUI export | F036, F037 | Needs colour mode + char mapping |
| **F043** SVG export | F001, F002 | Needs grid buffer to render |
| **F044** PNG export | F043 | Builds on SVG rendering |
| **F048** Diagram library | F046, F050 | Needs auth + persistence |
| **F049** Public/private | F046, F048 | Needs auth + library |
| **F050** Cloud persistence | F046 | Needs auth to associate data with user |
| **F051** API keys | F046 | Needs auth system |
| **F052** Keyboard shortcuts | F001 | Needs canvas and tools to exist before shortcuts can target them |
| **F053** Local/offline mode | F050 | Offline mode is the fallback for cloud persistence |
| **F054** Render in terminal | F041 | Needs ASCII export/compositing logic from core |
| **F055** Terminal colour support | F054 | Needs basic terminal rendering first |
| **F056** Watch mode | F054, F050 | Needs terminal rendering + cloud change detection |
| **F057** List diagrams | F046, F048 | Needs auth + diagram library |
| **F058** Search diagrams | F057 | Extends list with filtering |
| **F059** Copy embed URL | F029, F054 | Needs embed URLs + TUI context |
| **F060** Display embed snippet | F029 | Needs embed URL format |
| **F061** CLI prompt-to-flow | F026, F054 | Needs AI flow gen + TUI output |
| **F062** Pipe ASCII to stdout | F041 | Needs ASCII export |
| **F063** Local file operations | F054 | Needs terminal rendering for local files |

### Phase Gate Dependencies

- **Phase 0 (Shell):** No dependencies — first thing built

- **Phase 1b (Canvas):** Phase 0 + 1a
- **Phase 1c (Tools):** Phase 1b (canvas must render)
- **Phase 1d (Layers/Export):** Phase 1c (tools must exist)

- **Phase 3b (Cloud):** Phase 3a (auth required)
- **Phase 3c (DS Sharing):** Phase 2c + 3a
- **Phase 4a (Embed Core):** Phase 3b (cloud + usernames)
- **Phase 4b (Embed Polish):** Phase 4a
- **Phase 5 (TUI):** Phase 1d (local features); Phase 4a (remote features)
- **Phase 6 (AI):** Phase 2c + 3a
- **Phase 7 (Ecosystem):** Phase 4a + various
- **Phase 8 (Monetisation):** Phase 4a + 6

---

## 13. Decision Log

### [D001] DesignSystem Uses Named Semantic Roles
**Date:** 2026-02-21
**Context:** Inspired by automodern's semantic token pattern — named tokens with categorical roles enable switching contexts while preserving structure.
**Decision:** Components have a `ComponentRole` enum (`container`, `navigation`, `input`, `display`, `layout`, `feedback`).
**Consequences:** More upfront modelling vs. freeform component bags; pays off when AI needs to understand component purpose.

### [D002] CharacterSet is First-Class in DesignSystem
**Date:** 2026-02-21
**Context:** Box-drawing characters vary wildly (light/heavy/double/round); consistency requires explicit charset.
**Decision:** `CharacterSet` is a required field on `DesignSystem`, not optional or implicit.
**Consequences:** Adds complexity to component model but prevents visual inconsistency across a design system.

### [D003] Slots Enable Component Resizability
**Date:** 2026-02-21
**Context:** Components need editable regions (title, body) that survive resize.
**Decision:** `Slot` system with named, positioned editable regions within each component.
**Consequences:** Alternative was fixed-size-only components — simpler but defeats the purpose of reusable UI patterns.

### [D004] Auth is P0, Not Implicit
**Date:** 2026-02-21
**Context:** Embed URLs require usernames; cloud persistence requires accounts; auth is a blocking dependency for half the product.
**Decision:** Auth (F046) is P0, shipping in Phase 2c.
**Consequences:** Could have deferred with local-only mode first, but embed URLs are core to the value proposition.

### [D005] Web is Sole Creation Tool; TUI is Companion Only
**Date:** 2026-02-21
**Context:** Avoids splitting creation UX across two surfaces; TUI can focus on what terminals are good at (viewing, scripting, piping).
**Decision:** Web app is the primary and only creation tool. TUI is CLI companion for viewing, querying, and piping.
**Consequences:** Terminal power users might want full editing; addressed by keeping .illustrate files locally editable.

### [D006] Phase 2 Decomposed into 2a/2b/2c
**Date:** 2026-02-21
**Context:** Phase 2 carried 20 features (~40% of product) across unrelated workstreams. Drawing polish (2a) and auth/cloud (2c) have zero cross-dependencies. F028 (LLM Export) dependencies (F041 + F020) are met by Phase 2b.
**Decision:** Phase 2 split into 2a (Drawing Polish), 2b (Design System), 2c (Auth & Cloud). 2a and 2c run in parallel. F028 moved from Phase 4 to 2b. F005 promoted P2→P1.
**Consequences:** More phases to track vs. each phase being achievably scoped. Mitigated by clear dependency arrows and parallel track diagram.

### [D007] Adobe Photoshop Keyboard Shortcuts as Defaults
**Date:** 2026-02-21
**Context:** Photoshop shortcuts are the most widely known among visual tool users (V, M, B, E, T, U, Z).
**Decision:** Photoshop conventions as defaults; fully customisable via settings.
**Consequences:** Developers may prefer VS Code-style bindings — mitigated by making shortcuts customisable.

### [D008] Local Browser Storage as Offline Fallback
**Date:** 2026-02-21
**Context:** Need persistence when cloud is unreachable.
**Decision:** localStorage/IndexedDB for document persistence; sync to server on reconnect.
**Consequences:** Two sources of truth; mitigated by last-write-wins with user notification on conflict. Storage limits (~5-10MB) acceptable for ASCII documents.

### [D009] TUI Features Assigned Formal IDs (F054–F063)
**Date:** 2026-02-21
**Context:** §7.2 listed ~10 TUI capabilities as prose — invisible to dependency map and roadmap tracking.
**Decision:** Formalise all TUI features with IDs for planning, estimation, and dependency tracking.
**Consequences:** Increases total feature count; acceptable because they were already implicitly scoped.

**Date:** 2026-02-21
**Context:** Phase 1 delivered all 13 features with a working web canvas MVP and test suite. QA revealed 4 bugs (text input modal isolation, toolbar layout, cursor offset, select tool UX).
**Decision:** Ship Phase 1 as-is; document bugs in retrospective; fix early in Phase 2a.
**Consequences:** Ship-and-iterate approach — known bugs are non-blocking for Phase 2 start but must be fixed early in 2a to avoid compounding.

### [D011] Domain: illustrate.md Registered
**Date:** 2026-02-24
**Context:** Embed URLs use `/{username}/{id}` paths on the product domain. Domain must be secured before Phase 3.
**Decision:** `illustrate.md` domain registered and available.
**Consequences:** Domain is locked in. DNS configuration needed when Vercel production deployment is set up.

### [D012] Hosting: Vercel
**Date:** 2026-02-24
**Context:** Next.js is the web framework; Vercel is the canonical hosting platform with zero-config deploys, edge functions, and preview environments.
**Decision:** Vercel as the hosting platform for all environments (dev, test, prod).
**Consequences:** Tight Next.js integration; automatic preview deploys per PR; Vercel Edge available for embed endpoints (§8.3). Lock-in risk is low — Next.js deploys to other platforms if needed.

### [D013] CDN: None (Vercel Edge Implicit)
**Date:** 2026-02-24
**Context:** §8.3 specifies CDN caching for embed endpoints. Vercel provides edge caching by default.
**Decision:** No dedicated CDN provider for now. Vercel Edge handles caching. Revisit when embed traffic warrants dedicated CDN (Cloudflare, etc.).
**Consequences:** Simplifies infrastructure. May need to add Cloudflare or similar if embed render latency targets (p95 < 200ms) aren't met at scale.

### [D014] CI/CD: Vercel + GitHub Branching (dev/test/prod)
**Date:** 2026-02-24
**Context:** Need a deployment pipeline that supports QA gating and staged releases without overcomplicating early development.
**Decision:** Three-branch model: `dev` (continuous integration) → `test` (QA/staging) → `prod` (production release). Each maps to a Vercel environment.
**Consequences:** Clean separation of environments. PRs merge to `dev`; promotion to `test` and `prod` is deliberate. Adds branch management overhead but prevents accidental production deploys.

### [D015] Backend Platform: Supabase (PostgreSQL + Auth + Storage)
**Date:** 2026-02-24
**Context:** Need database, auth, and file storage. Supabase consolidates all three with a single platform, reducing integration complexity and operational overhead. Resolves decisions #5, #6, #7, #8 simultaneously.
**Decision:** Supabase as the backend platform. PostgreSQL for structured data, Supabase Auth for authentication (GitHub + Google OAuth built-in, email verification included), Supabase Storage for `.illustrate` file blobs, Supabase JS client SDK as the query layer (no separate ORM needed).
**Consequences:** Single platform dependency — acceptable given Supabase is open source and self-hostable as escape hatch. JS client SDK is tightly coupled to Supabase but natural fit with Next.js. No need for Prisma/Drizzle reduces dependency count.

### [D016] Email: Resend for Transactional Email Beyond Auth
**Date:** 2026-02-24
**Context:** Supabase Auth handles verification emails natively. Resend covers transactional emails beyond auth (sharing notifications, digest emails in Phase 3+).
**Decision:** Resend as transactional email provider. Not needed until Phase 3+ features require non-auth emails.
**Consequences:** Lightweight, developer-friendly API. Good Next.js SDK. Low cost at expected volumes.

### [D017] State Management: Zustand
**Date:** 2026-02-24
**Context:** Editor-style apps need complex state (undo/redo stacks, tool state, active layer, selection, buffer). Need a solution that's lightweight, works without React providers, and handles frequent updates efficiently.
**Decision:** Zustand for all client-side state management.
**Consequences:** No provider wrapping needed. Works well with the buffer model in §5. Subscription-based updates minimize re-renders. Well-established in editor tooling (Excalidraw, tldraw use similar patterns).

### [D018] Frontend Stack: Tailwind CSS + shadcn/ui + SF Mono
**Date:** 2026-02-24
**Context:** Need a systematic UI approach for the application shell (panels, buttons, menus, dialogs) while the canvas itself is custom. Font must support box-drawing characters reliably.
**Decision:** Tailwind CSS for utility styling. shadcn/ui (Radix primitives) for accessible, well-structured non-canvas UI components. SF Mono as primary monospace font with JetBrains Mono fallback for non-Apple platforms.
**Consequences:** Tailwind + shadcn is the de facto Next.js UI standard — abundant examples and community support. SF Mono is Apple-proprietary (can't bundle/serve), so fallback stack is essential: `'SF Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace`. JetBrains Mono must be self-hosted for cross-platform consistency.

### [D019] AI: Claude Sonnet via OpenRouter (Server-Side Proxy)
**Date:** 2026-02-24
**Context:** AI flow generation (F026, F027, F061) needs an LLM provider. Model choice may evolve; need flexibility without code changes.
**Decision:** Anthropic Claude Sonnet as initial model, accessed via OpenRouter as a server-side proxy. No BYOK (bring your own key) — all AI requests routed through our backend.
**Consequences:** OpenRouter enables model switching (Sonnet → Opus → GPT-4 → etc.) without code changes — just config. Server-side proxy keeps API keys secure and naturally enables usage metering (F066) and tier enforcement (F067). Adds operational cost but aligns with monetisation strategy.

### [D020] Linting: Biome
**Date:** 2026-02-24
**Context:** Need linting and formatting. Biome replaces ESLint + Prettier as a single, faster tool.
**Decision:** Biome for linting and formatting across the monorepo.
**Consequences:** Single tool reduces config complexity. Significantly faster than ESLint + Prettier. Less ecosystem maturity for custom rules, but standard rules cover our needs. Some team members may need to adjust from ESLint habits.

### [D021] Canvas Rendering: DOM-Based Character Grid
**Date:** 2026-02-24
**Context:** The canvas needs a rendering approach for the web app. Two options: HTML Canvas API (pixel-level rendering) or DOM-based character grid (each cell is a `<span>` in CSS Grid). Given the product renders ASCII characters — not pixels — DOM is the natural fit.
**Decision:** DOM-based character grid using CSS Grid layout with `<span>` elements per cell, rendered by React.
**Consequences:**
- ✅ Native hit detection (click events on DOM elements, no coordinate math)
- ✅ Text selection and accessibility for free
- ✅ React-friendly — cells are components, state updates trigger re-renders naturally
- ✅ CSS styling for fg/bg colours, bold, italic — no manual rendering
- ✅ Works seamlessly with Zustand state → React re-render pipeline
- ✅ Browser DevTools for debugging (inspect individual cells)
- ⚠️ Performance ceiling at very large canvases — mitigated by max 256×256 (65K elements), virtualization if needed
- ⚠️ Pixel art mode (Phase 5) may want HTML Canvas for colour-block rendering — can add as a secondary renderer consuming the same `@illustrate.md/core` buffer

### [D022] Open Source Strategy: Best Practices for First-Time OSS
**Date:** 2026-02-24
**Context:** First open source project. Need comprehensive setup covering repo structure, licensing, community health files, contribution workflow, and npm publishing.
**Decision:** Follow industry best practices documented in §17.3. MIT license, conventional commits, GitHub-native community features, branch protection, semantic versioning.
**Consequences:** Upfront setup cost pays off with community trust, contribution quality, and professional presentation. Guide in §17.3 provides step-by-step instructions.

### [D023] Rebuild from Scratch via Tinker
**Date:** 2026-02-24
**Context:** Previous build (Phase 1, 2026-02-21) revealed integration issues — features worked individually but didn't integrate cleanly into a cohesive application shell. Layout bugs (BUG-002), cursor accuracy issues (BUG-003), and modal input conflicts (BUG-001) indicated architectural issues worth resetting rather than patching.
**Decision:** Full rebuild from scratch using `tinker rebuild`. No prior code carries forward. All features reset to `draft`. Phases decomposed into smaller batches (16 micro-phases vs. original 8) with T-shirt size estimates.
**Consequences:** Loses previous implementation time (~1 day) but gains: clean architecture, shell-first approach (Phase 0), smaller non-blocking phases, and lessons-learned baked into the new build. Previous retrospective (§15) preserved as guidance.

---

## 14. Future Developments

### Phase 6 — Monetisation & Sustainability

With the core product complete through Phase 5, Phase 6 focuses on building a sustainable business model while keeping the open source core freely available.

#### 14.1 Pricing Philosophy

1. **Core library is MIT** — always free, forever. `@illustrate.md/core` on npm remains open source.
2. **Free tier is generous for open source** — public diagrams are the growth engine and community builder.
3. **Privacy is the unlock** — most professional developers will pay to keep work-in-progress private.
4. **AI is metered** — the expensive operational cost, scales with usage.
5. **Teams pay per-seat** — predictable revenue, standard SaaS model.

#### 14.2 Pricing Tiers

##### Free
**$0/month** — Perfect for open source & learning

| Feature | Limit |
|---------|-------|
| Public diagrams | Unlimited |
| Private diagrams | 0 |
| Canvas size | Up to 120×60 |
| Embed URLs | ✅ (with "made with illustrate.md" badge) |
| ASCII export | ✅ |
| SVG/PNG export | ✅ |
| Community design systems | ✅ |
| Custom design systems | 1 |
| AI flow generation | 5/month |

##### Pro
**$8/month** (or $80/year) — For professional developers

| Feature | Limit |
|---------|-------|
| Public diagrams | Unlimited |
| Private diagrams | Unlimited |
| Canvas size | Up to 256×256 |
| Embed URLs | ✅ (badge-free) |
| All export formats | ✅ |
| Custom design systems | Unlimited |
| AI flow generation | 100/month |
| API access | ✅ |
| Priority support | ✅ |

##### Team
**$12/user/month** — For teams building together

Everything in Pro, plus:

| Feature | Limit |
|---------|-------|
| Shared team library | ✅ |
| Shared design systems | ✅ |
| Team member management | ✅ |
| SSO (Google/GitHub) | ✅ |
| AI flow generation | 500/month (pooled) |
| Audit log | ✅ |

#### 14.3 Phase 6 Features

| ID | Feature | Priority | Description |
|---|---|---|---|
| F065 | Stripe billing integration | P0 | Subscription management, payment processing, invoices |
| F066 | Usage metering | P0 | Track AI generation usage per account |
| F067 | Tier enforcement | P0 | Gate features by subscription level |
| F068 | Badge/branding on free embeds | P1 | "Made with illustrate.md" link on free tier embeds |
| F069 | Team workspace | P1 | Shared diagram library for team accounts |
| F070 | Seat management | P1 | Add/remove team members, role assignment |
| F071 | Usage dashboard | P1 | View AI credits, diagram counts, team activity |
| F072 | Annual billing discount | P2 | ~17% discount for annual commitment |
| F073 | Enterprise tier | P2 | Custom pricing, SLA, dedicated support, on-prem option |

#### 14.4 Positioning

> *"Free for open source. Pro for professionals. Team for collaboration."*

The free tier serves as both a community builder and a funnel — developers discover illustrate.md through embedded diagrams in READMEs and docs, try it for their own open source work, and upgrade when they need privacy for commercial projects.

---

> **⚠️ HISTORICAL:** This section documents lessons from the previous build attempt (2026-02-21). The project is being rebuilt from scratch. These lessons are preserved to avoid repeating the same mistakes.

### 15.1 Previous Build Summary

**Previous build date:** 2026-02-21
**Features attempted:** F001, F002, F006, F007, F008, F011, F014, F015, F017, F041, F042, F045, F052 (13 features)
**Outcome:** Features were implemented but with integration issues. Rebuild from scratch initiated to address architectural concerns.

### 15.2 Known Bugs (to fix early in Phase 2a)

| ID | Severity | Description | Affected Feature | Fix Notes |
|---|---|---|---|---|
| BUG-001 | **High** | Text tool input not modal — typing "Hello World" triggers tool shortcuts (e.g. `e` activates Eraser) | F008, F052 | Text input must suppress all tool shortcuts while active; ESCAPE exits text mode. AC updated in F008 and F052. |
| BUG-002 | **Medium** | Toolbar column stretches to 100% width; canvas starts below toolbar instead of beside it | Web layout | Toolbar should be fixed-width left sidebar; canvas fills remaining viewport space side-by-side. CSS layout fix. |
| BUG-003 | **Medium** | Cursor position offset — ~50% too low and 50–100% too far right | F001, F002 | Mouse-to-grid coordinate mapping miscalculation. Likely a CSS transform or padding offset not accounted for in hit detection. |
| BUG-004 | **Low** | Select tool (V) shows selection only on mouseup, not during drag; no visible actions available on selection | F010 | Live selection preview needed during drag. Selection actions (move, copy, delete) need UI affordance. AC updated in F010. |

### 15.3 Repo Housekeeping

- **`.gitignore`** — Missing at repo creation. Added post-completion. Ensure `node_modules/`, `.next/`, `dist/`, `.turbo/`, `.env*` are excluded.
- **Test suite** — Tests created and passing. Note: use `npm run test:run` (not `npm test`) to avoid watch mode in CI.

### 15.4 Lessons Learned

1. **Modal input is a cross-cutting concern.** Text tool keyboard conflicts should have been caught by F052's AC. Updated both F008 and F052 acceptance criteria to make modal suppression explicit.
2. **Layout is a first-impression issue.** Toolbar/canvas layout bugs make the app feel broken even when core functionality works. Prioritise layout correctness in Phase 2a before adding new tools.
3. **Cursor accuracy is foundational.** If click-to-grid mapping is wrong, every drawing tool is impaired. Fix BUG-003 before Phase 2a feature work begins.
4. **Test runner mode matters.** CI/automated testing must use one-shot execution (`vitest run`, not `vitest`). Document in contributing guidelines.
5. **Repo scaffolding first.** `.gitignore` and CI config should be part of project setup, not afterthoughts. Add to Phase 2 kickoff checklist.

---

## 16. Pre-requisite Decisions

Foundational technology and infrastructure choices that must be resolved before the relevant phase begins. Each decision is tracked with its status and the phase that requires it.

### 16.1 Decision Matrix

| # | Category | Decision | Options | Choice | Status | Needed By |
|---|----------|----------|---------|--------|--------|-----------|
| 1 | Infrastructure | Domain registration | — | `illustrate.md` | ✅ Decided | Phase 3 |
| 2 | Infrastructure | Hosting platform | Vercel, Fly.io, Railway | **Vercel** | ✅ Decided | Phase 0 |
| 3 | Infrastructure | CDN provider | Cloudflare, Vercel Edge, none | **None for now** (Vercel Edge implicit) | ✅ Decided | Phase 3 |
| 4 | Infrastructure | CI/CD pipeline | GitHub Actions, Vercel CI | **Vercel + GitHub** — branching release: `dev` → `test` → `prod` | ✅ Decided | Phase 0 |
| 5 | Database | Primary database | PostgreSQL (Supabase/Neon), PlanetScale, Turso, Vercel Postgres | **Supabase PostgreSQL** | ✅ Decided | Phase 2c |
| 6 | Database | Document storage | DB JSON column, S3/R2 blob, Vercel Blob | **Supabase Storage** (JSON blobs) | ✅ Decided | Phase 2c |
| 7 | Database | ORM / query layer | Prisma, Drizzle, raw SQL | **Supabase JS client SDK** (no separate ORM) | ✅ Decided | Phase 2c |
| 8 | Auth | Auth library | NextAuth.js (Auth.js), Clerk, Supabase Auth, Lucia | **Supabase Auth** (GitHub + Google OAuth built-in) | ✅ Decided | Phase 2c |
| 9 | Auth | Email service (verification, transactional) | Resend, SendGrid, AWS SES | **Resend** (Supabase Auth handles verification; Resend for transactional beyond auth) | ✅ Decided | Phase 2c |
| 10 | Frontend | Canvas rendering approach | HTML Canvas API, DOM character grid (React) | **DOM character grid** (CSS Grid + `<span>` per cell) | ✅ Decided | Phase 0 |
| 11 | Frontend | State management | Zustand, Jotai, Valtio | **Zustand** (lightweight, no providers, ideal for editor state) | ✅ Decided | Phase 0 |
| 12 | Frontend | CSS / styling framework | Tailwind CSS, CSS Modules, vanilla CSS | **Tailwind CSS** (paired with shadcn/ui) | ✅ Decided | Phase 0 |
| 13 | Frontend | Monospace font | JetBrains Mono, Fira Code, Berkeley Mono, IBM Plex Mono | **SF Mono** (primary) + JetBrains Mono fallback | ✅ Decided | Phase 0 |
| 14 | Frontend | Component library (non-canvas UI) | shadcn/ui + Radix, Headless UI, custom | **shadcn/ui** (Radix primitives + Tailwind) | ✅ Decided | Phase 0 |
| 15 | AI | LLM provider | Anthropic (Claude), OpenAI, both | **Anthropic Claude Sonnet** (via OpenRouter; flexible to change) | ✅ Decided | Phase 4 |
| 16 | AI | API key model | Server-side proxy, user-provided key, both | **Server-side proxy via OpenRouter** | ✅ Decided | Phase 4 |
| 17 | Tooling | Testing framework | Vitest (implied by Phase 1) | **Vitest** | ✅ Decided | Phase 0 |
| 18 | Tooling | Linting / formatting | ESLint + Prettier, Biome | **Biome** (single tool, faster) | ✅ Decided | Phase 0 |
| 19 | External | npm org scope | — | `@illustrate.md` (needs registration). See §17.3 step 6. | 📋 Guide Ready | Phase 1 |
| 20 | External | GitHub org/repo | — | See §17.3 open source guide | 📋 Guide Ready | Phase 0 |
| 21 | External | OAuth app registrations | GitHub OAuth App, Google OAuth | See §17.1 setup guide | 📋 Guide Ready | Phase 2c |
| 22 | External | Stripe account | — | See §17.2 setup guide | 📋 Guide Ready | Phase 6 |

### 16.2 Deployment Architecture

Based on decisions #2 and #4:

```
GitHub Repo
  ├── dev branch      → Vercel Preview (dev environment)
  ├── test branch     → Vercel Preview (staging/QA environment)
  └── prod branch     → Vercel Production (illustrate.md)
```

**Branch workflow:** Feature branches → `dev` (continuous) → `test` (QA gate) → `prod` (release)

**Environment variables:** Managed per-environment in Vercel dashboard. `.env.local` for local dev (gitignored).

### 16.3 Blocking Decisions by Phase

Items that **must** be resolved before work begins on that phase:

**Phase 0 (Application Shell):** #10 ✅ DOM grid, #11 ✅ Zustand, #12 ✅ Tailwind, #13 ✅ SF Mono, #14 ✅ shadcn/ui, #18 ✅ Biome, #20 📋 GitHub repo (guide in §17.3)
→ **All tech decisions resolved for Phase 0.** Follow §17.3 to set up GitHub repo when ready.

**Phase 2c (Auth & Cloud):** #5 ✅ Supabase, #6 ✅ Supabase Storage, #7 ✅ Supabase JS, #8 ✅ Supabase Auth, #9 ✅ Resend, #21 📋 OAuth apps (setup guide in §17.1)
→ **All tech decisions resolved. Follow §17.1 setup guide to register OAuth apps before starting Phase 2c.**

**Phase 3 (Embeds):** #1 ✅, #3 ✅ (CDN decisions may evolve when embed traffic materialises)

**Phase 4 (AI):** #15 ✅ Claude Sonnet via OpenRouter, #16 ✅ Server-side proxy
→ **All Phase 4 tech decisions resolved.**

**Phase 6 (Monetisation):** #22 ⬚ Stripe (setup guide in §17.2)

---

## 17. Setup Guides

### 17.1 OAuth App Registrations (Decision #21)

**When needed:** Before Phase 2c (Auth & Cloud)

OAuth apps must be registered with GitHub and Google to enable social login via Supabase Auth. These credentials are configured in the Supabase dashboard and as environment variables.

#### GitHub OAuth App

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
   - Or direct link: https://github.com/settings/applications/new
2. Fill in:
   - **Application name:** `illustrate.md`
   - **Homepage URL:** `https://illustrate.md` (or `http://localhost:3000` for dev)
   - **Authorization callback URL:** `https://<your-supabase-project>.supabase.co/auth/v1/callback`
     - Find this in your Supabase dashboard under **Authentication → URL Configuration**
3. Click **Register application**
4. Copy the **Client ID** and generate a **Client Secret**
5. In **Supabase Dashboard → Authentication → Providers → GitHub:**
   - Enable GitHub provider
   - Paste Client ID and Client Secret
6. **For local development**, create a second OAuth app with:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback` (same — Supabase handles redirect)

#### Google OAuth

1. Go to **Google Cloud Console → APIs & Services → Credentials**
   - https://console.cloud.google.com/apis/credentials
2. Create a new **OAuth 2.0 Client ID** (Web application type)
3. Fill in:
   - **Name:** `illustrate.md`
   - **Authorized JavaScript origins:** `https://illustrate.md`, `http://localhost:3000`
   - **Authorized redirect URIs:** `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret**
5. In **Supabase Dashboard → Authentication → Providers → Google:**
   - Enable Google provider
   - Paste Client ID and Client Secret
6. **Enable the OAuth consent screen** in Google Cloud Console if not already done:
   - User type: External
   - App name: `illustrate.md`
   - Support email: your email
   - Scopes: `email`, `profile`, `openid`
   - Add test users during development (required before verification)

#### Environment Variables

Add to `.env.local` (for reference — Supabase handles OAuth server-side, but you may need these for redirect configuration):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

#### Verification Checklist

- [ ] GitHub OAuth app created (production)
- [ ] GitHub OAuth app created (development — optional, can share one)
- [ ] Google OAuth client created
- [ ] Google OAuth consent screen configured
- [ ] Both providers enabled in Supabase dashboard
- [ ] Test login works with GitHub
- [ ] Test login works with Google

---

### 17.2 Stripe Account Setup (Decision #22)

**When needed:** Before Phase 6 (Monetisation)

Stripe handles subscription billing, payment processing, and invoicing for the Pro and Team tiers.

#### Account Setup

1. **Create a Stripe account** at https://dashboard.stripe.com/register
   - Use a business email (e.g. billing@illustrate.md)
   - Business type: Software/SaaS
2. **Activate your account** — complete identity verification and banking details
   - This can take 1–3 business days
   - You can use Test Mode immediately without activation

#### Product & Pricing Configuration

3. Go to **Stripe Dashboard → Products → Add Product**
4. Create **three products:**

   | Product | Price | Billing |
   |---------|-------|---------|
   | illustrate.md Pro | $8/month | Recurring, monthly |
   | illustrate.md Pro (Annual) | $80/year | Recurring, yearly |
   | illustrate.md Team | $12/user/month | Recurring, monthly, per-seat |

5. Note the **Price IDs** (e.g. `price_xxx`) — these are used in the codebase for checkout sessions

#### Webhook Setup

6. Go to **Developers → Webhooks → Add endpoint**
7. Endpoint URL: `https://illustrate.md/api/webhooks/stripe`
8. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
9. Copy the **Webhook Signing Secret** (`whsec_xxx`)

#### API Keys

10. Go to **Developers → API Keys**
11. Copy:
    - **Publishable key** (`pk_test_xxx` / `pk_live_xxx`)
    - **Secret key** (`sk_test_xxx` / `sk_live_xxx`)

#### Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_xxx          # sk_live_xxx in production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # pk_live_xxx in production
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_xxx
```

#### Customer Portal

12. Go to **Settings → Billing → Customer Portal**
13. Enable the portal and configure:
    - Allow customers to cancel subscriptions
    - Allow plan switching (Pro ↔ Team)
    - Show invoices and payment history

#### Testing

14. Use **Test Mode** (toggle in Stripe Dashboard top-right) for all development
15. Test cards:
    - `4242 4242 4242 4242` — succeeds
    - `4000 0000 0000 0002` — declined
    - `4000 0000 0000 3220` — requires 3D Secure

#### Verification Checklist

- [ ] Stripe account created
- [ ] Business verification completed (for live mode)
- [ ] Products and prices created (test mode)
- [ ] Webhook endpoint configured
- [ ] API keys added to environment variables
- [ ] Customer portal enabled
- [ ] Test checkout flow works end-to-end
- [ ] Test webhook delivery works (use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

### 17.3 Open Source Project Setup (Decision #20)

**When needed:** Before Phase 0 (or during — repo can be private initially)

This is a step-by-step guide for setting up illustrate.md as a professional open source project. Follow these in order.

#### Step 1: Create the GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Owner:** Your personal account (or create an org like `illustrate-md` if you want a team namespace later)
3. **Repository name:** `illustrate.md`
4. **Description:** "ASCII wireframing and diagramming tool — built for AI, built with AI"
5. **Visibility:** Public (or Private initially, flip to public when ready for launch)
6. **Do NOT** initialize with README, .gitignore, or license (we'll add our own)
7. Click **Create repository**
8. Connect your existing local repo:
   ```bash
   cd /path/to/illustrate.md
   git remote add origin git@github.com:YOUR_USERNAME/illustrate.md.git
   git push -u origin dev
   ```

#### Step 2: Add Community Health Files

These files live in the repo root and signal professionalism to potential contributors:

**`LICENSE`** — MIT License
```
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**`CODE_OF_CONDUCT.md`** — Use the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)
- Industry standard, recognised by GitHub
- Copy from the link above, fill in your contact email
- GitHub will auto-detect and display it in the repo sidebar

**`SECURITY.md`** — Vulnerability reporting
```markdown
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: [your-email@example.com]
3. Include: description, steps to reproduce, potential impact
4. Expected response time: 48 hours

We appreciate your help keeping illustrate.md safe.
```

**`CHANGELOG.md`** — Track releases
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial project scaffolding
```

#### Step 3: Write CONTRIBUTING.md

This is the most important community file. It tells contributors how to participate.

```markdown
# Contributing to illustrate.md

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+

### Setup
1. Fork the repository
2. Clone your fork: `git clone git@github.com:YOUR_USERNAME/illustrate.md.git`
3. Install dependencies: `pnpm install`
4. Start the dev server: `pnpm dev`
5. Run tests: `pnpm test:run`

### Project Structure
```
illustrate.md/
  packages/core/     # @illustrate.md/core — renderer-agnostic logic
  apps/web/          # Next.js web application
  apps/tui/          # Ink CLI companion
```

## Development Workflow

### Branch Naming
- `feat/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation only
- `refactor/description` — code changes that don't add features or fix bugs

### Commit Messages
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add box tool resize handle`
- `fix: correct cursor offset in grid mapping`
- `docs: update README installation steps`
- `refactor: extract buffer operations to shared util`
- `test: add unit tests for undo/redo stack`

### Pull Request Process
1. Create a branch from `dev` (not `prod`)
2. Make your changes with clear, atomic commits
3. Ensure all tests pass: `pnpm test:run`
4. Ensure linting passes: `pnpm lint`
5. Ensure types check: `pnpm typecheck`
6. Open a PR against `dev`
7. Fill in the PR template
8. Wait for review — we aim to respond within 48 hours

### What Makes a Good PR
- **Small and focused** — one feature or fix per PR
- **Tests included** — new features need tests; bug fixes need regression tests
- **Clear description** — explain what and why, not just how

## Code Style
- Biome handles linting and formatting — run `pnpm lint` before committing
- TypeScript strict mode
- Prefer named exports over default exports
- Co-locate tests with source files (`*.test.ts` next to `*.ts`)

## Reporting Issues
- Use GitHub Issues
- Check existing issues first to avoid duplicates
- Use the provided issue templates
- Include: expected behavior, actual behavior, steps to reproduce

## First-Time Contributors
Look for issues labelled `good first issue` — these are specifically chosen for newcomers.

## Questions?
Open a Discussion on GitHub (not an Issue) for questions, ideas, or general chat.
```

#### Step 4: Set Up Issue and PR Templates

Create `.github/` directory with templates:

**`.github/ISSUE_TEMPLATE/bug_report.md`**
```markdown
---
name: Bug Report
about: Report a bug in illustrate.md
title: "[BUG] "
labels: bug
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: [e.g. Chrome 120]
- OS: [e.g. macOS 14]
```

**`.github/ISSUE_TEMPLATE/feature_request.md`**
```markdown
---
name: Feature Request
about: Suggest a feature for illustrate.md
title: "[FEATURE] "
labels: enhancement
---

**Problem**
What problem does this solve?

**Proposed Solution**
How would you like it to work?

**Alternatives Considered**
Any other approaches you've thought about?
```

**`.github/PULL_REQUEST_TEMPLATE.md`**
```markdown
## What
Brief description of changes.

## Why
Link to issue or explain motivation.

## How
Technical approach (if non-obvious).

## Testing
- [ ] Tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] `pnpm test:run` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] Commit messages follow conventional commits
```

#### Step 5: Configure Branch Protection

In GitHub → Settings → Branches → Add rule:

**For `prod` branch:**
- ✅ Require a pull request before merging
- ✅ Require status checks to pass (select: tests, lint, typecheck)
- ✅ Require branches to be up to date before merging
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

**For `dev` branch:**
- ✅ Require status checks to pass
- ✅ Do not allow force pushes

#### Step 6: Register npm Organisation

1. Go to [npmjs.com/signup](https://www.npmjs.com/signup) (or login)
2. Go to [npmjs.com/org/create](https://www.npmjs.com/org/create)
3. **Organisation name:** `illustrate.md` (or `illustrate-md` if dots aren't allowed)
4. **Plan:** Free (unlimited public packages)
5. This reserves the `@illustrate.md` scope for publishing `@illustrate.md/core`

#### Step 7: Write a Great README

Your README is the front door. Structure it like this:

```markdown
# illustrate.md

> An illustrate.md is worth 1000 tokens.

ASCII wireframing and diagramming tool — built for AI, built with AI.

[screenshot or demo GIF here]

## What is this?

illustrate.md is a WYSIWYG editor for creating ASCII wireframes and diagrams.
It's designed to produce output that's both human-readable and optimally
parseable by LLMs like Claude and GPT.

## Quick Start

\`\`\`bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/illustrate.md.git
cd illustrate.md
pnpm install

# Start development
pnpm dev
\`\`\`

## Features

- 🎨 Drawing tools: box, line, text, eraser, fill, arrows
- 📐 Character grid with guaranteed alignment
- 📦 Reusable design system components
- 🔗 Embeddable diagrams (SVG, PNG, ASCII)
- 🤖 AI-optimised export format
- ⌨️ Keyboard-first workflow

## Tech Stack

- **Core:** TypeScript, renderer-agnostic logic
- **Web:** Next.js, React, Zustand, Tailwind CSS, shadcn/ui
- **CLI:** Ink (React for terminals)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Monorepo:** Turborepo + pnpm

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT — see [LICENSE](./LICENSE)
```

#### Step 8: Set Up GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [dev, prod]
  pull_request:
    branches: [dev]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:run
      - run: pnpm build
```

#### Step 9: Choose a Launch Strategy

**Option A: Build in Public (recommended)**
- Keep repo public from day one
- Commit frequently, share progress
- Builds audience and accountability
- Use GitHub Discussions for community engagement

**Option B: Stealth → Launch**
- Keep repo private during development

- Launch on Hacker News, Twitter, r/programming
- Risk: less early feedback

**Recommendation:** Option A. illustrate.md's story ("built with AI, for AI") is compelling for build-in-public. Dev logs on Twitter/X or a blog can build audience before launch.

#### Step 10: Ongoing Maintenance Habits

- **Label issues** consistently: `bug`, `enhancement`, `good first issue`, `help wanted`, `documentation`
- **Respond to issues/PRs within 48 hours** — even if just "Thanks, we'll look at this"
- **Use GitHub Releases** for versioned releases with changelogs
- **Tag releases** with semver: `v0.1.0`, `v0.2.0`, etc.
- **Stale bot (optional):** Auto-close issues with no activity after 90 days
- **Thank contributors** — mention them in releases, add to a CONTRIBUTORS file

#### Verification Checklist

- [ ] GitHub repository created (public or private)
- [ ] LICENSE file added (MIT)
- [ ] CODE_OF_CONDUCT.md added
- [ ] SECURITY.md added
- [ ] CONTRIBUTING.md added
- [ ] Issue templates created (`.github/ISSUE_TEMPLATE/`)
- [ ] PR template created (`.github/PULL_REQUEST_TEMPLATE.md`)
- [ ] Branch protection rules set on `prod` and `dev`
- [ ] README.md written with project description and quick start
- [ ] CI workflow added (`.github/workflows/ci.yml`)
- [ ] npm org registered (`@illustrate.md`)
- [ ] CHANGELOG.md created

---

## 18. Environment Variables Reference

All API keys, secrets, and configuration values needed across all phases. A `.env.example` file is provided at the repo root as a template.

### 18.1 Phase 0–1 (Foundation)

No external services required. Local development only.

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 18.2 Phase 2c (Auth & Cloud)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Resend (transactional email beyond auth)
RESEND_API_KEY=re_xxx
```

> **Note:** GitHub and Google OAuth credentials are configured directly in the Supabase Dashboard (see §17.1), not as app environment variables.

### 18.3 Phase 4 (AI Integration)

```env
# OpenRouter (Claude Sonnet proxy)
OPENROUTER_API_KEY=sk-or-xxx
```

### 18.4 Phase 6 (Monetisation)

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_ANNUAL_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_xxx
```

### 18.5 Complete .env.example

See `/.env.example` in the repo root. Copy to `.env.local` and fill in values as each phase requires them.

---

## 19. Project Configuration Tasks

Manual setup tasks the project owner must complete outside of code. Organised by phase.

### 19.1 Before Phase 0

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Create GitHub repository | ⬚ | See §17.3 Step 1 |
| 2 | Add LICENSE (MIT) | ⬚ | See §17.3 Step 2 |
| 3 | Add CODE_OF_CONDUCT.md | ⬚ | Contributor Covenant v2.1 |
| 4 | Add SECURITY.md | ⬚ | See §17.3 Step 2 |
| 5 | Add CONTRIBUTING.md | ⬚ | See §17.3 Step 3 |
| 6 | Add issue + PR templates | ⬚ | `.github/` directory, see §17.3 Step 4 |
| 7 | Set up branch protection rules | ⬚ | `prod` and `dev`, see §17.3 Step 5 |
| 8 | Write README.md | ⬚ | See §17.3 Step 7 |
| 9 | Add GitHub Actions CI | ⬚ | `.github/workflows/ci.yml`, see §17.3 Step 8 |
| 10 | Copy `.env.example` → `.env.local` | ⬚ | Fill in `NEXT_PUBLIC_APP_URL` |
| 11 | Prepare logo mark assets | ⬚ | See §20 for specs |
| 12 | Connect Vercel project | ⬚ | Link GitHub repo, configure environments |

### 19.2 Before Phase 2c (Auth & Cloud)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 13 | Create Supabase project | ⬚ | https://supabase.com/dashboard |
| 14 | Copy Supabase URL + anon key to `.env.local` | ⬚ | Dashboard → Settings → API |
| 15 | Copy Supabase service role key to `.env.local` | ⬚ | **Keep secret — never expose client-side** |
| 16 | Register GitHub OAuth App | ⬚ | See §17.1 |
| 17 | Register Google OAuth Client | ⬚ | See §17.1 |
| 18 | Enable GitHub + Google providers in Supabase | ⬚ | Dashboard → Authentication → Providers |
| 19 | Create Resend account + API key | ⬚ | https://resend.com |
| 20 | Configure Resend API key in `.env.local` | ⬚ | |
| 21 | Verify domain in Resend (for production) | ⬚ | Needed for custom sender address |
| 22 | Set Vercel environment variables for staging | ⬚ | Supabase + Resend keys |

### 19.3 Before Phase 3 (Embeds)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 23 | Register domain `illustrate.md` | ⬚ | If not already done |
| 24 | Configure DNS for Vercel | ⬚ | CNAME or A records |
| 25 | Update `NEXT_PUBLIC_APP_URL` for production | ⬚ | `https://illustrate.md` |

### 19.4 Before Phase 4 (AI)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 26 | Create OpenRouter account | ⬚ | https://openrouter.ai |
| 27 | Add credits / payment method to OpenRouter | ⬚ | Claude Sonnet usage is metered |
| 28 | Copy OpenRouter API key to `.env.local` | ⬚ | |
| 29 | Set Vercel environment variable for production | ⬚ | `OPENROUTER_API_KEY` |

### 19.5 Before Phase 5 (Ecosystem)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 30 | Register npm org `@illustrate.md` | ⬚ | See §17.3 Step 6 |
| 31 | Configure npm publish token | ⬚ | For CI/CD automated publishing |

### 19.6 Before Phase 6 (Monetisation)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 32 | Create Stripe account | ⬚ | See §17.2 |
| 33 | Complete Stripe business verification | ⬚ | 1–3 business days |
| 34 | Create products + prices in Stripe | ⬚ | Pro, Pro Annual, Team |
| 35 | Configure Stripe webhook endpoint | ⬚ | See §17.2 |
| 36 | Copy Stripe keys + price IDs to `.env.local` | ⬚ | See §18.4 |
| 37 | Enable Stripe Customer Portal | ⬚ | See §17.2 |
| 38 | Set Vercel production env vars for Stripe | ⬚ | Use `sk_live_*` / `pk_live_*` |

---

## 20. Logo Mark Specification

### 20.1 Source File

Provide the logo mark as a **1:1 square** source file in the highest resolution available (ideally SVG or 1024×1024px+ PNG).

### 20.2 Required Formats & Sizes

Generate the following variants from the source logo mark:

| File | Size | Format | Use Case |
|------|------|--------|----------|
| `logo.svg` | Vector (scalable) | SVG | Primary — web app header, README, docs |
| `favicon.ico` | 48×48 (multi-res) | ICO | Browser tab icon (contains 16×16, 32×32, 48×48) |
| `favicon.svg` | Vector | SVG | Modern browsers (preferred over .ico) |
| `apple-touch-icon.png` | 180×180 | PNG | iOS home screen bookmark |
| `icon-192.png` | 192×192 | PNG | Android PWA icon / web manifest |
| `icon-512.png` | 512×512 | PNG | Android PWA splash / web manifest |
| `og-icon.png` | 1200×630 | PNG | Open Graph / social sharing (logo centered on brand background) |
| `logo-dark.svg` | Vector | SVG | Dark mode variant (if colours differ on dark backgrounds) |
| `logo-light.svg` | Vector | SVG | Light mode variant (if needed) |

### 20.3 Colour Variants

| Variant | When to Use |
|---------|-------------|
| **Full colour** | Default — web header, marketing, social |
| **Monochrome (black)** | Light backgrounds, print, README badge |
| **Monochrome (white)** | Dark backgrounds, dark mode header |
| **Monochrome (current colour)** | SVG with `fill="currentColor"` for adaptive theming |

### 20.4 File Locations in Repo

```
apps/web/
├── public/
│   ├── favicon.ico              # Browser tab
│   ├── favicon.svg              # Modern browser tab
│   ├── apple-touch-icon.png     # iOS bookmark
│   ├── icon-192.png             # PWA manifest
│   ├── icon-512.png             # PWA manifest
│   └── og-icon.png              # Social sharing
├── src/
│   └── components/
│       └── icons/
│           ├── Logo.tsx          # React component wrapping logo.svg
│           └── LogoMark.tsx      # Icon-only variant (no wordmark)
docs/
└── assets/
    ├── logo.svg                 # Full colour (for README, docs)
    ├── logo-dark.svg            # Dark mode
    └── logo-light.svg           # Light mode
```

### 20.5 Next.js Metadata Configuration

Update `apps/web/src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'illustrate.md',
  description: 'ASCII wireframing and diagramming — built for AI, built with AI',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: [{ url: '/og-icon.png', width: 1200, height: 630 }],
  },
};
```

### 20.6 Web Manifest

Create `apps/web/public/manifest.json`:

```json
{
  "name": "illustrate.md",
  "short_name": "illustrate",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

### 20.7 Guidelines

- **Minimum clear space:** Half the logo width on all sides
- **Minimum display size:** 16×16px (favicon) — ensure the mark is legible at this size
- **SVG optimisation:** Run through [SVGO](https://jakearchibald.github.io/svgomg/) before committing
- **No text in the icon** — the logo mark should be the symbol only; the wordmark "illustrate.md" is rendered in code (SF Mono / JetBrains Mono)

---

## 21. Rebuild Guide

> **Context:** The project is being rebuilt from scratch using `tinker rebuild`. All prior implementation is discarded. This section provides guidance for the rebuild process.

### 21.1 Rebuild Principles

1. **Clean slate.** No code carries forward. All features start from `draft` status.
2. **Small phases.** Each phase is scoped to 1–5 days of focused work. Smaller batches reduce blocking and enable faster feedback loops.
3. **Shell first.** Phase 0 (Application Shell) must be built and verified before any feature work. All features integrate INTO the shell.
4. **Core before UI.** Phase 1a builds the `@illustrate.md/core` data model with tests before any rendering. This ensures the foundation is solid.
5. **Test as you go.** Every phase should have passing tests before moving to the next. Use `vitest run` (never watch mode).
6. **Lessons apply.** §15 documents mistakes from the previous build. Key ones:
   - Modal input suppression must be explicit from day one (BUG-001)
   - Layout correctness before feature work (BUG-002)
   - Cursor/hit detection accuracy is foundational (BUG-003)
   - `.gitignore` and CI config in Phase 0, not afterthoughts

### 21.2 T-Shirt Size Reference

| Size | Duration | Example |
|------|----------|---------|
| **S** | 1–2 days | Single feature, limited scope (e.g. F023 design system sharing) |
| **M** | 3–5 days | Small feature group or foundation work (e.g. Phase 1b canvas rendering) |
| **L** | 1–2 weeks | Larger feature group with integration (e.g. Phase 2b advanced tools) |
| **XL** | 2–4 weeks | Major capability area (e.g. Phase 2c design system, Phase 7 ecosystem) |

### 21.3 Feature T-Shirt Sizes

| Feature | Size | Notes |
|---------|------|-------|
| F000 App Shell | M | Layout, responsive, route setup |
| F001 Grid Dimensions | S | Configurable width/height |
| F002 Grid Alignment | S | Monospace enforcement, CSS Grid |
| F003 Zoom | M | Transform scaling, shortcut binding |
| F004 Grid Presets | S | Preset selector UI |
| F005 Rulers/Guides | M | Edge numbers, snap-to-guide |
| F006 Box Tool | M | Drag interaction, charset, undo |
| F007 Line Tool | M | Snap angles, intersection chars |
| F008 Text Tool | M | Modal input, cursor, multi-line |
| F009 Fill Tool | S | Flood fill algorithm |
| F010 Select Tool | L | Selection, move, copy/paste, preview |
| F011 Eraser | S | Simple cell clearing |
| F012 Column Guides | M | Guide definition, snapping |
| F013 Arrows/Connectors | L | Manhattan routing, re-routing |
| F014 Layer CRUD | S | Create, rename, delete |
| F015 Show/Hide Layers | S | Toggle + compositing |
| F016 Lock Layers | S | Toggle + drawing rejection |
| F017 Reorder Layers | S | Drag-and-drop + shortcuts |
| F018 Layer Opacity | M | Opacity slider, compositing modes |
| F019 Parent/Child Layers | M | Nesting, cascade behaviour |
| F020 Define Components | L | Selection → component, slots, library |
| F021 Place Components | M | Drag from library, slot editing |
| F022 Flex Components | M | Resize logic, constraint system |
| F023 Share Design Systems | S | Export/import JSON |
| F024 Community Library | L | Browse, import, submission flow |
| F025 Charset Switching | S | Re-render with new charset |
| F026 Prompt-to-Flow | L | LLM integration, layout generation |
| F027 Iterative Refinement | M | Follow-up prompts, diff/accept |
| F028 LLM Export | M | Semantic metadata alongside ASCII |
| F029 Embed URL | M | URL generation, routing |
| F030 SVG Endpoint | M | Server-side SVG generation |
| F031 PNG Endpoint | S | Build on SVG pipeline |
| F032 ASCII Endpoint | S | Plain text response |
| F033 Living Diagrams | M | Cache invalidation on save |
| F034 Versioned Embeds | M | Version tracking, pinned URLs |
| F035 Platform Rendering | S | Validate in GitHub/Notion/Linear |
| F036–F040 Pixel Art | L | Full pixel art mode suite |
| F041 ASCII Export | S | Compositing + trimming |
| F042 Markdown Export | S | Backtick wrapping |
| F043 SVG Export | M | Vector rendering |
| F044 PNG Export | S | Raster from SVG |
| F045 Copy to Clipboard | S | One-click copy |
| F046 Auth | M | Supabase Auth setup |
| F047 Profile/Username | S | Username + display name |
| F048 Diagram Library | M | List, sort, search, views |
| F049 Public/Private | S | Visibility toggle |
| F050 Cloud Persistence | M | Auto-save, conflict resolution |
| F051 API Keys | M | Key generation, scoping |
| F052 Keyboard Shortcuts | M | Photoshop conventions, modal suppression |
| F053 Local/Offline | L | IndexedDB, sync, conflict resolution |
| F054–F063 TUI Suite | L | Full CLI companion |
| F064 Colour Picker | S | fg/bg selection, hex input |
| F065–F073 Monetisation | XL | Stripe, tiers, teams |

### 21.4 Tinker Card Mapping

Each phase maps to one or more Tinker cards. Recommended card structure:

| Phase | Cards | Priority |
|-------|-------|----------|
| Phase 0 | 1 card: Application Shell | P0 |
| Phase 1a | 1 card: Core Data Model | P0 |
| Phase 1b | 1 card: Canvas & Grid | P0 |
| Phase 1c | 1 card: Basic Drawing Tools | P0 |
| Phase 1d | 1 card: Layers & Export | P0 |
| Phase 2a | 1 card: Canvas Polish | P1 |
| Phase 2b | 1 card: Advanced Tools | P1 |
| Phase 2c | 1 card: Design System | P1 |
| Phase 3a | 1 card: Auth & Accounts | P0 |
| Phase 3b | 1 card: Cloud & Library | P0 |
| Phase 3c | 1 card: DS Sharing | P2 |
| Phase 4a | 1 card: Embed Core | P0 |
| Phase 4b | 1 card: Embed Polish | P1 |
| Phase 5 | 2 cards: TUI Local + TUI Cloud | P1 |
| Phase 6 | 1 card: AI Integration | P1 |
| Phase 7 | 2 cards: Pixel Art + Ecosystem | P2 |
| Phase 8 | 1 card: Monetisation | P2 |

---

*PRD version 1.5 — illustrate.md*

---

## Changelog

### v1.5 — 2026-02-24
- **REBUILD PREP**: All features reset to `draft` status (building from scratch via `tinker rebuild`)
- Phases decomposed from 8 to 16 micro-phases for smaller batches and less blocking
- T-shirt size estimates added for all features and phases (§21.3)
- §21 Rebuild Guide added — principles, size reference, Tinker card mapping
- §15 Retrospective preserved as historical lessons learned (not completion record)
- D023 decision: Rebuild from scratch
- Phase execution flow diagram updated with parallel track guidance

### v1.4 — 2026-02-24
- §18 Environment Variables Reference added — all API keys by phase with `.env.example` reference
- §19 Project Configuration Tasks added — 38 manual setup tasks organised by phase
- §20 Logo Mark Specification added — required sizes, formats, colour variants, file locations in repo
- `.env.example` file created at repo root

### v1.3 — 2026-02-24
- Decision #10 resolved: **DOM-based character grid** (CSS Grid + `<span>` per cell) — D021
- Decision #20 resolved: Open source setup guide — D022
- §17.3 Open Source Project Setup guide added (10 steps + verification checklist)
- §8.1 Rendering updated (no longer "still open")
- §8.4 Open Source expanded with community health files, versioning, CI, branch protection
- All Phase 0 tech decisions now resolved ✅

### v1.2 — 2026-02-24
- §17 Setup Guides added: OAuth app registration guide (§17.1), Stripe account setup guide (§17.2)
- Decision #20 (GitHub org) confirmed deferred
- Decision #21 (OAuth apps) and #22 (Stripe) linked to step-by-step setup guides

### v1.1 — 2026-02-24
- 16 of 22 pre-requisite decisions now resolved (was 5)
- Supabase selected as backend platform (DB + Auth + Storage) — D015
- Resend for transactional email — D016
- Zustand for state management — D017
- Tailwind + shadcn/ui + SF Mono for frontend — D018
- Claude Sonnet via OpenRouter (server-side proxy) for AI — D019
- Biome for linting/formatting — D020
- External account decisions (#19–22) marked as deferred
- Only #10 (canvas rendering) and #20 (GitHub repo) remain open for Phase 0

### v1.0 — 2026-02-24
- §16 Pre-requisite Decisions added — decision matrix with 22 items, 5 decided, 17 open
- Deployment architecture documented (Vercel + GitHub branching: dev/test/prod)
- Blocking decisions mapped per phase
- Decisions D011–D014: domain registered, Vercel hosting, no CDN (yet), Vercel+GitHub CI/CD

### v0.9 — 2026-02-24
- PRD template alignment: header metadata, glossary, architecture additions
- Feature status fields added (shipped/draft) to all features
- Acceptance criteria converted to checkbox format
- Inline dependencies added to all features
- Decision log converted to ADR-style format
- File conventions and testing strategy sections added
- Repo path documented

### v0.8 — 2026-02-21

- Phase 1 Retrospective added (§15) with known bugs and lessons learned
- F008, F010, F052 ACs refined
- Decision D010

### v0.7 — 2026-02-21
- Future Developments section (§14); Phase 6 Monetisation roadmap
- Pricing tiers (Free/Pro/Team); Features F060–F068

### v0.6 — 2026-02-21
- AC refinements (F013, F022, F033)
- F052 Keyboard Shortcuts + F053 Local/Offline
- TUI features assigned IDs (F054–F063)
- Success Metrics v1 targets; Decisions D007–D009

### v0.5 — 2026-02-21
- Phase 2 decomposed into 2a/2b/2c
- F005 promoted P2→P1; F028 moved to Phase 2b
- Decision D006

### v0.4 — 2026-02-21
- Feature IDs (F001–F042); draft acceptance criteria
- Dependency map, DesignSystem data model, Auth section, Decision log

### v0.3 — 2026-02-21
- Vision corrected; "built with AI, for AI" narrative
- Embed URLs, .illustrate file format, column guides

### v0.2 — 2026-02-21
- TUI repositioned as CLI companion; web app sole creation tool

### v0.1 — 2026-02-21
- Initial draft

---
## Tinker Metadata
<!-- Auto-generated by Tinker bootstrap -->
- **Stack**: vite, turborepo, pnpm
- **Template**: turborepo-next-pnpm
- **Bootstrapped**: 2026-02-24T14:15:27.270Z
- **Validated**: install ✓, dev-server ✓, page-load ✓, build ✓, test ✓

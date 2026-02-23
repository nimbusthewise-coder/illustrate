# illustrate.md — Product Requirements Document

> *"An illustrate.md is worth 1000 tokens."*

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
| 0.8 | 2026-02-21 | **Phase 1 COMPLETE** ✅; Phase 1 Retrospective added (§15) with known bugs and lessons learned; F008 AC refined (modal text input); F010 AC refined (live selection preview); F052 AC refined (modal tool suppression); repo housekeeping (.gitignore); Decision D010 |

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

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F001 | Configurable grid dimensions | P0 | User can set width/height in characters; canvas renders at specified dimensions; minimum 1×1, maximum 256×256 |
| F002 | Character grid rendering with guaranteed alignment | P0 | All characters align to grid; no sub-character positioning; monospace font enforced; consistent across browsers |
| F003 | Zoom in / out (web) | P1 | Zoom levels 50%–400% in discrete steps; keyboard shortcut (Cmd/Ctrl +/-); zoom indicator visible; grid alignment preserved at all zoom levels |
| F004 | Grid size presets (80×24, 120×40, custom) | P1 | At least 3 presets available; custom input accepts width×height; preset selection on new document and via resize |
| F005 | Rulers and guides | P1 | Row/column numbers displayed on edges; snap-to-guide for drawing tools; guides togglable *(promoted from P2 — required by F012 Column Guides)* |

### 6.2 Drawing Tools

| ID | Tool | Description | Priority | Acceptance Criteria |
|---|---|---|---|---|
| F006 | Box tool | Drag to draw bordered rectangle with box-drawing characters | P0 | Click-drag creates rectangle; uses active charset box chars; minimum 2×2; undo-able as single operation |
| F007 | Line tool | Horizontal, vertical, diagonal lines | P0 | Click-drag draws line; snaps to H/V/45° angles; uses appropriate line chars (─ │ ╲ ╱); intersection characters auto-resolve |
| F008 | Text tool | Place and edit text within grid cells | P0 | Click to place cursor; type to insert characters; arrow keys navigate; supports multi-line text; text wraps within bounds if constrained; **text input is modal** — while typing, all tool shortcuts are suppressed; user presses ESCAPE to exit text input mode and return to normal tool switching |
| F009 | Fill tool | Flood fill a region with a character or style | P1 | Click fills contiguous same-character region; respects boundaries; character and style configurable; undo-able |
| F010 | Select tool | Select, move, copy, paste regions | P1 | Click-drag to select rectangle with **live selection preview during drag** (marching ants or highlight visible while mouse is held); move selection with arrow keys or drag; Cmd/Ctrl+C/V for copy/paste; paste creates floating selection; selected region supports delete (backspace/delete key clears to empty) |
| F011 | Eraser | Clear cells to empty | P0 | Click or drag to clear cells to empty (null character, transparent bg); configurable eraser size (1×1, 3×3) |
| F012 | Column / row guides | Define fixed-width column structures | P1 | User defines column widths (e.g. 20-40-20); visual guides render on canvas; drawing tools snap to column boundaries; guides don't appear in export |
| F013 | Arrow / connector tool | Connect boxes with directional lines | P1 | Click source → click target; Manhattan routing (horizontal/vertical segments only); routing algorithm capped at 100 iterations — if no valid route found, display toast: `Route failed. Re-run? [(y)es] / [(n)o]`; routing is deterministic (same input always produces same route) to prevent jitter on re-render; arrowhead at terminus; re-routes when connected elements move |

### 6.3 Layers

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F014 | Create, rename, delete layers | P0 | New layer button; double-click to rename; delete with confirmation; at least one layer must exist |
| F015 | Show / hide layers | P0 | Eye icon toggle per layer; hidden layers excluded from compositing and export; visual indicator for hidden state |
| F016 | Lock layers | P1 | Lock icon toggle; locked layers reject drawing operations; visual indicator; selection tool skips locked layer content |
| F017 | Reorder layers | P0 | Drag-and-drop reorder in layer panel; compositing order updates immediately; keyboard shortcuts for move up/down |
| F018 | Layer opacity / compositing modes | P2 | Opacity slider 0–100%; at minimum: normal, multiply compositing; affects final render and export |
| F019 | Parent / child layer relationships | P1 | Drag layer onto another to nest; child layers move with parent; collapse/expand groups in panel; visibility/lock cascades to children |

### 6.4 Design System

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F020 | Define reusable named components | P0 | Create component from selection; name, description, role assignment; template buffer captured; slots definable; component appears in library panel |
| F021 | Place components on canvas | P0 | Drag from library to canvas; places on active layer; maintains template structure; slots are editable after placement |
| F022 | Components flex to fit their content | P1 | Slot text overflow triggers component resize; min/max size constraints defined by the component author at creation time; border characters re-render on resize; constraints editable after creation via component properties |
| F023 | Share design systems across documents | P1 | Export design system as standalone JSON; import into another document; version tracking; linked vs. embedded modes |
| F024 | Community design system library | P2 | Browse public design systems; one-click import; rating/popularity sorting; submission flow for contributors |
| F025 | Character set switching | P1 | Switch active charset (light/heavy/double/round); all components re-render with new charset; preview before applying |

### 6.5 AI-Assisted Flow Generation

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F026 | Prompt-to-flow generation using active design system | P1 | Text prompt input; generates multi-screen layout using current design system components; output placed on new layer(s); respects canvas dimensions |
| F027 | Iterative refinement via follow-up prompts | P1 | Follow-up prompts modify existing generated content; change history preserved; user can accept/reject individual changes |
| F028 | LLM-readable export format with semantic annotations | P1 | Export includes component names, roles, slot contents, spatial relationships as structured metadata alongside ASCII; round-trip parseable by Claude |

### 6.6 Embed System

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F029 | Unique persistent embed URL per diagram | P0 | Every saved diagram gets `/{username}/{id}` URL; URL is stable across edits; URL resolves to diagram content |
| F030 | SVG render endpoint for embed URLs | P0 | `GET /{username}/{id}` returns SVG; monospace font rendering; colours preserved; Content-Type: image/svg+xml |
| F031 | PNG render endpoint | P1 | `GET /{username}/{id}.png` returns PNG; configurable resolution; transparent background option |
| F032 | Plain ASCII text render endpoint | P0 | `GET /{username}/{id}.txt` returns plain text; no colour, no styling; clean ASCII for LLM consumption |
| F033 | Living diagram updates on source change | P1 | Embed reflects latest saved version; best-effort CDN cache invalidation (typically within 60s, not a hard SLA); stale content acceptable briefly during propagation |
| F034 | Versioned / pinned embed URLs | P2 | `/{username}/{id}@v2` syntax; version auto-incremented on save; pinned URLs never change; version history browsable |
| F035 | Works natively in GitHub, Notion, Linear, READMEs | P0 | `![alt](url)` syntax renders diagram in all listed platforms; validated with real embeds in each platform |

### 6.7 Pixel Art Mode

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F036 | Colour-only canvas mode | P1 | Toggle to pixel art mode; character data hidden; colour picker is primary tool; grid renders as coloured blocks |
| F037 | Brightness-to-character mapping | P1 | Configurable LUT (` ░▒▓█` default); brightness calculated from colour; ASCII export uses mapped characters |
| F038 | Style presets | P1 | At least 4 presets: monochrome, greyscale, 4-colour, full; one-click switching; custom palette support |
| F039 | Import low-res image and convert to pixel art | P2 | Upload PNG/JPG; auto-resize to canvas dimensions; colour quantisation to active palette; manual adjustment after import |
| F040 | Export as character art for TUI apps | P1 | Export with ANSI colour codes; preview in terminal-style viewer; copy to clipboard with escape sequences |

### 6.8 Export

| ID | Format | Priority | Acceptance Criteria |
|---|---|---|---|
| F041 | Plain ASCII text | P0 | All visible layers composited; trailing whitespace trimmed; output matches canvas exactly; newline-delimited rows |
| F042 | Markdown code block | P0 | Wrapped in triple backticks; language hint optional (e.g. ```ascii); copy-ready for pasting into .md files |
| F043 | SVG | P1 | Vector output; monospace font embedded or referenced; colours preserved; scalable without pixelation |
| F044 | PNG | P1 | Raster output; configurable DPI (72, 144, 288); transparent background option; anti-aliased text |
| F045 | Copy to clipboard | P0 | One-click copy; plain text format by default; option for rich format (with colours) where supported |

### 6.9 Authentication & Accounts

User accounts are the foundation for cloud persistence, embed URLs, and sharing. Without auth, the product is a local-only drawing tool.

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F046 | User registration and login | P0 | Email + password auth; OAuth (GitHub, Google) as primary flow; email verification; session management |
| F047 | User profile and username | P0 | Unique username (used in embed URLs); display name; avatar optional; username immutable after initial set (or changeable with redirect) |
| F048 | Diagram library | P0 | List all user's diagrams; sort by date, name; search by title and tags; grid and list view |
| F049 | Public / private diagram visibility | P1 | Default private; toggle to public; public diagrams accessible via embed URL without auth; private diagrams require auth |
| F050 | Cloud persistence | P0 | Auto-save on edit; manual save trigger; conflict resolution (last-write-wins initially); offline indicator |
| F051 | API keys for programmatic access | P2 | Generate API keys in settings; scoped permissions (read/write); rate limited; key rotation |

### 6.10 Web Application Features

| ID | Feature | Priority | Acceptance Criteria |
|---|---|---|---|
| F052 | Keyboard shortcuts system | P0 | Adobe Photoshop shortcut conventions as defaults (V=move, M=marquee, B=brush, E=eraser, T=text, U=shape, Z=zoom, etc.); all tools accessible via keyboard; shortcut hints shown in tooltips; customisable keybindings in settings; conflicts detected and flagged; **modal input suppression**: when a tool is in active input mode (e.g. text tool typing), all tool-switching shortcuts are suppressed until the user exits the mode (ESCAPE) |
| F053 | Local / offline mode | P1 | Documents auto-save to browser localStorage/IndexedDB when cloud is unreachable; sync to server when connection restored; offline indicator in UI; conflict resolution on reconnect (last-write-wins with notification); ASCII-rendered 404 error page when navigating to missing diagrams 😎 |
| F064 | Colour picker for fg/bg | P0 | Foreground and background colour selection; supports hex input, preset palette, and recently-used colours; active colours displayed in toolbar; keyboard shortcut to swap fg/bg (X) |

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

| ID | Feature | Category | Priority | Acceptance Criteria |
|---|---|---|---|---|
| F054 | Render diagram in terminal | Viewing | P0 | `illustrate view {id}` or `illustrate view {username}/{id}` renders diagram with box-drawing chars and colour; graceful fallback for unsupported terminals |
| F055 | Terminal colour support | Viewing | P1 | Auto-detect 256-colour and truecolour capability; fallback to 16-colour/mono; `--color` flag to override |
| F056 | Watch mode | Viewing | P1 | `illustrate watch {id}` monitors diagram for changes; re-renders on update; useful in split pane alongside editor; Ctrl+C to exit |
| F057 | List diagrams | Embed Mgmt | P0 | `illustrate list` shows all user diagrams; columns: title, id, updated, public/private; `--format json` for scripting |
| F058 | Search diagrams | Embed Mgmt | P1 | `illustrate search {query}` filters by name and tags; supports `--tag` flag; results same format as list |
| F059 | Copy embed URL / ASCII to clipboard | Embed Mgmt | P1 | `illustrate copy {id}` copies embed URL; `illustrate copy {id} --ascii` copies ASCII text; `--markdown` wraps in `![alt](url)` |
| F060 | Display embed snippet | Embed Mgmt | P1 | `illustrate embed {id}` prints ready-to-paste markdown embed snippet to stdout |
| F061 | CLI prompt-to-flow generation | AI Gen | P1 | `illustrate generate "{prompt}" --design-system {name}` generates flow using active design system; output to stdout or `--out {file}` |
| F062 | Pipe ASCII to stdout | AI Gen | P0 | `illustrate export {id}` pipes plain ASCII to stdout; composable with unix pipes (`illustrate export abc \| pbcopy`) |
| F063 | Local .illustrate file operations | Local | P0 | `illustrate open {file.illustrate}` renders local file in terminal; `illustrate save {id} --out {file}` saves to local file |

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

### 10.1 Launch Metrics (Phase 1–2 complete, first 90 days)

| Metric | Target | Measurement |
|---|---|---|
| Registered accounts | 500 | Server-side count |
| Diagrams created | 2,000 | Total non-empty saved documents |
| Weekly active creators | 100 | Users who create or edit ≥1 diagram per week |
| ASCII export → LLM round-trip accuracy | 90% | Automated test suite: export 50 reference diagrams, feed to Claude, score structural fidelity of re-creation |

### 10.2 Growth Metrics (Phase 3 complete, first 6 months)

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

### Phase 1 — Foundation ✅ COMPLETE (2026-02-21)
Core buffer model, basic drawing tools (box, line, text, eraser), plain ASCII export, undo/redo, web canvas MVP.
**Features:** F001, F002, F006, F007, F008, F011, F014, F015, F017, F041, F042, F045, F052
**Status:** All features implemented and functional. Test suite created. Known bugs documented in §15 (Phase 1 Retrospective). Repo created — .gitignore added post-completion.

### Phase 2 — Platform

Phase 2 is decomposed into three sub-phases to reduce scope overload. **2a and 2c can run in parallel** since they have no cross-dependencies until Phase 3. Phase 2b starts after 2a delivers enhanced drawing tools.

#### Phase 2a — Drawing Polish
Enhanced drawing tools, layer features, and canvas refinements that build on the Phase 1 foundation.
**Features:** F003 (Zoom), F004 (Grid Presets), F005 (Rulers), F009 (Fill), F010 (Select), F012 (Column Guides), F013 (Arrows), F016 (Lock Layers), F019 (Parent/Child Layers)

#### Phase 2b — Design System & Semantic Export
Component model, design system authoring, and LLM-readable export. This is the creative power layer — where illustrate.md stops being "just a drawing tool" and becomes a design vocabulary.
**Features:** F020 (Define Components), F021 (Place Components), F022 (Flex Components), F023 (Share Design Systems), F025 (Charset Switching), F028 (LLM Export Format)

> **Why F028 is here:** LLM-readable export depends on F020 (component metadata) + F041 (ASCII export, delivered in Phase 1). By Phase 2b, both dependencies are met. Shipping semantic export alongside the design system means the AI story is testable before Phase 4's generative features arrive.

#### Phase 2c — Auth & Cloud
User accounts, cloud persistence, and diagram management. This is the platform foundation that unlocks Phase 3 (embeds require usernames and cloud storage).
**Features:** F046 (Auth), F047 (Username/Profile), F048 (Diagram Library), F049 (Public/Private), F050 (Cloud Persistence), F053 (Local/Offline)

**Parallel execution note:**
```
Phase 1 complete
       │
       ├──→ Phase 2a (Drawing Polish)  ──→ Phase 2b (Design System)
       │                                         │
       └──→ Phase 2c (Auth & Cloud)  ─────────────┤
                                                   ↓
                                            Phase 3 (Embeds)
```

### Phase 3 — Embed & Share
Embed URL system, SVG render endpoint, living diagrams, GitHub rendering validation. **Requires Phase 2c** (auth + cloud) to be complete. TUI CLI companion ships here — it needs the cloud API to fetch diagrams.
**Features:** F029, F030, F031, F032, F033, F035, F043, F044, F054, F055, F056, F057, F058, F059, F060, F062, F063

### Phase 4 — AI Integration
Prompt-to-flow generation, AI-assisted component suggestion. **Requires Phase 2b** (design system) to be complete. F028 (LLM export) is already shipped — this phase builds the generative direction on top of it. TUI AI generation ships here alongside web.
**Features:** F026, F027, F061

### Phase 5 — Ecosystem
Pixel art mode, community design system library, RLE optimisation. `@illustrate.md/core` is available on npm from Phase 1; this phase focuses on third-party integration documentation, examples, and community tooling built on top of it.
**Features:** F018, F024, F034, F036, F037, F038, F039, F040, F051

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

- **Phase 2a requires:** All Phase 1 P0 features complete
- **Phase 2b requires:** Phase 2a drawing tools (F006 level available from Phase 1; enhanced tools from 2a enrich components)
- **Phase 2c requires:** Phase 1 complete (independent of 2a/2b)
- **Phase 3 requires:** Phase 2c complete (F046, F047, F050 — auth + accounts + cloud)
- **Phase 4 requires:** Phase 2b complete (F020, F021, F028 — design system + LLM export)
- **Phase 5 requires:** Phase 3 embed system for community features

---

## 13. Decision Log

| ID | Decision | Context | Trade-offs | Date |
|---|---|---|---|---|
| D001 | DesignSystem uses named semantic roles for components | Inspired by automodern's semantic token pattern — named tokens with categorical roles enable switching contexts while preserving structure | More upfront modelling vs. freeform component bags; pays off when AI needs to understand component purpose | 2026-02-21 |
| D002 | CharacterSet is a first-class part of DesignSystem | Box-drawing characters vary wildly (light/heavy/double/round); consistency requires explicit charset | Adds complexity to component model but prevents visual inconsistency across a design system | 2026-02-21 |
| D003 | Slots enable component resizability | Components need editable regions (title, body) that survive resize | Alternative was fixed-size-only components — simpler but defeats the purpose of reusable UI patterns | 2026-02-21 |
| D004 | Auth is P0, not implicit | Embed URLs require usernames; cloud persistence requires accounts; auth is a blocking dependency for half the product | Could have deferred with local-only mode first, but embed URLs are core to the value proposition | 2026-02-21 |
| D005 | Web is sole creation tool; TUI is companion only | Avoids splitting creation UX across two surfaces; TUI can focus on what terminals are good at (viewing, scripting, piping) | Terminal power users might want full editing; addressed by keeping .illustrate files locally editable | 2026-02-21 |
| D006 | Phase 2 decomposed into 2a/2b/2c with parallel tracks | Phase 2 carried 20 features (~40% of product) across unrelated workstreams. Decomposition reveals that drawing polish (2a) and auth/cloud (2c) have zero cross-dependencies and can run in parallel. F028 (LLM Export) moved from Phase 4 to 2b because its dependencies (F041 + F020) are met by then — shipping semantic export early makes the AI story testable sooner. F005 (Rulers) promoted P2→P1 to unblock F012 (Column Guides). | Adds sub-phase complexity to roadmap; mitigated by clear dependency arrows and parallel track diagram. Trade-off: more phases to track vs. each phase being achievably scoped. | 2026-02-21 |
| D007 | Adobe Photoshop keyboard shortcuts as defaults | Photoshop shortcuts are the most widely known among visual tool users (V, M, B, E, T, U, Z); reduces learning curve for designers transitioning to illustrate.md | Developers may prefer VS Code-style bindings — mitigated by making shortcuts customisable. Photoshop conventions may not map 1:1 to ASCII tools; adapt where needed. | 2026-02-21 |
| D008 | Local browser storage as offline fallback | localStorage/IndexedDB for document persistence when cloud is unreachable; sync on reconnect | Adds complexity to persistence layer (two sources of truth); mitigated by last-write-wins with user notification on conflict. Storage limits (~5-10MB localStorage) acceptable for ASCII documents. | 2026-02-21 |
| D009 | TUI features assigned formal IDs (F054–F063) | §7.2 listed ~10 TUI capabilities as prose without feature IDs — invisible to dependency map and roadmap tracking. Formalising them ensures they're planned, estimated, and dependency-tracked like all other features. | Increases total feature count; acceptable because they were already implicitly scoped. | 2026-02-21 |
| D010 | Phase 1 complete; Phase 2–5 planning begins | Phase 1 delivered all 12 features with a working web canvas MVP and test suite. QA revealed 4 bugs (text input modal isolation, toolbar layout, cursor offset, select tool UX) — all documented as known issues to address in Phase 2a. Repo housekeeping (.gitignore) noted. Phase 2a + 2c to kick off in parallel after planning session. | Ship-and-iterate approach — known bugs are non-blocking for Phase 2 start but must be fixed early in 2a to avoid compounding. | 2026-02-21 |

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

## 15. Phase 1 Retrospective

### 15.1 Completion Summary

**Completed:** 2026-02-21
**Features delivered:** F001, F002, F006, F007, F008, F011, F014, F015, F017, F041, F042, F045, F052 (13 features)
**Verdict:** All Phase 1 features implemented and functional. Web canvas MVP operational. Test suite created and passing.

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

*PRD version 0.8 — illustrate.md*

---
## Tinker Metadata
<!-- Auto-generated by Tinker bootstrap -->
- **Stack**: vite, turborepo, pnpm
- **Template**: turborepo-next-pnpm
- **Bootstrapped**: 2026-02-22T16:15:28.102Z
- **Validated**: install ✓, dev-server ✓, page-load ✓, build ✓, test ✓

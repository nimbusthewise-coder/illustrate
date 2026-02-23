# Eraser Feature Implementation (F011)

## Overview

The eraser tool has been successfully implemented for the illustrate.md project. This feature allows users to clear cells on the canvas by clicking or dragging, with configurable eraser sizes (1×1 or 3×3).

## Features Implemented

### Core Functionality

1. **Click to Erase**: Click on any cell to clear it to empty (null character, transparent background)
2. **Drag to Erase**: Hold and drag to erase multiple cells in a continuous motion
3. **Configurable Size**: Toggle between 1×1 (single cell) and 3×3 (3x3 grid) eraser sizes
4. **Visual Preview**: Hover over cells to see a red highlight preview of the eraser area before clicking
5. **Layer-Aware**: Eraser only affects the currently active layer
6. **Lock Protection**: Locked layers cannot be erased

## Files Created/Modified

### New Files

1. **`apps/web/src/types/tools.ts`**
   - Defines tool types (select, box, line, text, eraser, fill)
   - Defines `EraserSize` type (1 or 3)
   - Defines `ToolSettings` interface for tool configuration

2. **`apps/web/src/stores/tool-store.ts`**
   - Zustand store for managing current tool and tool settings
   - Actions: `setTool()`, `setEraserSize()`
   - Default tool is eraser with 1×1 size

3. **`apps/web/src/components/Toolbar.tsx`**
   - UI component for tool selection
   - Displays all tools with icons and keyboard shortcuts
   - Shows eraser size options when eraser is active
   - Includes keyboard shortcut reference

4. **`apps/web/src/components/Canvas.tsx`**
   - Main canvas rendering component
   - Handles mouse events (mousedown, mousemove, mouseup, mouseleave)
   - Implements eraser preview highlighting
   - Composites visible layers for final render

5. **`apps/web/src/components/LayerPanel.tsx`**
   - UI component for layer management
   - Allows adding/removing layers
   - Toggle layer visibility
   - Set active layer

6. **`apps/web/src/stores/canvas-store.test.ts`**
   - Comprehensive test suite for eraser functionality
   - Tests single cell erase
   - Tests multi-cell erase with different sizes
   - Tests boundary conditions
   - Tests locked layer protection

### Modified Files

1. **`apps/web/src/types/canvas.ts`**
   - Added `createLayer()` function
   - Added `createdAt` and `updatedAt` to `CanvasDocument` interface

2. **`apps/web/src/stores/canvas-store.ts`**
   - Added `eraseCell()` method for single cell erasure
   - Added `eraseCells()` method for multi-cell erasure with configurable size
   - Both methods respect layer locking and canvas boundaries

3. **`apps/web/src/app/page.tsx`**
   - Complete rewrite to integrate canvas, toolbar, and layer panel
   - Implements keyboard shortcuts (V, U, L, T, E, F for tools)
   - Three-column layout: Toolbar | Canvas | Layers

4. **`apps/web/vitest.config.ts`**
   - Added path alias resolution for `@` to enable imports in tests

## Usage

### Keyboard Shortcuts

- **E** - Activate eraser tool
- **V** - Select tool
- **U** - Box tool
- **L** - Line tool
- **T** - Text tool
- **F** - Fill tool

### Eraser Controls

1. Press **E** to activate the eraser tool
2. Click the **1×1** or **3×3** button in the toolbar to select eraser size
3. Click or drag on the canvas to erase cells
4. Red highlight shows the area that will be erased before you click

### Eraser Behavior

- **1×1 size**: Erases only the cell you click on
- **3×3 size**: Erases a 3×3 grid centered on the cell you click on
- Cells at canvas boundaries are handled gracefully (no errors)
- Locked layers cannot be erased (cells remain unchanged)
- Only the active layer is affected by the eraser

## Technical Implementation

### Data Structure

Each cell in the canvas buffer stores:
- `char`: Unicode character code (0 = empty)
- `fg`: Foreground color (RGBA as Uint32)
- `bg`: Background color (RGBA as Uint32)
- `flags`: Text styling flags

Erasing a cell sets all values to 0.

### Eraser Algorithm

```typescript
// For 1×1 eraser:
eraseCell(x, y) {
  const index = y * width + x;
  buffer.chars[index] = 0;
  buffer.fg[index] = 0;
  buffer.bg[index] = 0;
  buffer.flags[index] = 0;
}

// For 3×3 eraser:
eraseCells(x, y, size) {
  const halfSize = Math.floor(size / 2);
  for (dy = -halfSize to halfSize) {
    for (dx = -halfSize to halfSize) {
      eraseCell(x + dx, y + dy);
    }
  }
}
```

## Testing

All tests pass successfully:

```bash
pnpm test
```

Test coverage includes:
- ✅ Initialize document
- ✅ Erase single cell
- ✅ Erase with size 1
- ✅ Erase with size 3
- ✅ Respect locked layers
- ✅ Handle out of bounds gracefully
- ✅ Handle erasing near boundaries

## Validation

```bash
# Type checking passes
pnpm build

# Tests pass
pnpm test
```

Both commands complete successfully with no errors.

## Acceptance Criteria Met

| Criteria | Status | Notes |
|----------|--------|-------|
| Click to clear cells | ✅ | Single click erases cell(s) |
| Drag to clear cells | ✅ | Hold and drag for continuous erasing |
| Null character | ✅ | Cleared cells have char code 0 |
| Transparent background | ✅ | Cleared cells have bg color 0 |
| Configurable size | ✅ | 1×1 and 3×3 sizes available |
| Size selection UI | ✅ | Toolbar shows size buttons when eraser active |

## Future Enhancements

Potential improvements for future phases:
- Additional eraser sizes (5×5, 7×7)
- Circular eraser shape option
- Eraser opacity (partial erase)
- Eraser history/undo grouping optimization
- Eraser cursor preview shows actual grid pattern

## Related Features

This eraser implementation provides the foundation for:
- **F010 (Select Tool)**: Similar mouse interaction patterns
- **F009 (Fill Tool)**: Similar cell manipulation logic
- **Undo/Redo System**: Eraser operations can be undone

# BUG-004: Select Tool Fix - Implementation Summary

## Problem
The Select tool (V) only showed the selection rectangle on mouseup, not during drag. There were also no visible actions available once a selection was made.

## Solution Implemented

### 1. Live Selection Preview During Drag
- Added `selectStart` state to track the beginning of a selection drag
- Created `isInSelectionPreview()` helper function that checks if a cell is on the border of the current drag rectangle
- During drag (when `selectStart` is set and mouse is hovering), cells on the selection border show a **dashed blue border** (`rgba(59, 130, 246, 0.8)`)
- This provides real-time visual feedback as the user drags to create a selection

### 2. Selection Highlight After MouseUp
- When mouseup occurs, the selection is finalized using `setSelection()` from canvas-store
- Created `isInSelection()` and `isOnSelectionBorder()` helper functions
- Final selection shows:
  - **Semi-transparent blue overlay** (`rgba(59, 130, 246, 0.15)`) on all selected cells
  - **Solid blue border** (`rgba(59, 130, 246, 0.8)`) on cells at the selection edge
- Selection persists until cleared or a new selection is made

### 3. Keyboard Actions on Selection

#### Delete Key (Delete/Backspace)
- Clears all characters in the selected area
- Sets all cells to empty (char code 0, fg 0, bg 0, flags 0)
- Only works if the active layer is not locked

#### Copy Selection (Cmd/Ctrl+C)
- Builds a text representation of the selected area
- Composites all visible layers (same rendering logic as display)
- Copies multi-line text to clipboard
- Each row is a line, preserving the rectangular selection

#### Move Selection (Arrow Keys)
- Arrow Up/Down/Left/Right move the entire selection by 1 cell in that direction
- Maintains selection size while moving
- Respects canvas boundaries (won't move selection out of bounds)
- Updates both `startCol/startRow` and `endCol/endRow` to maintain selection shape

### 4. Deselection

#### Click Outside Selection
- Clicking on an empty area of the canvas (outside the grid) clears the selection
- Added `handleCanvasClick` to detect clicks on the terminal container

#### Escape Key
- Pressing Escape clears the current selection
- Provides quick keyboard way to exit selection mode

#### Start New Selection
- Clicking on any cell (when not inside existing selection) starts a new selection
- Previous selection is automatically cleared

### 5. Clicking Inside Existing Selection
- If user clicks inside an existing selection, it's preserved
- Prevents accidental deselection when trying to interact with selected area
- This supports future drag-to-move functionality

## Technical Details

### State Management
- **Local state**: `selectStart` tracks the drag start position
- **Store state**: `selection` in canvas-store holds the finalized selection
- Selection is stored as `{ startCol, startRow, endCol, endRow }`

### Event Handling
- **Mouse down**: Start selection drag or check if clicking inside existing selection
- **Mouse move**: Update hover position for live preview
- **Mouse up**: Finalize selection
- **Global mouse up**: Cancel selection if released outside canvas
- **Keyboard**: Separate effect hook for selection-specific keyboard controls

### Visual Feedback
- **During drag**: Dashed border on preview rectangle
- **After selection**: Semi-transparent overlay + solid border
- **Cursor**: Crosshair cursor when select tool is active

### Boundary Checking
- All selection operations respect canvas dimensions
- Movement prevents selection from going out of bounds
- Copy/delete operations handle layer visibility and locking

## Acceptance Criteria Status

✅ **Selection rectangle visible during drag** - Dashed blue border shown in real-time
✅ **Selection area highlighted after mouseup** - Blue overlay with solid border
✅ **Delete key clears selected cells** - Implemented with layer locking check
✅ **Cmd/Ctrl+C copies selection** - Multi-line text copied to clipboard
✅ **Arrow keys move selection** - All four directions with boundary checks
✅ **Click outside selection deselects** - Both canvas click and Escape key

## Files Modified

### `apps/web/src/components/Canvas.tsx`
- Added `selectStart` state for drag tracking
- Imported `selection`, `setSelection`, `clearSelection` from canvas-store
- Added `handleMouseDown` logic for select tool
- Added `handleMouseUp` to finalize selection
- Added `handleCanvasClick` to deselect on outside click
- Created helper functions:
  - `isInSelectionPreview()` - Check if cell is in drag preview
  - `isInSelection()` - Check if cell is in finalized selection
  - `isOnSelectionBorder()` - Check if cell is on selection edge
- Added keyboard effect for selection controls (Delete, Cmd/Ctrl+C, arrows, Escape)
- Updated cell rendering to show selection preview and final selection styles
- Updated cursor style for select tool

## Validation Results

✅ **Build**: `pnpm build` - Success
✅ **Tests**: `pnpm vitest run` - All 124 tests passed

## User Experience

1. **Select Tool Activation**: Press 'V' to activate select tool
2. **Draw Selection**: Click and drag to see dashed rectangle preview
3. **Finalize**: Release mouse to see highlighted selection with blue overlay
4. **Actions**:
   - Press Delete/Backspace to clear selected cells
   - Press Cmd/Ctrl+C to copy selection as text
   - Press arrow keys to move selection
   - Press Escape or click outside to deselect
5. **Visual Feedback**: Clear distinction between preview (dashed) and final (solid) selection

## Notes

- Selection works across all layers (composited view for copy)
- Delete only affects active layer
- Selection respects layer locking (won't delete from locked layers)
- Copy operation preserves multi-line structure
- Arrow movement is smooth with boundary detection

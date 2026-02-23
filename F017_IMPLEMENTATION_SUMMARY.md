# F017: Reorder Layers - Implementation Summary

## Task Completion

Successfully implemented layer reordering functionality for illustrate.md canvas application.

## Features Implemented

### 1. Store Functions (canvas-store.ts)

Added three new functions to the canvas store:

- **`reorderLayer(layerId: string, newIndex: number)`** - Core function to move a layer to a specific index in the layers array
- **`moveLayerUp(layerId: string)`** - Move layer up in the stack (higher z-index, rendered on top)
- **`moveLayerDown(layerId: string)`** - Move layer down in the stack (lower z-index, rendered below)

#### Implementation Details:
- Layers are stored in bottom-to-top order in the array
- Index 0 = bottom layer, Index n-1 = top layer
- Canvas rendering composites from top to bottom (layers[n-1] to layers[0])
- Reordering properly maintains layer data (buffers, visibility, lock state)
- Updates document timestamp on reorder

### 2. Drag-and-Drop UI (LayerPanel.tsx)

Enhanced the LayerPanel component with full drag-and-drop support:

- **Drag handle** - Visual indicator (⋮⋮) on each layer for dragging
- **Visual feedback** - Dragged layer becomes semi-transparent and scales down
- **Drop target highlight** - Primary color ring appears on valid drop target
- **Transparent drag image** - Clean dragging experience without browser default image

#### Drag Events:
- `onDragStart` - Initiates drag, sets dragged layer
- `onDragOver` - Highlights drop target
- `onDragLeave` - Clears drop target highlight
- `onDrop` - Reorders layer to new position
- `onDragEnd` - Cleanup state

### 3. Keyboard Shortcuts

Implemented Cmd/Ctrl + Arrow key shortcuts:

- **Cmd/Ctrl + ↑** - Move active layer up (toward top of stack)
- **Cmd/Ctrl + ↓** - Move active layer down (toward bottom of stack)

#### Keyboard Behavior:
- Only active when not editing layer names
- Prevents default arrow key behavior
- Cross-platform (Meta key on Mac, Ctrl on Windows/Linux)
- Disabled when at top/bottom of stack

### 4. Manual Reorder Buttons

Added up/down arrow buttons to each layer:

- **↑ button** - Move layer up one position
- **↓ button** - Move layer down one position
- Disabled states when at stack boundaries
- Clear tooltips with keyboard shortcut hints

### 5. Layer Display Order

- Layers displayed in **reverse order** in the UI (top layers shown first)
- Matches user expectation (top = foreground, bottom = background)
- Visual stack metaphor aligns with compositing behavior

### 6. User Guidance

Added helpful hint text to the panel:
```
Drag to reorder • Cmd/Ctrl + ↑/↓ to move
```

## Compositing Order

The canvas renderer respects layer order:

1. Layers are composited from **top to bottom** (last to first in array)
2. First non-transparent pixel encountered is rendered
3. Reordering immediately affects final render
4. No refresh or rebuild needed - updates are reactive

## Testing

Created comprehensive test suite with **10 new tests** for F017:

✅ Layer reordering to specific index  
✅ Move layer up in stack  
✅ Move layer down in stack  
✅ Boundary conditions (top/bottom layer)  
✅ Index clamping  
✅ No-op when reordering to same index  
✅ Document timestamp updates  
✅ Layer data preservation  

**All 35 canvas-store tests pass** (including 25 previous tests + 10 new)

## Files Modified

1. `apps/web/src/stores/canvas-store.ts` - Added reorder functions
2. `apps/web/src/components/LayerPanel.tsx` - Added UI and interactions
3. `apps/web/src/stores/canvas-store.test.ts` - Added test coverage

## Acceptance Criteria Met

✅ **Drag-and-drop reorder** - Full HTML5 drag-and-drop with visual feedback  
✅ **Compositing order updates immediately** - Reactive rendering respects array order  
✅ **Keyboard shortcuts** - Cmd/Ctrl + ↑/↓ for move up/down  
✅ **Layer panel UI** - Manual buttons + drag handle + tooltips  
✅ **No data loss** - Layer buffers and properties preserved during reorder  

## Design Decisions

### Layer Order Convention
- Array index 0 = bottom (background)
- Array index n-1 = top (foreground)
- UI displays reversed (top first visually)

This matches:
- Natural user expectation (top = front)
- Existing canvas compositing logic
- Common design tool conventions (Photoshop, Figma, etc.)

### Interaction Methods
Provided **three ways** to reorder:
1. Drag-and-drop (most intuitive)
2. Keyboard shortcuts (power users)
3. Up/down buttons (discoverability)

### Visual Feedback
- Drag handle cursor changes (grab → grabbing)
- Dragged layer opacity + scale
- Drop target ring highlight
- Disabled state for boundary conditions

## Edge Cases Handled

- Can't move top layer up further
- Can't move bottom layer down further
- Reordering to same index is no-op
- Index clamping for out-of-range values
- Disabled during layer name editing
- Maintains active layer selection

## Dependencies

Depends on **F014** (Layer Management) as specified in PRD:
- Create, rename, delete layers ✅
- Active layer tracking ✅
- Layer visibility toggle ✅

## Known Limitations

None. Feature is fully functional and tested.

## Future Enhancements (Out of Scope)

Could add in Phase 2:
- Multi-layer selection for batch reorder
- Drag-and-drop into groups (F019 - Parent/child layers)
- Undo/redo for reorder operations
- Layer thumbnails in panel

## Validation

✅ Build passes: `pnpm build`  
✅ Type checking passes: `tsc --noEmit`  
✅ Tests pass: 35/35 canvas-store tests  
✅ No regressions in other components  

---

**Status:** ✅ Complete and ready for approval

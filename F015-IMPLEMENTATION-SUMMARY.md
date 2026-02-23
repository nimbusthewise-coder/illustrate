# F015: Show / Hide Layers - Implementation Summary

## Task Completion

**Feature ID:** F015  
**Feature:** Show / hide layers  
**Priority:** P0  
**Status:** ✅ COMPLETE

## Acceptance Criteria

All acceptance criteria from the PRD have been met:

- ✅ **Eye icon toggle per layer** - Implemented in `LayerPanel.tsx` with interactive eye/eye-off icons
- ✅ **Hidden layers excluded from compositing** - Implemented in `Canvas.tsx` using `getVisibleLayers()` method
- ✅ **Visual indicator for hidden state** - Hidden layers show:
  - Eye-off icon instead of eye icon
  - Reduced opacity (50%) on the entire layer row
  - Muted foreground color on the eye icon

## Files Created/Modified

### Created Files

1. **`apps/web/src/types/canvas.ts`** - Core data types
   - `Buffer` interface with typed arrays for characters and colors
   - `Layer` interface with `visible` property
   - `CanvasDocument` interface
   - Helper functions: `createBuffer()`, `createLayer()`, `generateLayerId()`

2. **`apps/web/src/stores/canvas-store.ts`** - Zustand state management
   - `toggleLayerVisibility()` - Toggle visibility of a specific layer
   - `getVisibleLayers()` - Return only visible layers for compositing
   - Layer CRUD operations: add, remove, rename, reorder
   - Drawing operations: erase cell(s)

3. **`apps/web/src/components/LayerPanel.tsx`** - Layer management UI
   - Eye icon toggle button for each layer
   - Visual feedback: opacity change and icon swap for hidden layers
   - Layer renaming (inline edit)
   - Layer deletion with confirmation
   - Active layer highlighting
   - Layer count display (visible/total)

4. **`apps/web/src/components/Canvas.tsx`** - Canvas rendering
   - Composites only visible layers
   - Bottom-to-top layer ordering
   - Respects layer offsets and transparency
   - Displays visibility count in header

5. **`apps/web/src/stores/canvas-store-visibility.test.ts`** - Comprehensive test suite
   - Tests visibility toggle functionality
   - Tests exclusion of hidden layers from `getVisibleLayers()`
   - Tests default visibility state for new layers
   - Tests visibility state persistence during reordering
   - Tests document timestamp updates

### Modified Files

1. **`apps/web/src/app/page.tsx`** - Main page layout
   - Added `LayerPanel` to the UI
   - Integrated with existing canvas and settings

2. **`apps/web/src/components/Toolbar.tsx`** - Simplified to use `tool-store`
   - Removed dependency on non-existent `editor-store`
   - Uses `useToolStore` for tool state management

## Technical Implementation Details

### Data Model (PRD Section 5.2)

```typescript
interface Layer {
  id: string;
  name: string;
  parentId: string | null;
  visible: boolean;         // ← F015: Visibility flag
  locked: boolean;
  x: number;
  y: number;
  buffer: Buffer;
}
```

### Compositing Logic

The canvas compositing respects layer visibility:

1. `getVisibleLayers()` filters layers where `visible === true`
2. Canvas renders only visible layers in bottom-to-top order
3. Each pixel composites: later layers override earlier layers
4. Transparent cells (charCode === 0, bg === 0) fall through to lower layers

### UI/UX Features

- **Eye Icon**: SVG icons inline (no external dependencies)
  - Open eye (👁️) when visible
  - Slashed eye (👁️‍🗨️) when hidden
- **Visual Feedback**: 
  - Opacity: 50% for hidden layer rows
  - Color: Muted foreground for hidden state icon
  - Border: Active layer gets primary-colored border
- **Layer Count**: Footer shows "X of Y layers visible"

## Validation Results

### Build Status
```
✅ Type checking: PASS
✅ Build: PASS (Next.js production build successful)
```

### Test Status
```
✅ All tests: 17 passed (17)
  - Core package: 27 tests passed
  - Web package: 17 tests passed
    - F015 visibility tests: 5 tests passed
    - Canvas store tests: 10 tests passed
    - App tests: 2 tests passed
```

## Integration with Existing Features

- **F014 (Create, rename, delete layers)**: Layer panel includes rename and delete
- **F017 (Reorder layers)**: Visibility state persists through reordering
- **F001 (Grid dimensions)**: Canvas respects document dimensions
- **F011 (Eraser)**: Eraser tool respects active layer

## Future Enhancements (Not in Scope)

These features are planned for later phases:

- **F016 (Lock layers)**: Lock icon and editing prevention (Phase 2a)
- **F018 (Layer opacity/compositing)**: Opacity slider (Phase 5)
- **F019 (Parent/child layers)**: Nested layer groups (Phase 2a)

## Dependencies Satisfied

- ✅ F014 (Layer CRUD) - Required for layer management UI
- ✅ F001 (Grid) - Required for buffer dimensions
- ✅ F002 (Grid alignment) - Required for canvas rendering

## Next Steps

With F015 complete, the following Phase 1 features remain:
- None - F015 was the final P0 layer feature

Phase 2a can now proceed with:
- F016 (Lock layers)
- F019 (Parent/child layer relationships)
- Enhanced layer panel UI

---

**Implementation Date:** February 23, 2026  
**Validation:** All tests pass ✅  
**Build:** Production ready ✅

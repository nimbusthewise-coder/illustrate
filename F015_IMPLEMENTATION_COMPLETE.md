# F015: Show/Hide Layers - Implementation Complete

## ✅ Feature Status: FULLY IMPLEMENTED

All requirements for F015 have been successfully implemented and tested.

## Implementation Details

### 1. Data Model ✅
**File:** `apps/web/src/types/canvas.ts`

The `Layer` interface includes the `visible` boolean property:
```typescript
export interface Layer {
  id: string;
  name: string;
  parentId: string | null;
  visible: boolean;  // ✅ Used for show/hide functionality
  locked: boolean;
  x: number;
  y: number;
  buffer: Buffer;
}
```

Layers are created with `visible: true` by default via the `createLayer()` function.

### 2. Store Actions ✅
**File:** `apps/web/src/stores/canvas-store.ts`

The `toggleLayerVisibility` function is implemented:
```typescript
toggleLayerVisibility: (layerId: string) => {
  const { document } = get();
  if (!document) return;

  set({
    document: {
      ...document,
      layers: document.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
      updatedAt: Date.now(),
    },
  });
}
```

### 3. UI Controls ✅
**File:** `apps/web/src/components/LayerPanel.tsx`

Each layer has an eye icon toggle button:
- **Eye icon (visible):** Shows when layer is visible
- **Eye with slash (hidden):** Shows when layer is hidden
- Button includes proper ARIA labels and test IDs
- Visual indicator: Hidden layers have 50% opacity in the panel

```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    toggleLayerVisibility(layer.id);
  }}
  className={`w-6 h-6 flex items-center justify-center hover:bg-accent rounded transition-colors ${
    layer.visible ? 'text-foreground' : 'text-muted-foreground'
  }`}
  title={layer.visible ? 'Hide layer' : 'Show layer'}
  aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
  data-testid={`visibility-toggle-${layer.id}`}
>
  {/* SVG eye icons */}
</button>
```

The layer row itself shows visual feedback:
```tsx
className={`... ${!layer.visible ? 'opacity-50' : ''}`}
```

### 4. Canvas Compositing ✅
**File:** `apps/web/src/components/Canvas.tsx`

The `getCellChar` function filters out hidden layers during compositing:
```typescript
const getCellChar = (col: number, row: number): string => {
  // Composite visible layers from bottom to top
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (!layer.visible) continue;  // ✅ Skip hidden layers
    
    const index = row * layer.buffer.width + col;
    const charCode = layer.buffer.chars[index];
    
    if (charCode !== 0) {
      return String.fromCharCode(charCode);
    }
  }
  return ' ';
};
```

### 5. Export Functionality ✅
**File:** `apps/web/src/lib/export.ts`

The `compositeBuffers` function excludes hidden layers from export:
```typescript
export function compositeBuffers(layers: Layer[], width: number, height: number): Buffer {
  const result: Buffer = { /* ... */ };

  // Composite layers in order
  for (const layer of layers) {
    if (!layer.visible) continue;  // ✅ Skip hidden layers
    
    // ... compositing logic
  }

  return result;
}
```

All export functions (`exportAsPlainText`, `exportAsMarkdown`, `exportAsHTML`) use `compositeBuffers`, ensuring hidden layers are excluded.

### 6. Visual Feedback ✅

The LayerPanel shows a visibility counter:
```tsx
<div className="mt-2 text-xs text-muted-foreground text-center">
  {document.layers.filter(l => l.visible).length} of {document.layers.length} layers visible
</div>
```

### 7. Test Coverage ✅
**File:** `apps/web/src/stores/canvas-store-visibility.test.ts`

Comprehensive test suite with 8 passing tests:
1. ✅ Layers created with `visible=true` by default
2. ✅ Toggle visibility from true to false
3. ✅ Toggle visibility back from false to true
4. ✅ Filter hidden layers from visible layers list
5. ✅ Preserve visibility state when reordering layers
6. ✅ Update document timestamp when toggling visibility
7. ✅ Handle toggling with no document (no-op)
8. ✅ Toggling one layer doesn't affect other layers

## Validation Results

### Tests: ✅ PASSING
```
✓ src/stores/canvas-store-visibility.test.ts (8 tests) 5ms
✓ src/lib/export.test.ts (13 tests) 5ms
✓ src/stores/canvas-store.test.ts (53 tests) 31ms

Test Files  10 passed (10)
     Tests  113 passed (113)
```

### Build: ✅ SUCCESS
```
web:build:  ✓ Compiled successfully in 1562ms
web:build:  ✓ Generating static pages (14/14)

Tasks:    3 successful, 3 total
```

## Requirements Checklist

- ✅ Eye icon toggle per layer
- ✅ Hidden layers excluded from compositing
- ✅ Hidden layers excluded from export
- ✅ Visual indicator for hidden state (50% opacity)
- ✅ Visibility counter in layer panel
- ✅ Proper default state (visible: true)
- ✅ State persistence across reordering
- ✅ Comprehensive test coverage
- ✅ Type safety maintained
- ✅ Zero compilation errors

## Summary

F015 (Show/Hide Layers) is **fully implemented** and **production-ready**. The feature includes:
- Complete data model support
- Full UI implementation with proper accessibility
- Correct compositing behavior
- Export functionality that respects visibility
- Comprehensive test coverage
- Visual feedback for users

No additional work is required for this feature.

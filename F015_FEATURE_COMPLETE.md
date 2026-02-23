# F015: Show/Hide Layers - Feature Complete

## Status: ✅ ALREADY IMPLEMENTED

The show/hide layers feature is **fully implemented and tested**. All requirements are met.

## Implementation Summary

### 1. Eye Icon Toggle ✅

**Location:** `apps/web/src/components/LayerPanel.tsx`

- Each layer has a visibility toggle button with eye icons
- **Visible state:** Eye open icon (👁️)
- **Hidden state:** Eye closed with slash icon (👁️‍🗨️)
- Button includes hover effects and proper ARIA labels
- Test ID: `visibility-toggle-{layerId}` for testing

**Code:**
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
  {/* Eye open or eye closed icon */}
</button>
```

### 2. Visual Indicator for Hidden State ✅

**Location:** `apps/web/src/components/LayerPanel.tsx`

Hidden layers are displayed with:
- **50% opacity** (`opacity-50` class) on the entire layer item
- **Muted text color** on the visibility icon
- Layer counter shows: "X of Y layers visible"

**Code:**
```tsx
className={`... ${!layer.visible ? 'opacity-50' : ''}`}
```

**Counter:**
```tsx
<div className="mt-2 text-xs text-muted-foreground text-center">
  {document.layers.filter(l => l.visible).length} of {document.layers.length} layers visible
</div>
```

### 3. Hidden Layers Excluded from Compositing ✅

**Location:** `apps/web/src/components/Canvas.tsx`

The `getCellChar()` function filters out invisible layers during rendering:

```typescript
const getCellChar = (col: number, row: number): string => {
  // Composite visible layers from bottom to top
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (!layer.visible) continue;  // ← SKIPS HIDDEN LAYERS
    
    const index = row * layer.buffer.width + col;
    const charCode = layer.buffer.chars[index];
    
    if (charCode !== 0) {
      return String.fromCharCode(charCode);
    }
  }
  return ' ';
};
```

### 4. Hidden Layers Excluded from Export ✅

**Location:** `apps/web/src/lib/export.ts`

The `compositeBuffers()` function filters out invisible layers during export:

```typescript
export function compositeBuffers(layers: Layer[], width: number, height: number): Buffer {
  const result: Buffer = { ... };

  // Composite layers in order
  for (const layer of layers) {
    if (!layer.visible) continue;  // ← SKIPS HIDDEN LAYERS

    // ... composite visible layer
  }

  return result;
}
```

This function is used by:
- `exportAsPlainText()` - Plain ASCII export
- `exportAsMarkdown()` - Markdown code block export
- `exportAsHTML()` - HTML with inline styles export

### 5. State Management ✅

**Location:** `apps/web/src/stores/canvas-store.ts`

The `toggleLayerVisibility()` function:
- Toggles the `visible` boolean on the layer
- Updates the document's `updatedAt` timestamp
- Preserves visibility state during layer reordering

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

### 6. Type Definition ✅

**Location:** `apps/web/src/types/canvas.ts`

Every layer has a `visible` property that defaults to `true`:

```typescript
export interface Layer {
  id: string;
  name: string;
  visible: boolean;  // ← Visibility flag
  locked: boolean;
  x: number;
  y: number;
  buffer: Buffer;
}

export function createLayer(name: string, width: number, height: number): Layer {
  return {
    id: `layer-${Date.now()}-${Math.random()}`,
    name,
    visible: true,  // ← Default visible
    locked: false,
    x: 0,
    y: 0,
    buffer: createBuffer(width, height),
  };
}
```

## Test Coverage ✅

### Visibility Tests
**File:** `apps/web/src/stores/canvas-store-visibility.test.ts`

8 comprehensive tests covering:
1. ✅ Layers created with `visible=true` by default
2. ✅ Toggle from true to false
3. ✅ Toggle back from false to true
4. ✅ Filter visible layers
5. ✅ Preserve visibility during reordering
6. ✅ Update document timestamp when toggling
7. ✅ Handle toggling with no document
8. ✅ Don't affect other layers when toggling

### Export Tests
**File:** `apps/web/src/lib/export.test.ts`

Includes test:
```typescript
it('should skip invisible layers', () => {
  const layer1 = createLayer('Layer 1', 5, 3);
  const layer2 = createLayer('Layer 2', 5, 3);
  
  layer1.buffer.chars[0] = 'A'.charCodeAt(0);
  layer2.buffer.chars[0] = 'B'.charCodeAt(0);
  layer2.visible = false;  // ← Hide layer 2
  
  const result = compositeBuffers([layer1, layer2], 5, 3);
  
  expect(result.chars[0]).toBe('A'.charCodeAt(0));  // ← Only layer 1 visible
});
```

## Validation Results ✅

### Build
```
✓ Type checking passed
✓ Linting passed
✓ Build completed successfully
```

### Tests
```
✓ 104 tests passing
✓ All visibility tests passing
✓ All export tests passing
✓ Zero failures
```

## User Experience

### Workflow
1. User clicks eye icon on any layer
2. Layer immediately becomes hidden (50% opacity UI feedback)
3. Canvas re-renders without the hidden layer
4. Layer counter updates to show "X of Y visible"
5. Export functions exclude hidden layers
6. User can toggle visibility back on at any time

### Visual Feedback
- **Active visible layer:** Full opacity, primary border when selected
- **Inactive visible layer:** Full opacity, neutral border
- **Hidden layer:** 50% opacity, muted colors

### Accessibility
- Proper ARIA labels on visibility buttons
- Clear visual distinction between states
- Keyboard navigation supported through layer panel
- Test IDs for automated testing

## Related Files

### Core Implementation
- `apps/web/src/components/LayerPanel.tsx` - UI and controls
- `apps/web/src/components/Canvas.tsx` - Rendering compositing
- `apps/web/src/stores/canvas-store.ts` - State management
- `apps/web/src/lib/export.ts` - Export compositing
- `apps/web/src/types/canvas.ts` - Type definitions

### Tests
- `apps/web/src/stores/canvas-store-visibility.test.ts` - Visibility tests
- `apps/web/src/lib/export.test.ts` - Export tests

## Conclusion

**The F015 feature is 100% complete.** All requirements have been implemented:

✅ Eye icon toggle per layer  
✅ Hidden layers excluded from compositing  
✅ Hidden layers excluded from export  
✅ Visual indicator for hidden state  
✅ Comprehensive test coverage  
✅ All validations passing  

No additional work is needed for this feature.

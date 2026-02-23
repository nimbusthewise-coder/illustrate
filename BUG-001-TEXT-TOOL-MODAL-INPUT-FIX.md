# BUG-001: Text Tool Modal Input Fix

## Problem
Text tool input was not modal. Typing "Hello World" triggered tool shortcuts (e.g. `e` activated Eraser, `b` activated Box tool).

## Solution Implemented

### 1. Added `isInputActive` flag to tool-store.ts
```typescript
interface ToolState {
  // ... other properties
  isInputActive: boolean;  // Modal input flag - prevents tool shortcuts while typing
  textCursor: TextCursor | null;
  
  // Actions
  setInputActive: (active: boolean) => void;
  setTextCursor: (cursor: TextCursor | null) => void;
  exitTextMode: () => void;
}
```

### 2. Updated useKeyboardShortcuts.ts
- Added check for `isInputActive` before processing tool shortcuts
- ESCAPE key exits text input mode
- Shortcuts suppressed when typing in HTML input/textarea elements
- Shortcuts suppressed when `isInputActive` is true

```typescript
// BUG-001 FIX: If modal input is active (e.g., text tool typing),
// suppress all tool-switching shortcuts
if (isInputActive) {
  return;
}
```

### 3. Implemented Text Tool in Canvas.tsx
- Click to place cursor
- Keyboard input to write characters
- Arrow keys navigate cursor
- Backspace deletes previous character
- Enter moves to next line
- Cursor position highlighted with white background
- Setting textCursor visible automatically activates `isInputActive`

### 4. Added writeChar method to canvas-store.ts
```typescript
writeChar: (layerId: string, col: number, row: number, char: string, fg?: number, bg?: number) => void
```

### 5. Comprehensive Tests
Created `useKeyboardShortcuts.test.ts` with 7 test cases:
- ✓ Switch tools with shortcuts when NOT in input mode
- ✓ Do NOT switch tools when text tool is in input mode
- ✓ Do NOT swap colours when in input mode
- ✓ Exit input mode when ESCAPE is pressed
- ✓ Re-enable shortcuts after exiting input mode
- ✓ Ignore shortcuts when typing in HTML input elements
- ✓ Accept all letter keys in text input mode without switching tools

## Files Modified

1. `apps/web/src/stores/tool-store.ts` - Added isInputActive state
2. `apps/web/src/hooks/useKeyboardShortcuts.ts` - Added modal input suppression
3. `apps/web/src/components/Canvas.tsx` - Implemented text tool
4. `apps/web/src/stores/canvas-store.ts` - Added writeChar method
5. `apps/web/src/hooks/useKeyboardShortcuts.test.ts` - Created comprehensive tests
6. `apps/web/vitest.config.ts` - Changed environment to jsdom
7. `apps/web/src/components/KeyboardHandler.tsx` - Fixed type errors

## Validation Results

### Type Checking
```bash
cd apps/web && npx tsc --noEmit
# ✓ No errors
```

### Tests
```bash
cd apps/web && pnpm test
# ✓ All 55 tests passed (including 7 BUG-001 specific tests)
```

## Acceptance Criteria

- [x] Typing in text tool does not trigger tool shortcuts
- [x] ESCAPE exits text input mode and re-enables shortcuts
- [x] Other tools remain unaffected
- [x] Unit test: keypress 'e' while text tool active → character inserted, not eraser activated

## Usage

1. Press `T` to activate text tool
2. Click on canvas to place cursor
3. Type characters - they appear in the grid
4. Use arrow keys to navigate
5. Press ESCAPE to exit text input mode
6. Tool shortcuts work again

## Technical Details

### Modal Input Flow

1. User presses `T` → Text tool activated
2. User clicks on canvas → `setTextCursor({ col, row, visible: true })`
3. `setTextCursor` automatically sets `isInputActive = true`
4. Keyboard shortcuts check `isInputActive` and are suppressed
5. User types → characters inserted via `writeChar`
6. User presses ESCAPE → `exitTextMode()` called
7. `isInputActive = false`, `textCursor = null`
8. Shortcuts re-enabled

### Text Input Handling

- Printable characters: Insert at cursor, advance cursor
- Arrow keys: Navigate cursor position
- Backspace: Delete previous character, move cursor back
- Enter: Move to start of next line
- ESCAPE: Exit text input mode

## Known Limitations

- Multi-line text wraps at canvas boundary
- No text selection or editing (future enhancement)
- No undo for text input (global undo system needed)
- Text uses default foreground/background colors

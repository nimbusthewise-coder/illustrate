# Keyboard Shortcuts System

Comprehensive keyboard shortcuts system for the illustrate.md application.

## Quick Start

### 1. Basic Usage

```tsx
import { useShortcut } from '@/hooks/useShortcuts';

function MyComponent() {
  useShortcut(
    ['s'],
    () => handleSave(),
    {
      modifiers: ['ctrl'],
      description: 'Save document',
      scope: 'global',
    }
  );
}
```

### 2. Multiple Shortcuts

```tsx
import { useShortcuts } from '@/hooks/useShortcuts';

function MyComponent() {
  useShortcuts([
    {
      keys: ['z'],
      modifiers: ['ctrl'],
      description: 'Undo',
      action: () => undo(),
    },
    {
      keys: ['y'],
      modifiers: ['ctrl'],
      description: 'Redo',
      action: () => redo(),
    },
  ], { scope: 'canvas' });
}
```

### 3. Scope Management

```tsx
import { useShortcutScope } from '@/hooks/useShortcuts';

function CanvasView() {
  // Activate canvas shortcuts
  useShortcutScope('canvas');
  return <Canvas />;
}
```

### 4. Visual Hints

```tsx
import { ShortcutHint } from '@/components/shortcuts/ShortcutHint';

<button>
  Save <ShortcutHint keys={['s']} modifiers={['ctrl']} />
</button>
```

## Architecture

```
lib/shortcuts/
├── types.ts              # Type definitions
├── ShortcutManager.ts    # Core manager (singleton)
├── defaultShortcuts.ts   # 40+ default shortcuts
└── README.md            # This file

hooks/
└── useShortcuts.ts      # React hooks

components/
├── providers/
│   └── ShortcutProvider.tsx    # App-level provider
└── shortcuts/
    ├── ShortcutHelpModal.tsx   # Shift+? help modal
    ├── ShortcutCustomizer.tsx  # Settings UI
    ├── ShortcutHint.tsx        # Visual hints
    └── ShortcutDemo.tsx        # Example usage

lib/storage/
└── shortcutPreferences.ts  # localStorage persistence
```

## Scopes

- **global**: Always active (save, undo, redo)
- **canvas**: Active in canvas view (tools, delete)
- **library**: Active in component library
- **settings**: Active in settings pages

## API Reference

### Hooks

#### `useShortcut(keys, action, options?)`
Register a single keyboard shortcut.

```tsx
useShortcut(['s'], handleSave, {
  modifiers: ['ctrl'],
  description: 'Save',
  scope: 'global',
  preventDefault: true,
});
```

#### `useShortcuts(shortcuts, options?)`
Register multiple keyboard shortcuts.

```tsx
useShortcuts([
  { keys: ['1'], action: selectTool1, description: 'Tool 1' },
  { keys: ['2'], action: selectTool2, description: 'Tool 2' },
], { scope: 'canvas' });
```

#### `useShortcutScope(scope)`
Set the active scope for the component.

```tsx
useShortcutScope('canvas'); // or ['canvas', 'global']
```

#### `useShortcutsEnabled(enabled)`
Enable/disable shortcuts globally.

```tsx
useShortcutsEnabled(isEditing);
```

#### `useShortcutListener(callback)`
Listen for any shortcut execution.

```tsx
useShortcutListener((event) => {
  console.log('Shortcut executed:', event.key);
});
```

### ShortcutManager

```tsx
import { getShortcutManager } from '@/lib/shortcuts/ShortcutManager';

const manager = getShortcutManager();

// Register shortcut
manager.register({
  id: 'my-shortcut',
  keys: ['a'],
  modifiers: ['ctrl'],
  description: 'My action',
  scope: 'global',
  action: () => console.log('Action!'),
});

// Unregister
manager.unregister('global', ['a'], ['ctrl']);

// Check conflicts
const conflict = manager.checkConflict({
  id: 'new-shortcut',
  keys: ['a'],
  modifiers: ['ctrl'],
  scope: 'global',
  category: 'system',
  description: 'New action',
});

// Get all shortcuts
const shortcuts = manager.getShortcuts('canvas');

// Format for display
const formatted = ShortcutManager.formatKeyCombo(['s'], ['ctrl']);
// Returns: "Ctrl+S" (Windows) or "⌘S" (Mac)
```

## Default Shortcuts

See [`defaultShortcuts.ts`](./defaultShortcuts.ts) for the complete list.

### Categories
- **System**: Save, open, settings, help
- **Editing**: Undo, redo, copy, paste, delete
- **Canvas**: Clear, resize, export, grid
- **Navigation**: Zoom, pan, fit to screen
- **Tools**: Select, text, draw, line, rectangle
- **Layers**: New, duplicate, delete, move, visibility
- **Components**: Library, create, edit

## Customization

Users can customize shortcuts in Settings → Shortcuts (`/settings/shortcuts`).

Custom bindings are stored in localStorage:
```json
{
  "customBindings": {
    "edit.undo": {
      "keys": ["z"],
      "modifiers": ["ctrl", "alt"]
    }
  },
  "disabledShortcuts": ["edit.redo"]
}
```

## Platform Support

- **Windows/Linux**: Uses Ctrl key
- **macOS**: Uses Command (⌘) key
- Automatically detects platform and adjusts display

## Conflict Detection

The system prevents conflicting shortcuts:

1. User attempts to set shortcut
2. System checks for conflicts in same scope
3. If conflict found, shows warning
4. User confirms or cancels

## Best Practices

### 1. Use Semantic Descriptions
```tsx
// Good
description: 'Delete selected component'

// Bad
description: 'Delete'
```

### 2. Choose Appropriate Scope
```tsx
// Canvas-specific action
scope: 'canvas'

// Available everywhere
scope: 'global'
```

### 3. Prevent Default When Needed
```tsx
// Override browser save dialog
preventDefault: true

// Allow default (e.g., for text input)
preventDefault: false
```

### 4. Use Common Conventions
- `Ctrl+Z` for undo
- `Ctrl+Y` or `Ctrl+Shift+Z` for redo
- `Delete` or `Backspace` for delete
- `Escape` for cancel/deselect

### 5. Add Visual Hints
```tsx
<button>
  Save {/* Show users the shortcut */}
  <ShortcutHint keys={['s']} modifiers={['ctrl']} />
</button>
```

## Testing

```bash
# Run unit tests
pnpm test

# Test specific file
pnpm test ShortcutManager.test.ts
```

## Troubleshooting

### Shortcuts Not Working

1. Check if ShortcutProvider is in app layout
2. Verify correct scope is active
3. Check browser console for errors
4. Ensure shortcuts aren't disabled in settings

### Conflicts with Browser Shortcuts

Some shortcuts cannot be overridden (e.g., `Ctrl+T` for new tab). Choose different combinations or use modifier keys.

### Custom Shortcuts Not Persisting

Check browser console for localStorage errors. Ensure storage is not full or blocked.

## Examples

See [`ShortcutDemo.tsx`](../../../components/shortcuts/ShortcutDemo.tsx) for a working example with counter and multiple shortcuts.

## Support

For issues or questions:
1. Check this documentation
2. Review implementation examples
3. Check test files for usage patterns
4. Open issue in project repository

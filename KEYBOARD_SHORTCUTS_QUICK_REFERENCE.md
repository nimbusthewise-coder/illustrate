# Keyboard Shortcuts - Quick Reference

## Tool Shortcuts (Adobe Photoshop Convention)

| Key | Tool | Icon | Description |
|-----|------|------|-------------|
| `V` | Select | ⌖ | Selection and move tool |
| `U` | Box | □ | Rectangle/box drawing |
| `L` | Line | / | Line drawing (H/V/45°) |
| `T` | Text | T | Text input tool |
| `E` | Eraser | ⌫ | Erase characters (1×1 or 3×3) |
| `F` | Fill | ▨ | Fill tool |

## Additional Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `X` | Swap Colors | Swap foreground/background colors |
| `ESC` | Exit Text Mode | Exit text input and re-enable shortcuts |

## Text Tool Behavior

### When Text Tool is Active

1. **Click on canvas** → Places cursor
2. **Type normally** → Characters appear (shortcuts disabled)
3. **Arrow keys** → Move cursor
4. **Backspace** → Delete previous character
5. **Enter** → Move to next line
6. **ESC** → Exit text mode (shortcuts re-enabled)

### Modal Input Protection

While typing in the text tool:
- ✅ All letters inserted as characters
- ❌ Shortcuts do NOT activate
- ✅ Press ESC to exit and use shortcuts again

**Example**: Typing "Hello World"
- `H` → inserts "H" (not any shortcut)
- `e` → inserts "e" (NOT Eraser tool)
- `l` → inserts "l" (NOT Line tool)
- `l` → inserts "l"
- `o` → inserts "o"
- ` ` → inserts space
- `W` → inserts "W"
- ...and so on

## Tips

### General Usage
- Shortcuts are **case-insensitive** (V or v both work)
- Shortcuts **don't interfere** with Cmd/Ctrl combinations
- Shortcuts **don't work** in form input fields (by design)

### Efficient Workflow
1. Press tool shortcut (e.g., `T` for text)
2. Perform action (e.g., type text)
3. Press `ESC` if needed to exit modal mode
4. Press next tool shortcut (e.g., `V` for select)

### Visual Feedback
- Active tool is **highlighted** in the toolbar
- Shortcut keys shown in **tooltips** (hover over tool buttons)
- Tool name and shortcut visible in toolbar

## Troubleshooting

### "Shortcuts not working"
- ✅ Check if you're in text input mode (ESC to exit)
- ✅ Make sure focus is not in a form field
- ✅ Check if you're holding Cmd/Ctrl (release modifiers)

### "Typing triggers tools"
- ❌ This is BUG-001 and has been fixed
- ✅ Text cursor should disable shortcuts automatically
- ✅ If still happening, press ESC and try again

### "Can't type in text tool"
- ✅ Make sure you clicked on canvas to place cursor
- ✅ Look for cursor highlight on grid cell
- ✅ Try clicking again or press ESC and restart

## Developer Notes

### Adding New Shortcuts

Edit `src/hooks/useKeyboardShortcuts.ts`:

```typescript
const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: 'select',
  u: 'box',
  l: 'line',
  t: 'text',
  e: 'eraser',
  f: 'fill',
  // Add your new tool here:
  m: 'marquee',  // Example
};
```

### Using Modal Input in Custom Tools

```typescript
const { setInputActive } = useToolStore();

// When tool needs exclusive keyboard input
setInputActive(true);

// When done
setInputActive(false);
```

### State Management

```typescript
// Get current state
const { currentTool, isInputActive } = useToolStore();

// Check if shortcuts are active
const shortcutsActive = !isInputActive;
```

---

*For full documentation, see `F052_KEYBOARD_SHORTCUTS_IMPLEMENTATION.md`*

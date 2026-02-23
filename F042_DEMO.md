# F042: Markdown Code Block Export - Demonstration

## Feature Overview

**Feature ID:** F042
**Description:** Export canvas as markdown code block with triple backticks
**Priority:** P0
**Status:** ✅ COMPLETE

## Implementation

The feature is implemented in `packages/core/src/export.ts`:

```typescript
/**
 * Export to markdown code block (F042)
 */
export function exportToMarkdown(document: CanvasDocument, language: string = 'ascii'): string {
  const ascii = exportToPlainASCII(document);
  return `\`\`\`${language}\n${ascii}\n\`\`\``;
}
```

## Acceptance Criteria ✅

- ✅ Wrapped in triple backticks
- ✅ Language hint optional (defaults to `ascii`)
- ✅ Copy-ready for pasting into .md files

## Usage Example

```typescript
import { exportToMarkdown } from '@illustrate.md/core';

// Export with default language hint ('ascii')
const markdown1 = exportToMarkdown(document);
// Output: ```ascii\n...\n```

// Export with custom language hint
const markdown2 = exportToMarkdown(document, 'text');
// Output: ```text\n...\n```
```

## Test Coverage

The feature is fully tested in `packages/core/src/export.test.ts`:

1. **Test 1:** Wraps ASCII in markdown code fence with default language hint
   ```typescript
   it('wraps ASCII in markdown code fence', () => {
     const result = exportToMarkdown(doc);
     expect(result).toBe('```ascii\nHello\n\n```');
   });
   ```

2. **Test 2:** Supports custom language hint
   ```typescript
   it('supports custom language hint', () => {
     const result = exportToMarkdown(doc, 'text');
     expect(result).toContain('```text');
   });
   ```

## Example Output

Given a simple diagram with a box:

```ascii
┌────┐
│    │
└────┘
```

The `exportToMarkdown()` function produces:

````markdown
```ascii
┌────┐
│    │
└────┘
```
````

This output can be directly pasted into:
- GitHub README.md files
- Notion pages
- Linear comments
- Any markdown editor

## Validation Results

### Build Status ✅
```bash
pnpm build
# ✓ Compiled successfully
```

### Test Status ✅
```bash
pnpm test
# Test Files  2 passed (2)
# Tests  27 passed (27)
```

All F042 tests pass:
- ✅ Wraps ASCII in markdown code fence
- ✅ Supports custom language hint

## Integration with F041

F042 builds on top of F041 (Plain ASCII export):
1. F041's `exportToPlainASCII()` generates the ASCII content
2. F042's `exportToMarkdown()` wraps it in markdown code fence

This ensures:
- Consistent ASCII output across both formats
- Minimal code duplication
- Easy to maintain

## Dependencies

- **Depends on:** F041 (Plain ASCII text export)
- **Required by:** User-facing export features in web app

## Future Enhancements

Potential improvements for later phases:
- Auto-detect best language hint based on content
- Support for syntax highlighting hints
- Custom fence characters (e.g., ~~~)
- Export with metadata comments

---

**Status:** ✅ Complete and validated
**Phase:** Phase 1 (Foundation)
**Date:** 2026-02-23

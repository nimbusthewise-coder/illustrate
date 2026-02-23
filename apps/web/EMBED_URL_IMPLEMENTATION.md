# Embed URL Implementation (F029)

## Overview

This document describes the implementation of **F029: Unique persistent embed URL per diagram** from the PRD.

## Feature Requirements

- Every saved diagram gets a `/{username}/{id}` URL
- URL is stable across edits (the ID doesn't change when the document is updated)
- URL resolves to diagram content
- Dependencies: F046 (Auth), F047 (Username), F050 (Cloud persistence)

## Implementation

### 1. Route Structure

The embed URL follows the pattern: `/{username}/{id}`

Example: `https://illustrate.md/alice/abc123`

This route is implemented in Next.js App Router at:
- `apps/web/src/app/[username]/[id]/page.tsx` - Main embed page
- `apps/web/src/app/[username]/[id]/not-found.tsx` - Custom 404 page with ASCII art

### 2. URL Resolution Flow

1. User navigates to `/{username}/{id}`
2. Server-side page component:
   - Looks up the user by username
   - Finds the document by ID that belongs to that user
   - Checks if the document is public (private documents show a "Private Diagram" message)
   - Renders the diagram using the `EmbedDiagramView` component

### 3. Components

#### `EmbedDiagramView` (`apps/web/src/components/EmbedDiagramView.tsx`)

A read-only canvas display component that:
- Composites all visible layers from the document
- Renders the diagram in a terminal-style monospace grid
- Shows document metadata (title, username, dimensions)
- Includes attribution footer

Key differences from the main `Canvas` component:
- Read-only (no editing tools)
- Simplified rendering (no tool overlays, cursors, or interactive features)
- Optimized for embedding and sharing

#### Custom 404 Page

ASCII art 404 page for missing diagrams:
```
╔══════════════════════════════╗
║                              ║
║         404 Not Found        ║
║                              ║
║    ┌─────────┐               ║
║    │ ? ? ? ? │               ║
║    │ ? ? ? ? │               ║
║    │ ? ? ? ? │               ║
║    └─────────┘               ║
║                              ║
║   Diagram not found          ║
║                              ║
╚══════════════════════════════╝
```

### 4. Server Action: `getEmbedUrl`

Location: `apps/web/src/app/actions/document-actions.ts`

This server action generates the embed URL for a diagram:

```typescript
const result = await getEmbedUrl({
  userId: 'user123',
  documentId: 'doc456'
});

// Returns: { success: true, data: { url: 'https://illustrate.md/alice/doc456' } }
```

Features:
- Validates that the user has a username
- Verifies document ownership
- Constructs the URL using `NEXT_PUBLIC_APP_URL` environment variable
- Returns error if user lacks username or document doesn't exist

### 5. URL Stability

The URL is stable across edits because:
- Document ID is a CUID generated once at creation time
- Username is immutable (per PRD decision)
- Updates to document content don't change the ID

This means:
1. Save a diagram → Get URL `/{username}/{id}`
2. Edit and save the diagram → Same URL still works
3. URL can be embedded in READMEs, docs, etc. without breaking

### 6. Privacy Controls

- **Public diagrams**: Accessible to anyone via the embed URL
- **Private diagrams**: Show a "Private Diagram" message when accessed
- **Future enhancement**: Authenticated users who own the diagram should be able to view their private diagrams (marked as TODO in code)

## Database Schema

The implementation relies on these Prisma models:

```prisma
model User {
  id       String  @id @default(cuid())
  username String? @unique
  // ... other fields
  documents Document[]
}

model Document {
  id        String   @id @default(cuid())
  userId    String?
  title     String
  isPublic  Boolean  @default(false)
  data      Json     // Full CanvasDocument JSON
  // ... other fields
  user      User?    @relation(fields: [userId], references: [id])
}
```

## Testing

Test coverage includes:

1. **Page Route Tests** (`apps/web/src/app/[username]/[id]/page.test.ts`)
   - URL pattern validation
   - Username format validation
   - Document ID format validation
   - URL stability across edits

2. **Server Action Tests** (`apps/web/src/app/actions/document-actions.test.ts`)
   - Correct URL generation for valid users/documents
   - Error handling for missing username
   - Error handling for missing user
   - Error handling for missing document
   - URL stability verification

All tests pass: ✅ 104 tests passed

## Environment Variables

Required environment variable:

```env
NEXT_PUBLIC_APP_URL=https://illustrate.md
```

This is used by `getEmbedUrl` to construct absolute URLs.

## Future Enhancements (Phase 3)

Per the PRD, Phase 3 will add:

- **F030**: SVG render endpoint (`/{username}/{id}.svg`)
- **F031**: PNG render endpoint (`/{username}/{id}.png`)
- **F032**: Plain ASCII text endpoint (`/{username}/{id}.txt`)
- **F033**: Living diagram updates (cache invalidation on save)
- **F034**: Versioned embed URLs (`/{username}/{id}@v2`)
- **F035**: Platform-specific rendering validation (GitHub, Notion, Linear)

## Usage Example

```typescript
// In your application
import { getEmbedUrl } from '@/app/actions/document-actions';

// After saving a document
const result = await getEmbedUrl({
  userId: session.user.id,
  documentId: document.id
});

if (result.success) {
  // result.data.url = 'https://illustrate.md/alice/abc123'
  // Copy to clipboard, show to user, etc.
}
```

## Files Created/Modified

### New Files
- `apps/web/src/app/[username]/[id]/page.tsx`
- `apps/web/src/app/[username]/[id]/not-found.tsx`
- `apps/web/src/app/[username]/[id]/page.test.ts`
- `apps/web/src/components/EmbedDiagramView.tsx`
- `apps/web/src/app/actions/document-actions.test.ts`
- `apps/web/EMBED_URL_IMPLEMENTATION.md` (this file)

### Modified Files
- `apps/web/src/app/actions/document-actions.ts` (added `getEmbedUrl` function)

## Acceptance Criteria ✅

- [x] Every saved diagram gets `/{username}/{id}` URL
- [x] URL is stable across edits
- [x] URL resolves to diagram content
- [x] Public diagrams are accessible
- [x] Private diagrams show appropriate message
- [x] Tests validate URL generation and stability
- [x] Build passes successfully
- [x] All existing tests continue to pass

# F034: Versioned / Pinned Embed URLs - Implementation Summary

## Overview

Implemented versioned embed URLs with the `/{username}/{id}@v{version}` syntax. Version numbers are auto-incremented on document save, pinned URLs never change, and version history is browsable.

## Changes Made

### 1. Database Schema Updates

**File:** `apps/web/prisma/schema.prisma`

- Added `currentVersion` field to `Document` model (default: 1, auto-incremented on save)
- Created new `DocumentVersion` model to store historical snapshots
- Added unique constraint on `documentId + version` to ensure version integrity
- Created appropriate indexes for performance

**Migration:** `apps/web/prisma/migrations/20260223190000_add_document_versioning/migration.sql`

### 2. Document Save Logic

**File:** `apps/web/src/app/actions/document-actions.ts`

**Updated `updateDocument` function:**
- Before updating document data, creates a snapshot in `DocumentVersion` table
- Stores: version number, title, width, height, data, tags, and timestamp
- Increments `currentVersion` field on the parent document
- Only creates version when actual data changes (not metadata-only updates)

**New functions:**
- `getVersionHistory(userId, documentId)` - Returns list of all versions with metadata
- `getDocumentVersion(userId, documentId, version)` - Retrieves specific version data

### 3. Embed URL Route Updates

**File:** `apps/web/src/app/api/embed/[id]/route.ts`

**New capabilities:**
- Parses version from URL using `@v{number}` syntax (e.g., `abc123@v2`)
- Also supports query parameter format: `?v=2`
- Fetches from `DocumentVersion` table when version is specified
- Falls back to current `Document` data when no version specified
- Returns version number in API response
- Implements aggressive caching for versioned URLs (immutable, s-maxage=3600)
- Lighter caching for latest version (s-maxage=60)

### 4. Public Embed Page Updates

**File:** `apps/web/src/app/[username]/[id]/page.tsx`

**New functionality:**
- Parses `@v{number}` syntax from URL path
- Fetches appropriate version from database
- Maintains same access control (public/private) as parent document
- Passes version number to view component for display

**File:** `apps/web/src/components/EmbedDiagramView.tsx`

- Added optional `version` prop
- Displays version indicator when viewing historical version
- Shows "(v2)" badge next to title
- Adds "Viewing historical version" subtitle

## URL Syntax Examples

### Latest Version
```
https://illustrate.md/{username}/{id}
https://illustrate.md/alice/abc123
```

### Specific Version
```
https://illustrate.md/{username}/{id}@v{number}
https://illustrate.md/alice/abc123@v1
https://illustrate.md/alice/abc123@v5
```

### API Endpoints
```
GET /api/embed/{id}           # Latest version
GET /api/embed/{id}@v2        # Version 2
GET /api/embed/{id}?v=2       # Version 2 (query param)
```

### Private Diagrams with Token
```
https://illustrate.md/alice/abc123@v2?token=xyz789
```

## Version Lifecycle

1. **Document Created** → Version 1 (currentVersion = 1, no DocumentVersion record yet)
2. **First Edit** → Creates DocumentVersion v1 snapshot, increments to v2
3. **Second Edit** → Creates DocumentVersion v2 snapshot, increments to v3
4. **Nth Edit** → Creates DocumentVersion v(n-1) snapshot, increments to vN

### Version Immutability

- Once created, a `DocumentVersion` record never changes
- `/{username}/{id}@v2` will always return exactly the same content
- Aggressive HTTP caching (1 hour) safe because versions are immutable
- Latest version URL (`/{username}/{id}`) continues to reflect most recent edits

## Database Structure

```prisma
model Document {
  id              String
  currentVersion  Int      @default(1)  // Auto-incremented on save
  // ... other fields
  versions        DocumentVersion[]
}

model DocumentVersion {
  id         String
  documentId String
  version    Int        // 1, 2, 3, ...
  title      String     // Snapshot of title at this version
  width      Int
  height     Int
  data       Json       // Complete canvas state
  tags       String[]
  createdAt  DateTime   // When this version was created
  
  @@unique([documentId, version])
}
```

## Cache Strategy

### Versioned URLs (Immutable)
```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
ETag: "{documentId}-v{version}"
```

### Latest Version (Mutable)
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
ETag: "{documentId}-{updatedAtTimestamp}"
Last-Modified: {updatedAt}
```

## Access Control

- Version access inherits parent document's `isPublic` setting
- If parent is public → all versions are public
- If parent is private → all versions require valid embed token
- Same token works for all versions of a document

## Testing

### Manual Testing Scenarios

1. **Create document** → Should be v1
2. **Edit document** → Should increment to v2, v1 snapshot created
3. **Access `/{username}/{id}`** → Should show latest version
4. **Access `/{username}/{id}@v1`** → Should show original content
5. **Edit again** → Should increment to v3
6. **Access `/{username}/{id}@v2`** → Should show second version
7. **Version history API** → Should list all versions with metadata

### API Response Format

```json
{
  "id": "abc123",
  "version": 2,
  "title": "My Diagram",
  "width": 80,
  "height": 40,
  "tags": ["wireframe"],
  "data": { /* canvas data */ },
  "author": "alice",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "embedUrl": "https://illustrate.md/alice/abc123@v2"
}
```

## Acceptance Criteria Met

- ✅ `/{username}/{id}@v2` syntax supported in URLs
- ✅ Version auto-incremented on save
- ✅ Pinned URLs never change (versions are immutable)
- ✅ Version history browsable via API (`getVersionHistory`)
- ✅ Both path-based (`@v2`) and query-param (`?v=2`) syntax work
- ✅ Versions inherit parent document access control
- ✅ Appropriate HTTP caching for versioned vs latest URLs

## Dependencies

- **F029** (Unique persistent embed URL) - ✅ Complete (base URL structure)
- **F050** (Cloud persistence) - ✅ Complete (document storage)

## Future Enhancements (Not in Scope)

- Version comparison / diff view
- Version rollback functionality
- Version labels/tags (e.g., "production", "staging")
- Version pruning/cleanup policies
- Version size optimization (delta storage)

## Files Modified

1. `apps/web/prisma/schema.prisma` - Schema changes
2. `apps/web/prisma/migrations/20260223190000_add_document_versioning/migration.sql` - Migration
3. `apps/web/src/app/actions/document-actions.ts` - Save logic & version APIs
4. `apps/web/src/app/api/embed/[id]/route.ts` - Versioned embed API
5. `apps/web/src/app/[username]/[id]/page.tsx` - Versioned public pages
6. `apps/web/src/components/EmbedDiagramView.tsx` - Version display

## Build Status

✅ Build successful
✅ Type checking passed (versioning-related code)
✅ Prisma client regenerated with new schema

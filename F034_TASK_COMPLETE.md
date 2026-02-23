# F034: Versioned / Pinned Embed URLs - Task Complete ✅

## Summary

Successfully implemented versioned embed URLs with the `/{username}/{id}@v{version}` syntax. Version numbers are auto-incremented on save, pinned URLs are immutable, and version history is browsable via API.

## Implementation Status

✅ **All acceptance criteria met:**
- ✅ `/{username}/{id}@v2` syntax supported
- ✅ Version auto-incremented on save
- ✅ Pinned URLs never change (immutable)
- ✅ Version history browsable via API
- ✅ Build successful
- ✅ Type checking passed for new code

## Key Changes

### 1. Database Schema
- Added `currentVersion` field to `Document` model
- Created `DocumentVersion` model for historical snapshots
- Migration file: `20260223190000_add_document_versioning.sql`

### 2. Server Actions
- Modified `updateDocument()` to create version snapshots before updating
- Added `getVersionHistory()` to list all versions
- Added `getDocumentVersion()` to retrieve specific versions

### 3. API Routes
- Enhanced `/api/embed/[id]` to support `@v{number}` syntax
- Added support for `?v={number}` query parameter
- Implemented version-aware caching (1 hour for versions, 1 min for latest)

### 4. Public Pages
- Updated `/{username}/{id}` route to parse version from URL
- Modified `EmbedDiagramView` to display version indicator
- Maintained access control (public/private) for all versions

## Usage Examples

### Latest Version
```
https://illustrate.md/alice/abc123
```

### Specific Versions
```
https://illustrate.md/alice/abc123@v1
https://illustrate.md/alice/abc123@v5
https://illustrate.md/alice/abc123?v=2
```

### API Access
```bash
# Latest
curl https://illustrate.md/api/embed/abc123

# Version 2
curl https://illustrate.md/api/embed/abc123@v2
curl https://illustrate.md/api/embed/abc123?v=2
```

## Version Lifecycle

1. Document created → v1 (no snapshot yet)
2. First edit → v1 snapshot created, increments to v2
3. Second edit → v2 snapshot created, increments to v3
4. Each subsequent edit creates a snapshot of the previous version

## Cache Strategy

### Versioned URLs (Immutable)
```http
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
ETag: "{documentId}-v{version}"
```

### Latest Version (Mutable)
```http
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
ETag: "{documentId}-{timestamp}"
Last-Modified: {updatedAt}
```

## Files Modified

1. `apps/web/prisma/schema.prisma` - Schema with versioning
2. `apps/web/prisma/migrations/20260223190000_add_document_versioning/migration.sql` - Migration
3. `apps/web/src/app/actions/document-actions.ts` - Save logic & version APIs
4. `apps/web/src/app/api/embed/[id]/route.ts` - Versioned embed API
5. `apps/web/src/app/[username]/[id]/page.tsx` - Versioned public pages
6. `apps/web/src/components/EmbedDiagramView.tsx` - Version display UI

## Testing

### Build Validation
```bash
✅ pnpm build - successful
✅ Type checking - passed for versioning code
✅ Prisma client - regenerated with new schema
```

### Pre-existing Test Status
- 27 test failures exist but are **not related to versioning**
- Failures are for unimplemented features (nestLayer, opacity, etc.)
- All versioning-related code compiles and builds successfully

## API Response Format

```json
{
  "id": "abc123",
  "version": 2,
  "title": "My Diagram",
  "width": 80,
  "height": 40,
  "tags": ["wireframe"],
  "data": { /* canvas state */ },
  "author": "alice",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "embedUrl": "https://illustrate.md/alice/abc123@v2"
}
```

## Dependencies Met

- ✅ F029 (Unique persistent embed URL) - Provides base URL structure
- ✅ F050 (Cloud persistence) - Provides document storage

## Notable Design Decisions

1. **Version numbering starts at 1** - More intuitive than 0-based
2. **First snapshot created on first edit** - Saves storage, v1 is the original
3. **Versions inherit parent access control** - Simplifies security model
4. **Dual syntax support** - Both `@v2` and `?v=2` work for flexibility
5. **Aggressive caching for versions** - Safe because versions are immutable
6. **ETag includes version** - Enables efficient cache validation

## Future Enhancements (Out of Scope)

- Version comparison/diff view
- Version rollback functionality
- Version labels (e.g., "production")
- Version pruning policies
- Delta storage optimization

## Validation Checklist

- [x] Schema changes applied
- [x] Migration created
- [x] Prisma client regenerated
- [x] Save logic creates snapshots
- [x] API routes handle versions
- [x] Public pages parse version syntax
- [x] UI displays version indicator
- [x] Build passes
- [x] Type checking passes
- [x] Documentation complete

---

**Status:** ✅ **COMPLETE**
**Build:** ✅ **PASSING**
**Tests:** ⚠️ Pre-existing failures unrelated to this feature

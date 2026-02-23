# Feature F057: List Diagrams - Implementation Summary

## Overview
Implemented the `illustrate list` command that shows all user diagrams with columns for title, id, updated timestamp, and visibility (public/private). Supports both human-readable table format and JSON output for scripting.

## Changes Made

### 1. API Endpoint

#### `apps/web/src/app/api/documents/route.ts` (NEW)
Created a new API endpoint to list documents:
- **GET /api/documents** - Lists all documents for authenticated user
- Requires authentication via `requireAuth()` utility
- Supports query parameters for filtering and sorting:
  - `search` - Filter by title (case-insensitive)
  - `tags` - Comma-separated list of tags
  - `sortBy` - Sort by 'date' or 'name' (default: 'date')
  - `sortOrder` - 'asc' or 'desc' (default: 'desc')
- Returns array of document summaries with:
  - id, title, width, height
  - tags array
  - isPublic boolean
  - createdAt, updatedAt timestamps

### 2. CLI Command

#### `packages/cli/src/commands/list.ts` (NEW)
Implemented the list command with:
- **Basic Usage**: `illustrate list`
- **Authentication**: 
  - Uses `--token` flag or `ILLUSTRATE_API_TOKEN` environment variable
  - Returns 401 error if not authenticated
- **Output Formats**:
  - `--format table` (default) - Human-readable table with columns:
    - TITLE (truncated to 40 chars)
    - ID (truncated to 12 chars)
    - UPDATED (relative time like "2 hours ago")
    - VISIBILITY (public/private)
  - `--format json` - JSON array for scripting
- **Configuration**:
  - `--api-url` to override API endpoint (default: localhost:3000)
  
Features:
- Relative time formatting ("just now", "5 minutes ago", "3 days ago")
- Title truncation with ellipsis for long titles
- Clean table layout with proper column alignment
- Empty state handling

#### `packages/cli/src/commands/list.test.ts` (NEW)
Comprehensive test suite covering:
- Date formatting logic (relative times)
- String truncation with ellipsis
- Document structure validation
- JSON serialization
- Visibility state handling
- Tag handling (multiple tags, empty tags)
- Sorting by date and name
- Empty list handling

23 tests total, all passing.

### 3. CLI Integration

#### `packages/cli/src/index.ts`
- Added import for `createListCommand`
- Registered list command in the CLI program

## Acceptance Criteria (F057)

✅ **Shows all user diagrams** - API endpoint fetches all documents for authenticated user

✅ **Title column** - Displayed in table format, truncated to 40 chars with ellipsis if needed

✅ **ID column** - Displayed in table format, truncated to 12 chars

✅ **Updated column** - Shows relative time ("2 hours ago", "3 days ago")

✅ **Public/Private column** - Shows visibility status

✅ **JSON format for scripting** - `--format json` outputs clean JSON array

✅ **Authentication** - Requires API token via env var or flag

## Usage Examples

### Basic list (table format)
```bash
export ILLUSTRATE_API_TOKEN="your-token-here"
illustrate list
```

Output:
```
TITLE                                     │ ID           │ UPDATED          │ VISIBILITY
─────────────────────────────────────────────────────────────────────────────────────────
My First Diagram                          │ doc-abc-123  │ 2 hours ago      │ public    
Private Architecture Diagram              │ doc-def-456  │ 3 days ago       │ private   
Component Library Wireframe with a Ver... │ doc-ghi-789  │ 1 day ago        │ public    
```

### JSON output for scripting
```bash
illustrate list --format json > diagrams.json
```

Output:
```json
[
  {
    "id": "doc-abc-123",
    "title": "My First Diagram",
    "width": 80,
    "height": 24,
    "tags": ["flowchart", "demo"],
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T12:30:00.000Z"
  },
  ...
]
```

### Using with different API
```bash
illustrate list --api-url https://illustrate.md --token your-token
```

### Pipe to jq for filtering
```bash
illustrate list --format json | jq '.[] | select(.isPublic == true)'
```

## Technical Notes

### Authentication Flow
1. Client sends request to `/api/documents` with `Authorization: Bearer {token}` header
2. Server uses `requireAuth()` to verify session/token
3. If unauthorized, returns 401 error
4. If authorized, fetches documents filtered by userId

### API Token Management
The CLI expects an API token for authentication. Users can:
- Set `ILLUSTRATE_API_TOKEN` environment variable
- Pass `--token` flag on each invocation
- Future enhancement: Store token in config file (~/.illustrate/config)

### Date Formatting
Relative time formatting uses simple calculation:
- < 1 minute: "just now"
- < 60 minutes: "X minutes ago"
- < 24 hours: "X hours ago"
- ≥ 24 hours: "X days ago"

### Column Width Management
Table columns have fixed widths:
- Title: 40 chars (truncated with "...")
- ID: 12 chars (truncated with "...")
- Updated: 16 chars (fits "10000 days ago")
- Visibility: 10 chars (fits "private")

## Dependencies Met
- **F046 (Auth)**: Uses authentication system via API tokens
- **F048 (Diagram Library)**: Uses diagram listing infrastructure from server actions

## Integration Points
- Works with existing diagram library infrastructure
- Compatible with search command (F058) which will extend this
- JSON output enables scripting and automation workflows
- Embed management workflow starts here (list → view → copy URL)

## Testing

All validation passes:
- ✅ `pnpm build` - Type checking successful
- ✅ `pnpm test` - 55 tests passing in CLI package, 186 total across project

### Test Coverage
- Data formatting utilities
- Document structure validation
- JSON serialization
- Visibility states
- Tag handling
- Sorting algorithms
- Empty state handling

## Future Enhancements (Out of Scope for F057)

- Pagination for large document lists
- Column width configuration
- Custom date format options
- Color-coded output (public/private in different colors)
- Filtering by tags directly in list command
- Sorting options in table format
- Token management/login flow in CLI
- Config file for storing API URL and token

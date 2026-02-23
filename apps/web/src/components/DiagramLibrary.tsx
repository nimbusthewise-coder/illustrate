'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listDocuments, deleteDocument } from '@/app/actions/document-actions';
import { formatDistanceToNow } from 'date-fns';

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name';
type SortOrder = 'asc' | 'desc';

interface Document {
  id: string;
  title: string;
  width: number;
  height: number;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DiagramLibraryProps {
  userId: string;
}

export function DiagramLibrary({ userId }: DiagramLibraryProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from documents
  const allTags = Array.from(
    new Set(documents.flatMap((doc) => doc.tags))
  ).sort();

  // Load documents
  const loadDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listDocuments(userId, {
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy,
        sortOrder,
      });

      if (result.success && result.data) {
        setDocuments(result.data);
      } else {
        setError(result.error || 'Failed to load documents');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load documents on mount and when filters change
  useEffect(() => {
    loadDocuments();
  }, [userId, searchQuery, selectedTags, sortBy, sortOrder]);

  // Handle document deletion
  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this diagram?')) {
      return;
    }

    const result = await deleteDocument({ userId, documentId });
    if (result.success) {
      loadDocuments();
    } else {
      alert(result.error || 'Failed to delete document');
    }
  };

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  // Handle sort toggle
  const handleSortToggle = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="space-y-4">
          {/* Search input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search by title
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagrams..."
              className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Filter by tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View and sort controls */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-4">
              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <button
                  onClick={() => handleSortToggle('date')}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === 'date'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortToggle('name')}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === 'name'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                aria-label="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                aria-label="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading diagrams...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-error/15 text-error border border-error/30 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && documents.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="text-muted-foreground mb-4">
            {searchQuery || selectedTags.length > 0
              ? 'No diagrams match your search criteria'
              : 'No diagrams yet'}
          </div>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Create your first diagram
          </a>
        </div>
      )}

      {/* Grid view */}
      {!loading && !error && documents.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={() => router.push(`/?doc=${doc.id}`)}
            >
              <h3 className="text-foreground font-semibold mb-2 truncate">
                {doc.title}
              </h3>
              <div className="text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>{doc.width}×{doc.height}</span>
                  {doc.isPublic && (
                    <span className="px-2 py-0.5 bg-info/15 text-info rounded text-xs">
                      Public
                    </span>
                  )}
                </div>
                <div>
                  Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                </div>
              </div>
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/?doc=${doc.id}`);
                  }}
                  className="flex-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
                >
                  Open
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  className="px-3 py-1 bg-error/15 text-error rounded text-sm hover:bg-error/25"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {!loading && !error && documents.length > 0 && viewMode === 'list' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                  Visibility
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/?doc=${doc.id}`)}
                >
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {doc.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {doc.width}×{doc.height}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.length > 0 ? (
                        doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    {doc.isPublic ? (
                      <span className="px-2 py-0.5 bg-info/15 text-info rounded text-xs">
                        Public
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                        Private
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/?doc=${doc.id}`);
                        }}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
                      >
                        Open
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="px-3 py-1 bg-error/15 text-error rounded text-sm hover:bg-error/25"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { formatDate } from '@/utils/diagramUtils';
import type { DiagramItem } from '@/stores/diagram-store';

interface DiagramCardProps {
  diagram: DiagramItem;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function DiagramCard({
  diagram,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: DiagramCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group cursor-pointer"
      onClick={() => onView(diagram.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView(diagram.id);
        }
      }}
      aria-label={`View diagram: ${diagram.name}`}
    >
      {/* Thumbnail preview */}
      <div className="bg-terminal p-3 h-36 overflow-hidden relative">
        <pre className="text-terminal-text text-[10px] leading-tight font-mono whitespace-pre overflow-hidden">
          {diagram.thumbnail || '(empty)'}
        </pre>
        {/* Favorite button */}
        <button
          className="absolute top-2 right-2 p-1 rounded bg-background/80 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(diagram.id);
          }}
          aria-label={diagram.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={diagram.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {diagram.isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Card content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground truncate" title={diagram.name}>
            {diagram.name}
          </h3>
          {diagram.isTemplate && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-info/15 text-info whitespace-nowrap">
              Template
            </span>
          )}
        </div>

        {diagram.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {diagram.description}
          </p>
        )}

        {/* Tags */}
        {diagram.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {diagram.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {diagram.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{diagram.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {diagram.width}×{diagram.height} · {diagram.layerCount} layer
            {diagram.layerCount !== 1 ? 's' : ''}
          </span>
          <span>{formatDate(diagram.updatedAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(diagram.id);
            }}
            aria-label="Edit diagram"
          >
            Edit
          </button>
          <button
            className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(diagram.id);
            }}
            aria-label="Duplicate diagram"
          >
            Duplicate
          </button>
          <button
            className="text-xs px-2 py-1 rounded bg-error/15 text-error hover:bg-error/25"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(diagram.id);
            }}
            aria-label="Delete diagram"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

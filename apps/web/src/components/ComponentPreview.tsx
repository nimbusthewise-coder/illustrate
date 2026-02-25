/**
 * ComponentPreview - Visual preview of a component definition
 * Renders component at thumbnail scale for library display
 */

'use client';

import { ComponentDefinition } from '@/types/component';

interface ComponentPreviewProps {
  component: ComponentDefinition;
  scale?: number; // Scale factor for preview (default 0.5)
  className?: string;
}

export function ComponentPreview({
  component,
  scale = 0.5,
  className = '',
}: ComponentPreviewProps) {
  const { boundingBox } = component;

  // Calculate preview dimensions
  const previewWidth = Math.max(boundingBox.width * scale, 20);
  const previewHeight = Math.max(boundingBox.height * scale, 10);

  return (
    <div
      className={`bg-terminal text-terminal-text border border-border rounded overflow-hidden ${className}`}
      style={{
        width: `${previewWidth}ch`,
        minWidth: '60px',
        minHeight: '40px',
      }}
    >
      <pre
        className="font-mono text-xs whitespace-pre p-1"
        style={{
          lineHeight: '1.25',
          fontSize: `${14 * scale}px`,
        }}
      >
        {component.charGrid && component.charGrid.length > 0
          ? component.charGrid.map(row => row.join('')).join('\n')
          : Array.from({ length: boundingBox.height })
              .map(() => '\u00A0'.repeat(boundingBox.width))
              .join('\n')}
      </pre>
    </div>
  );
}

/**
 * ComponentThumbnail - Small preview for grid display
 */
export function ComponentThumbnail({
  component,
  onClick,
  selected = false,
}: {
  component: ComponentDefinition;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col gap-2 p-3 rounded-lg border-2 transition-all
        ${
          selected
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted'
        }
      `}
      title={component.description || component.name}
    >
      <div className="flex items-center justify-center min-h-[60px]">
        <ComponentPreview component={component} scale={0.4} />
      </div>
      <div className="text-sm font-medium text-foreground truncate">
        {component.name}
      </div>
      {component.category && (
        <div className="text-xs text-muted-foreground truncate">
          {component.category}
        </div>
      )}
    </button>
  );
}

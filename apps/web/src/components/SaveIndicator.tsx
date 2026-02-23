'use client';

import { SaveStatus } from '@/hooks/use-cloud-persistence';
import { formatDistanceToNow } from 'date-fns';

interface SaveIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  isOnline: boolean;
  error: string | null;
  onManualSave?: () => void;
}

/**
 * Displays save status and provides manual save trigger
 */
export function SaveIndicator({
  status,
  lastSaved,
  isOnline,
  error,
  onManualSave,
}: SaveIndicatorProps) {
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: '⚠️',
        text: 'Offline',
        className: 'text-warning',
      };
    }

    switch (status) {
      case 'saving':
        return {
          icon: '💾',
          text: 'Saving...',
          className: 'text-muted-foreground',
        };
      case 'saved':
        return {
          icon: '✓',
          text: lastSaved
            ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
            : 'Saved',
          className: 'text-success',
        };
      case 'error':
        return {
          icon: '⚠️',
          text: error || 'Save failed',
          className: 'text-error',
        };
      default:
        return {
          icon: '○',
          text: lastSaved
            ? `Last saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
            : 'Not saved',
          className: 'text-muted-foreground',
        };
    }
  };

  const { icon, text, className } = getStatusDisplay();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-base">{icon}</span>
        <span>{text}</span>
      </div>
      
      {onManualSave && isOnline && status !== 'saving' && (
        <button
          onClick={onManualSave}
          className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          Save now
        </button>
      )}
    </div>
  );
}

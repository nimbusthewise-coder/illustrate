/**
 * Change Preview Component
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Displays a preview of proposed changes before applying them.
 */

'use client';

import React from 'react';
import { useConversationStore } from '@/stores/conversationStore';
import { summarizeChanges } from '@/utils/diffGenerator';
import type { FlowChange } from '@/types/conversation';

export function ChangePreview() {
  const { changePreview } = useConversationStore();

  if (!changePreview || !changePreview.visible) {
    return null;
  }

  const { changes, operation, onAccept, onReject } = changePreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Preview Changes
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {operation?.description || 'Review the proposed changes below'}
              </p>
            </div>
            <div className="px-3 py-1 bg-info/15 text-info text-xs font-medium rounded-full">
              {summarizeChanges(changes)}
            </div>
          </div>
        </div>

        {/* Changes List */}
        <div className="max-h-96 overflow-y-auto">
          {changes.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No changes to preview
            </div>
          ) : (
            <div className="divide-y divide-border">
              {changes.map((change) => (
                <ChangeItem key={change.id} change={change} />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border bg-muted flex items-center justify-between">
          <button
            onClick={onReject}
            className="px-4 py-2 text-muted-foreground hover:text-foreground bg-background
                       border border-border rounded-lg hover:border-primary/50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg
                       hover:opacity-90 transition-all font-medium"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual change item
 */
interface ChangeItemProps {
  change: FlowChange;
}

function ChangeItem({ change }: ChangeItemProps) {
  const getIcon = () => {
    switch (change.type) {
      case 'add':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'remove':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'modify':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
    }
  };

  const getColor = () => {
    switch (change.type) {
      case 'add':
        return 'text-success';
      case 'remove':
        return 'text-error';
      case 'modify':
        return 'text-warning';
    }
  };

  const getBgColor = () => {
    switch (change.type) {
      case 'add':
        return 'bg-success/10';
      case 'remove':
        return 'bg-error/10';
      case 'modify':
        return 'bg-warning/10';
    }
  };

  return (
    <div className="px-6 py-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-lg ${getBgColor()} ${getColor()}`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium uppercase ${getColor()}`}>
              {change.type}
            </span>
            <span className="text-xs text-muted-foreground">
              {change.target}
            </span>
          </div>
          <p className="text-sm text-foreground mt-1">
            {change.description}
          </p>

          {/* Show before/after if available */}
          {(change.before !== undefined || change.after !== undefined) && (
            <div className="mt-2 space-y-1">
              {change.before !== undefined && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Before: </span>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {String(getValuePreview(change.before))}
                  </code>
                </div>
              )}
              {change.after !== undefined && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">After: </span>
                  <code className="bg-background px-1 py-0.5 rounded">
                    {String(getValuePreview(change.after))}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get a preview of a value for display
 */
function getValuePreview(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > 50 ? value.substring(0, 47) + '...' : value;
  }
  
  if (typeof value === 'object' && value !== null) {
    const str = JSON.stringify(value);
    return str.length > 50 ? str.substring(0, 47) + '...' : str;
  }
  
  return String(value);
}

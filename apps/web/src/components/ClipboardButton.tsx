'use client';

/**
 * F045: Clipboard Button Component
 * 
 * A reusable button component for copying ASCII diagrams to clipboard
 * with loading states, error handling, and visual feedback.
 */

import { useState, useCallback, useEffect } from 'react';
import type { CanvasDocument, ClipboardOptions } from '@illustrate.md/core';
import { copyToClipboard } from '@illustrate.md/core';
import { createBrowserClipboard } from '@/utils/clipboard';

export interface ClipboardButtonProps {
  /**
   * The canvas document to copy
   */
  document: CanvasDocument;
  
  /**
   * Export options
   */
  options?: ClipboardOptions;
  
  /**
   * Button label (default: "Copy to Clipboard")
   */
  label?: string;
  
  /**
   * Success message (default: "Copied!")
   */
  successMessage?: string;
  
  /**
   * Show success message duration in ms (default: 2000)
   */
  successDuration?: number;
  
  /**
   * Custom class names
   */
  className?: string;
  
  /**
   * Callback when copy succeeds
   */
  onSuccess?: (content: string) => void;
  
  /**
   * Callback when copy fails
   */
  onError?: (error: string) => void;
  
  /**
   * Custom button content (overrides label)
   */
  children?: React.ReactNode;
}

type CopyState = 'idle' | 'copying' | 'success' | 'error';

/**
 * ClipboardButton component
 * 
 * Example usage:
 * ```tsx
 * <ClipboardButton 
 *   document={canvasDoc} 
 *   options={{ includeColors: true }}
 *   onSuccess={() => console.log('Copied!')}
 * />
 * ```
 */
export function ClipboardButton({
  document,
  options,
  label = 'Copy to Clipboard',
  successMessage = 'Copied!',
  successDuration = 2000,
  className = '',
  onSuccess,
  onError,
  children
}: ClipboardButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Reset success state after duration
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        setState('idle');
      }, successDuration);
      
      return () => clearTimeout(timer);
    }
  }, [state, successDuration]);
  
  const handleCopy = useCallback(async () => {
    // Prevent multiple simultaneous copies
    if (state === 'copying') {
      return;
    }
    
    setState('copying');
    setErrorMessage('');
    
    try {
      const adapter = createBrowserClipboard();
      const result = await copyToClipboard(document, adapter, options);
      
      if (result.success) {
        setState('success');
        if (onSuccess && result.content) {
          onSuccess(result.content);
        }
      } else {
        setState('error');
        const error = result.error || 'Failed to copy to clipboard';
        setErrorMessage(error);
        if (onError) {
          onError(error);
        }
      }
    } catch (error) {
      setState('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [document, options, state, onSuccess, onError]);
  
  // Keyboard shortcut: Cmd/Ctrl + C
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'c' && !event.shiftKey) {
        // Only trigger if no text is selected
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
          event.preventDefault();
          handleCopy();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy]);
  
  // Button text based on state
  const buttonText = (() => {
    switch (state) {
      case 'copying':
        return 'Copying...';
      case 'success':
        return successMessage;
      case 'error':
        return 'Failed';
      default:
        return label;
    }
  })();
  
  // Base styles with theme awareness
  const baseClasses = [
    'inline-flex items-center justify-center',
    'px-4 py-2',
    'rounded-md',
    'font-medium text-sm',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ].join(' ');
  
  // State-specific styles
  const stateClasses = (() => {
    switch (state) {
      case 'success':
        return 'bg-success text-white hover:bg-success/90 focus:ring-success';
      case 'error':
        return 'bg-error text-white hover:bg-error/90 focus:ring-error';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary';
    }
  })();
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleCopy}
        disabled={state === 'copying'}
        className={`${baseClasses} ${stateClasses} ${className}`}
        title={state === 'idle' ? 'Copy to clipboard (Ctrl/Cmd+C)' : undefined}
      >
        {children || (
          <>
            {/* Icon based on state */}
            {state === 'copying' && (
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {state === 'success' && (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {state === 'error' && (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {state === 'idle' && (
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span>{buttonText}</span>
          </>
        )}
      </button>
      
      {/* Error tooltip */}
      {state === 'error' && errorMessage && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-error text-white text-sm rounded shadow-lg z-10 whitespace-nowrap">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Simpler copy button without visual feedback (for icon-only buttons)
 */
export function CopyIcon({
  document,
  options,
  className = 'w-5 h-5',
  onSuccess,
  onError
}: Omit<ClipboardButtonProps, 'label' | 'successMessage' | 'successDuration' | 'children'>) {
  const handleCopy = async () => {
    try {
      const adapter = createBrowserClipboard();
      const result = await copyToClipboard(document, adapter, options);
      
      if (result.success && onSuccess && result.content) {
        onSuccess(result.content);
      } else if (!result.success && onError) {
        onError(result.error || 'Failed to copy');
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`hover:opacity-70 transition-opacity ${className}`}
      title="Copy to clipboard"
    >
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}

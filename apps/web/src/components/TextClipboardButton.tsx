/**
 * Simple text clipboard button
 * F029: Unique Persistent Embed URL per Diagram
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export interface TextClipboardButtonProps {
  text: string;
  className?: string;
  successMessage?: string;
  successDuration?: number;
}

export function TextClipboardButton({
  text,
  className = '',
  successMessage = 'Copied!',
  successDuration = 2000,
}: TextClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), successDuration);
      return () => clearTimeout(timer);
    }
  }, [copied, successDuration]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg
            className="w-4 h-4 inline mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {successMessage}
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 inline mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

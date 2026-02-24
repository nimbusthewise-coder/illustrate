/**
 * Shortcut Demo — F052: Keyboard Shortcuts System
 *
 * Example component demonstrating how to use shortcuts in different contexts.
 * This is for testing and documentation purposes.
 */

'use client';

import { useState } from 'react';
import { useShortcut, useShortcuts } from '@/hooks/useShortcuts';
import { ShortcutHint } from './ShortcutHint';

export function ShortcutDemo() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Press shortcuts to test');

  // Example 1: Single shortcut registration
  useShortcut(
    ['i'],
    () => {
      setCount((c) => c + 1);
      setMessage('Increment shortcut triggered!');
    },
    {
      description: 'Increment counter',
      scope: 'canvas',
    }
  );

  // Example 2: Multiple shortcuts registration
  useShortcuts(
    [
      {
        keys: ['d'],
        description: 'Decrement counter',
        action: () => {
          setCount((c) => c - 1);
          setMessage('Decrement shortcut triggered!');
        },
      },
      {
        keys: ['r'],
        description: 'Reset counter',
        action: () => {
          setCount(0);
          setMessage('Reset shortcut triggered!');
        },
      },
      {
        keys: ['m'],
        modifiers: ['ctrl'],
        description: 'Show message',
        action: () => {
          setMessage('Ctrl+M pressed!');
        },
      },
    ],
    { scope: 'canvas' }
  );

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Keyboard Shortcuts Demo
        </h1>
        <p className="text-muted-foreground">
          Test the keyboard shortcuts system with this demo
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="text-center">
          <div className="text-5xl font-bold text-foreground mb-2">
            {count}
          </div>
          <div className="text-sm text-muted-foreground">{message}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Available Shortcuts
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Increment</span>
                <ShortcutHint keys={['i']} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Decrement</span>
                <ShortcutHint keys={['d']} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reset</span>
                <ShortcutHint keys={['r']} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Message</span>
                <ShortcutHint keys={['m']} modifiers={['ctrl']} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Button Actions
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setCount((c) => c + 1);
                  setMessage('Button clicked: Increment');
                }}
                className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
              >
                Increment (I)
              </button>
              <button
                onClick={() => {
                  setCount((c) => c - 1);
                  setMessage('Button clicked: Decrement');
                }}
                className="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded transition-colors"
              >
                Decrement (D)
              </button>
              <button
                onClick={() => {
                  setCount(0);
                  setMessage('Button clicked: Reset');
                }}
                className="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded transition-colors"
              >
                Reset (R)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-info/10 border border-info/30 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> Press{' '}
          <ShortcutHint keys={['?']} modifiers={['shift']} className="mx-1" />{' '}
          to see all available keyboard shortcuts in the application.
        </p>
      </div>
    </div>
  );
}

/**
 * Prompt Input Component
 * F026: Prompt-to-Flow Generation
 * 
 * Text input interface for natural language flow descriptions.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useFlowGeneration } from '@/hooks/useFlowGeneration';

export interface PromptInputProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function PromptInput({
  className = '',
  placeholder = 'Describe the flow you want to create...',
  autoFocus = false,
}: PromptInputProps) {
  const { prompt, setPrompt, generate, isGenerating } = useFlowGeneration();
  const [localValue, setLocalValue] = useState(prompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local value with store
  useEffect(() => {
    setLocalValue(prompt);
  }, [prompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    setPrompt(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localValue.trim() && !isGenerating) {
      await generate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${className}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isGenerating}
          className="w-full min-h-[100px] max-h-[300px] px-4 py-3 
                     bg-background text-foreground
                     border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     resize-none"
          rows={3}
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {isGenerating ? 'Generating...' : '⌘/Ctrl + Enter to generate'}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {localValue.trim().length} characters
        </div>

        <button
          type="submit"
          disabled={!localValue.trim() || isGenerating}
          className="px-6 py-2 
                     bg-primary text-primary-foreground
                     rounded-lg font-medium
                     hover:opacity-90 
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate Flow'
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * Example prompts that users can try
 */
const EXAMPLE_PROMPTS = [
  'Create a simple login flow with username, password, and a login button',
  'Design a shopping cart checkout process with 3 steps: cart review, shipping info, and payment',
  'Build a user onboarding flow: welcome message, profile setup, preferences, and confirmation',
  'Create a decision tree for customer support: select issue type, then show relevant solutions',
  'Design a CI/CD pipeline: code commit, build, test, deploy stages',
];

export interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
  className?: string;
}

export function ExamplePrompts({ onSelect, className = '' }: ExamplePromptsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-foreground">Example prompts:</h3>
      <div className="space-y-2">
        {EXAMPLE_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelect(prompt)}
            className="w-full text-left px-4 py-3
                       bg-muted text-foreground
                       border border-border rounded-lg
                       hover:bg-accent hover:border-primary/50
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       transition-all text-sm"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

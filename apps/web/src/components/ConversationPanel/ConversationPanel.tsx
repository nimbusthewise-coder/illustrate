/**
 * Conversation Panel Component
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Provides a conversation interface for refining generated flows.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useConversationStore } from '@/stores/conversationStore';
import { useConversation } from '@/hooks/useConversation';
import type { ConversationMessage } from '@/types/conversation';

export interface ConversationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationPanel({ isOpen, onClose }: ConversationPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { currentThread } = useConversationStore();
  const {
    isRefining,
    error,
    sendRefinementPrompt,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useConversation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = input.trim();
    if (!trimmed || isRefining) return;

    setInput('');
    await sendRefinementPrompt(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-3xl h-full sm:h-auto sm:max-h-[80vh] sm:my-8 sm:mx-4 bg-card border-t sm:border border-border sm:rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Refine Your Flow
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentThread?.title || 'Have a conversation to improve your diagram'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg
                           hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo (Cmd+Z)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg
                           hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo (Cmd+Shift+Z)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg
                         hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!currentThread || currentThread.messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {currentThread.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isRefining && <LoadingMessage />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 bg-error/15 text-error border border-error/30 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe how you'd like to refine the flow... (Shift+Enter for new line)"
              rows={2}
              disabled={isRefining}
              className="flex-1 px-4 py-3 bg-background text-foreground border border-border
                         rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isRefining}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg
                         hover:opacity-90 transition-all font-medium disabled:opacity-50
                         disabled:cursor-not-allowed flex-shrink-0"
            >
              {isRefining ? 'Processing...' : 'Send'}
            </button>
          </form>
          
          {/* Example prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            <ExampleButton
              text="Add a decision diamond"
              onClick={() => setInput('Add a decision diamond')}
              disabled={isRefining}
            />
            <ExampleButton
              text="Make it vertical"
              onClick={() => setInput('Rearrange the layout to be vertical')}
              disabled={isRefining}
            />
            <ExampleButton
              text="Connect the boxes"
              onClick={() => setInput('Connect all the boxes with arrows')}
              disabled={isRefining}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Message bubble component
 */
interface MessageBubbleProps {
  message: ConversationMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border'
        }`}
      >
        {/* Error display */}
        {message.error && (
          <div className="text-error text-sm mb-2 font-medium">
            Error: {message.error.message}
          </div>
        )}
        
        {/* Content */}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {/* Refinement summary */}
        {message.refinement && (
          <div className="mt-2 pt-2 border-t border-primary-foreground/20 text-xs opacity-80">
            <div className="font-medium">{message.refinement.description}</div>
            <div className="mt-1">
              {message.refinement.changes.length} change{message.refinement.changes.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        
        {/* Timestamp */}
        <div className={`text-xs mt-2 ${isUser ? 'opacity-70' : 'text-muted-foreground'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading message
 */
function LoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] px-4 py-3 rounded-lg bg-muted text-foreground border border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-muted-foreground">Processing your request...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Start a Conversation
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Describe how you'd like to modify your flow. You can add components, change connections,
        rearrange layouts, and more.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <div className="px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded-lg">
          💬 Natural language
        </div>
        <div className="px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded-lg">
          🔄 Iterative refinement
        </div>
        <div className="px-3 py-1.5 bg-muted text-muted-foreground text-xs rounded-lg">
          ↩️ Undo/Redo support
        </div>
      </div>
    </div>
  );
}

/**
 * Example button
 */
interface ExampleButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

function ExampleButton({ text, onClick, disabled }: ExampleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs bg-muted text-muted-foreground rounded-lg
                 hover:bg-primary hover:text-primary-foreground transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {text}
    </button>
  );
}

/**
 * Conversation Store
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Manages conversation threads, refinement history, and undo/redo state.
 */

import { create } from 'zustand';
import type {
  ConversationThread,
  ConversationMessage,
  HistoryEntry,
  ChangePreviewState,
  RefinementOperation,
  FlowChange,
} from '@/types/conversation';
import type { GeneratedFlow } from '@/types/prompt';

export interface ConversationState {
  // Current conversation
  currentThread: ConversationThread | null;
  
  // All conversation threads
  threads: ConversationThread[];
  
  // History stack for undo/redo
  history: HistoryEntry[];
  historyIndex: number; // Current position in history
  
  // Change preview
  changePreview: ChangePreviewState | null;
  
  // Actions
  
  /** Create a new conversation thread */
  createThread: (initialMessage?: string) => ConversationThread;
  
  /** Set active conversation thread */
  setCurrentThread: (threadId: string) => void;
  
  /** Add message to current thread */
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  
  /** Update the current flow in the active thread */
  updateCurrentFlow: (flow: GeneratedFlow) => void;
  
  /** Add to history stack */
  addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  
  /** Undo last change */
  undo: () => GeneratedFlow | null;
  
  /** Redo last undone change */
  redo: () => GeneratedFlow | null;
  
  /** Show change preview */
  showChangePreview: (
    changes: FlowChange[],
    operation: RefinementOperation,
    onAccept: () => void,
    onReject: () => void
  ) => void;
  
  /** Hide change preview */
  hideChangePreview: () => void;
  
  /** Get thread by ID */
  getThread: (threadId: string) => ConversationThread | undefined;
  
  /** Delete thread */
  deleteThread: (threadId: string) => void;
  
  /** Clear all threads */
  clearAllThreads: () => void;
  
  /** Get thread title summary */
  getThreadTitle: (threadId: string) => string;
  
  /** Check if can undo */
  canUndo: () => boolean;
  
  /** Check if can redo */
  canRedo: () => boolean;
}

let threadIdCounter = 0;
function generateThreadId(): string {
  return `thread_${Date.now()}_${threadIdCounter++}`;
}

let messageIdCounter = 0;
function generateMessageId(): string {
  return `msg_${Date.now()}_${messageIdCounter++}`;
}

let historyIdCounter = 0;
function generateHistoryId(): string {
  return `history_${Date.now()}_${historyIdCounter++}`;
}

/**
 * Generate a title from the first user message
 */
function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47) + '...';
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  currentThread: null,
  threads: [],
  history: [],
  historyIndex: -1,
  changePreview: null,

  createThread: (initialMessage?: string) => {
    const threadId = generateThreadId();
    const now = Date.now();
    
    const thread: ConversationThread = {
      id: threadId,
      title: initialMessage ? generateTitle(initialMessage) : 'New Conversation',
      messages: [],
      currentFlow: null,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      threads: [thread, ...state.threads],
      currentThread: thread,
      history: [],
      historyIndex: -1,
    }));

    return thread;
  },

  setCurrentThread: (threadId: string) => {
    const thread = get().threads.find((t) => t.id === threadId);
    if (thread) {
      set({ currentThread: thread });
    }
  },

  addMessage: (message) => {
    const { currentThread } = get();
    if (!currentThread) return;

    const newMessage: ConversationMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now(),
    };

    const updatedThread: ConversationThread = {
      ...currentThread,
      messages: [...currentThread.messages, newMessage],
      updatedAt: Date.now(),
    };

    set((state) => ({
      currentThread: updatedThread,
      threads: state.threads.map((t) =>
        t.id === currentThread.id ? updatedThread : t
      ),
    }));
  },

  updateCurrentFlow: (flow: GeneratedFlow) => {
    const { currentThread } = get();
    if (!currentThread) return;

    const updatedThread: ConversationThread = {
      ...currentThread,
      currentFlow: flow,
      updatedAt: Date.now(),
    };

    set((state) => ({
      currentThread: updatedThread,
      threads: state.threads.map((t) =>
        t.id === currentThread.id ? updatedThread : t
      ),
    }));
  },

  addToHistory: (entry) => {
    const state = get();
    const { historyIndex, history } = state;

    // Truncate history after current index (discard redo stack)
    const newHistory = history.slice(0, historyIndex + 1);

    const newEntry: HistoryEntry = {
      ...entry,
      id: generateHistoryId(),
      timestamp: Date.now(),
    };

    set({
      history: [...newHistory, newEntry],
      historyIndex: newHistory.length,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex <= 0) return null;

    const previousIndex = historyIndex - 1;
    const previousEntry = history[previousIndex];

    set({
      historyIndex: previousIndex,
    });

    return previousEntry?.flow || null;
  },

  redo: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex >= history.length - 1) return null;

    const nextIndex = historyIndex + 1;
    const nextEntry = history[nextIndex];

    set({
      historyIndex: nextIndex,
    });

    return nextEntry?.flow || null;
  },

  showChangePreview: (changes, operation, onAccept, onReject) => {
    set({
      changePreview: {
        visible: true,
        changes,
        operation,
        onAccept,
        onReject,
      },
    });
  },

  hideChangePreview: () => {
    set({ changePreview: null });
  },

  getThread: (threadId: string) => {
    return get().threads.find((t) => t.id === threadId);
  },

  deleteThread: (threadId: string) => {
    set((state) => {
      const threads = state.threads.filter((t) => t.id !== threadId);
      const currentThread =
        state.currentThread?.id === threadId ? null : state.currentThread;

      return {
        threads,
        currentThread,
      };
    });
  },

  clearAllThreads: () => {
    set({
      threads: [],
      currentThread: null,
      history: [],
      historyIndex: -1,
    });
  },

  getThreadTitle: (threadId: string) => {
    const thread = get().threads.find((t) => t.id === threadId);
    return thread?.title || 'Unknown Thread';
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
}));

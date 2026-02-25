/**
 * Flow Generation Store
 * F026: Prompt-to-Flow Generation
 * 
 * Manages state for prompt-to-flow generation including:
 * - Current prompt input
 * - Generation status and progress
 * - Generated flows and history
 * - Error handling
 */

import { create } from 'zustand';
import type {
  FlowPrompt,
  GeneratedFlow,
  GenerationStatus,
  GenerationError,
  GenerateFlowOptions,
  PromptHistoryEntry,
  LLMProvider,
} from '@/types/prompt';
import { generateFlowFromPrompt } from '@/services/llmService';
import { generateFlow } from '@/services/flowGenerator';
import { formatGenerationError } from '@/services/llmService';

export interface GenerationState {
  // Current prompt
  currentPrompt: string;
  
  // Generation status
  status: GenerationStatus;
  progress: number; // 0-100
  
  // Current generation
  activeGeneration: GeneratedFlow | null;
  
  // Error state
  error: GenerationError | null;
  
  // History
  history: PromptHistoryEntry[];
  
  // Preview mode
  showPreview: boolean;
  
  // LLM Provider
  provider: LLMProvider | null;
  
  // Actions
  
  /** Set the current prompt text */
  setPrompt: (prompt: string) => void;
  
  /** Set LLM provider */
  setProvider: (provider: LLMProvider | null) => void;
  
  /** Generate flow from current prompt */
  generateFromPrompt: (options: GenerateFlowOptions) => Promise<void>;
  
  /** Retry last failed generation */
  retry: () => Promise<void>;
  
  /** Cancel ongoing generation */
  cancel: () => void;
  
  /** Clear error state */
  clearError: () => void;
  
  /** Accept the generated flow (adds to canvas) */
  acceptFlow: () => GeneratedFlow | null;
  
  /** Reject the generated flow */
  rejectFlow: () => void;
  
  /** Toggle preview visibility */
  togglePreview: () => void;
  
  /** Get history entry by ID */
  getHistoryEntry: (id: string) => PromptHistoryEntry | undefined;
  
  /** Clear generation history */
  clearHistory: () => void;
  
  /** Load a previous generation from history */
  loadFromHistory: (entryId: string) => void;
}

let promptIdCounter = 0;
function generatePromptId(): string {
  return `prompt_${Date.now()}_${promptIdCounter++}`;
}

// Store last generation options for retry
let lastOptions: GenerateFlowOptions | null = null;

export const useGenerationStore = create<GenerationState>((set, get) => ({
  currentPrompt: '',
  status: 'idle',
  progress: 0,
  activeGeneration: null,
  error: null,
  history: [],
  showPreview: false,
  provider: null,

  setPrompt: (prompt: string) => {
    set({ currentPrompt: prompt, error: null });
  },

  setProvider: (provider: LLMProvider | null) => {
    set({ provider });
  },

  generateFromPrompt: async (options: GenerateFlowOptions) => {
    const state = get();
    const promptText = state.currentPrompt.trim();

    if (!promptText) {
      set({
        error: {
          code: 'EMPTY_PROMPT',
          message: 'Please enter a prompt describing the flow you want to generate',
          retryable: false,
        },
      });
      return;
    }

    // Store options for retry
    lastOptions = options;

    const promptId = generatePromptId();
    const prompt: FlowPrompt = {
      id: promptId,
      text: promptText,
      createdAt: Date.now(),
    };

    set({
      status: 'processing',
      progress: 10,
      error: null,
      activeGeneration: null,
    });

    try {
      // Step 1: Call LLM service
      set({ status: 'processing', progress: 30 });
      
      const spec = await generateFlowFromPrompt(promptText, {
        canvasWidth: options.canvasWidth,
        canvasHeight: options.canvasHeight,
        provider: state.provider || undefined,
      });

      // Step 2: Parse and validate
      set({ status: 'parsing', progress: 60 });
      
      // Add small delay for UX (let user see the progress)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Generate layers
      set({ status: 'generating', progress: 80 });
      
      const flow = generateFlow(
        spec,
        options.canvasWidth,
        options.canvasHeight,
        promptId
      );

      // Step 4: Complete
      set({
        status: 'completed',
        progress: 100,
        activeGeneration: flow,
        showPreview: true,
      });

      // Add to history
      const historyEntry: PromptHistoryEntry = {
        id: `history_${Date.now()}`,
        prompt,
        result: { success: true, flow },
        timestamp: Date.now(),
      };

      set((state) => ({
        history: [historyEntry, ...state.history].slice(0, 50), // Keep last 50
      }));

    } catch (error) {
      const genError = formatGenerationError(error);
      
      set({
        status: 'error',
        progress: 0,
        error: genError,
      });

      // Add to history
      const historyEntry: PromptHistoryEntry = {
        id: `history_${Date.now()}`,
        prompt,
        result: { success: false, error: genError },
        timestamp: Date.now(),
      };

      set((state) => ({
        history: [historyEntry, ...state.history].slice(0, 50),
      }));
    }
  },

  retry: async () => {
    if (!lastOptions) {
      set({
        error: {
          code: 'NO_RETRY_OPTIONS',
          message: 'No previous generation to retry',
          retryable: false,
        },
      });
      return;
    }

    await get().generateFromPrompt(lastOptions);
  },

  cancel: () => {
    set({
      status: 'idle',
      progress: 0,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  acceptFlow: () => {
    const { activeGeneration } = get();
    
    if (!activeGeneration) return null;

    // Reset state after accepting
    set({
      status: 'idle',
      progress: 0,
      activeGeneration: null,
      showPreview: false,
      currentPrompt: '',
    });

    return activeGeneration;
  },

  rejectFlow: () => {
    set({
      activeGeneration: null,
      showPreview: false,
      status: 'idle',
      progress: 0,
    });
  },

  togglePreview: () => {
    set((state) => ({ showPreview: !state.showPreview }));
  },

  getHistoryEntry: (id: string) => {
    return get().history.find((entry) => entry.id === id);
  },

  clearHistory: () => {
    set({ history: [] });
  },

  loadFromHistory: (entryId: string) => {
    const entry = get().getHistoryEntry(entryId);
    
    if (!entry) return;

    set({
      currentPrompt: entry.prompt.text,
      activeGeneration: entry.result.success ? entry.result.flow : null,
      error: entry.result.success ? null : entry.result.error,
      status: 'idle',
      progress: 0,
    });
  },
}));

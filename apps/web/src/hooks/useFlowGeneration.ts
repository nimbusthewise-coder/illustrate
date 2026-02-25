/**
 * Flow Generation Hook
 * F026: Prompt-to-Flow Generation
 * 
 * Custom hook that manages the flow generation lifecycle
 * and integrates with the canvas store.
 */

import { useCallback } from 'react';
import { useGenerationStore } from '@/stores/generationStore';
import { useCanvasStore } from '@/stores/canvas-store';
import { useLayerStore } from '@/stores/layer-store';
import type { GenerateFlowOptions, LLMProvider } from '@/types/prompt';

export interface UseFlowGenerationReturn {
  // State
  prompt: string;
  status: 'idle' | 'processing' | 'parsing' | 'generating' | 'completed' | 'error';
  progress: number;
  error: string | null;
  isGenerating: boolean;
  hasActiveFlow: boolean;
  canRetry: boolean;

  // Actions
  setPrompt: (prompt: string) => void;
  generate: () => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  accept: () => void;
  reject: () => void;
  
  // Provider management
  setProvider: (provider: LLMProvider | null) => void;
}

/**
 * Hook for managing flow generation
 */
export function useFlowGeneration(): UseFlowGenerationReturn {
  const canvasStore = useCanvasStore();
  const layerStore = useLayerStore();
  const generationStore = useGenerationStore();

  const {
    currentPrompt,
    status,
    progress,
    error,
    activeGeneration,
    setPrompt,
    generateFromPrompt,
    retry: retryGeneration,
    cancel: cancelGeneration,
    acceptFlow,
    rejectFlow,
    setProvider,
  } = generationStore;

  const isGenerating = status === 'processing' || status === 'parsing' || status === 'generating';
  const hasActiveFlow = activeGeneration !== null;
  const canRetry = error !== null && error.retryable;

  /**
   * Generate flow from current prompt
   */
  const generate = useCallback(async () => {
    const options: GenerateFlowOptions = {
      canvasWidth: canvasStore.width,
      canvasHeight: canvasStore.height,
      autoPlace: true,
    };

    await generateFromPrompt(options);
  }, [canvasStore.width, canvasStore.height, generateFromPrompt]);

  /**
   * Retry last failed generation
   */
  const retry = useCallback(async () => {
    await retryGeneration();
  }, [retryGeneration]);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    cancelGeneration();
  }, [cancelGeneration]);

  /**
   * Accept generated flow and add to canvas
   */
  const accept = useCallback(() => {
    const flow = acceptFlow();
    
    if (!flow) return;

    // Add generated layers to the canvas
    for (const layer of flow.layers) {
      layerStore.addLayer(undefined, layer);
    }

    // Optionally select the first generated layer
    if (flow.layers.length > 0) {
      layerStore.setActiveLayer(flow.layers[0].id);
    }
  }, [acceptFlow, layerStore]);

  /**
   * Reject generated flow
   */
  const reject = useCallback(() => {
    rejectFlow();
  }, [rejectFlow]);

  return {
    // State
    prompt: currentPrompt,
    status,
    progress,
    error: error?.message || null,
    isGenerating,
    hasActiveFlow,
    canRetry,

    // Actions
    setPrompt,
    generate,
    retry,
    cancel,
    accept,
    reject,
    setProvider,
  };
}

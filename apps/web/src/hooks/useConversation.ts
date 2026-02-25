/**
 * Conversation Hook
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Manages conversation state and refinement operations.
 */

import { useCallback, useState } from 'react';
import { useConversationStore } from '@/stores/conversationStore';
import { useGenerationStore } from '@/stores/generationStore';
import { refineFlow } from '@/services/refinementService';
import { generateFlow } from '@/services/flowGenerator';
import type { RefinementRequest } from '@/types/conversation';
import type { GeneratedFlow } from '@/types/prompt';

export interface UseConversationResult {
  // State
  isRefining: boolean;
  error: string | null;
  
  // Actions
  sendRefinementPrompt: (prompt: string) => Promise<void>;
  acceptRefinement: () => void;
  rejectRefinement: () => void;
  undo: () => void;
  redo: () => void;
  
  // Utilities
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Hook for managing conversational refinement
 */
export function useConversation(): UseConversationResult {
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const conversationStore = useConversationStore();
  const generationStore = useGenerationStore();
  
  const canUndo = conversationStore.canUndo();
  const canRedo = conversationStore.canRedo();

  /**
   * Send a refinement prompt
   */
  const sendRefinementPrompt = useCallback(async (prompt: string) => {
    setError(null);
    
    // Get or create conversation thread
    let thread = conversationStore.currentThread;
    if (!thread) {
      thread = conversationStore.createThread(prompt);
    }

    // Add user message
    conversationStore.addMessage({
      role: 'user',
      content: prompt,
    });

    // Get current flow
    const currentFlow = thread.currentFlow || generationStore.activeGeneration;
    
    if (!currentFlow) {
      setError('No flow to refine. Please generate a flow first.');
      conversationStore.addMessage({
        role: 'assistant',
        content: 'Please generate an initial flow before requesting refinements.',
        error: {
          code: 'NO_FLOW',
          message: 'No flow to refine',
          retryable: false,
        },
      });
      return;
    }

    setIsRefining(true);

    try {
      // Build refinement request
      const request: RefinementRequest = {
        conversationId: thread.id,
        prompt,
        currentFlow,
        conversationHistory: thread.messages,
      };

      // Get LLM provider from generation store
      const provider = generationStore.provider || undefined;

      // Call refinement service
      const response = await refineFlow(request, provider);

      // Check if clarification is needed
      if (response.operation.requiresConfirmation) {
        // Add assistant message asking for clarification
        conversationStore.addMessage({
          role: 'assistant',
          content: response.explanation,
          refinement: response.operation,
        });
        
        setIsRefining(false);
        return;
      }

      // Generate updated flow from refined specification
      const updatedFlow = generateFlow(
        response.updatedSpecification,
        currentFlow.canvasWidth,
        currentFlow.canvasHeight,
        currentFlow.promptId
      );

      // Show change preview
      conversationStore.showChangePreview(
        response.operation.changes,
        response.operation,
        () => acceptRefinementFlow(updatedFlow, response.explanation),
        () => rejectRefinementFlow(response.explanation)
      );

      // Add assistant message with refinement
      conversationStore.addMessage({
        role: 'assistant',
        content: response.explanation,
        flow: updatedFlow,
        refinement: response.operation,
      });

      setIsRefining(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Refinement failed';
      setError(errorMessage);
      
      conversationStore.addMessage({
        role: 'assistant',
        content: 'I encountered an error processing your refinement request.',
        error: {
          code: 'REFINEMENT_ERROR',
          message: errorMessage,
          retryable: true,
        },
      });
      
      setIsRefining(false);
    }
  }, [conversationStore, generationStore]);

  /**
   * Accept the proposed refinement
   */
  const acceptRefinement = useCallback(() => {
    const preview = conversationStore.changePreview;
    if (preview) {
      preview.onAccept();
      conversationStore.hideChangePreview();
    }
  }, [conversationStore]);

  /**
   * Reject the proposed refinement
   */
  const rejectRefinement = useCallback(() => {
    const preview = conversationStore.changePreview;
    if (preview) {
      preview.onReject();
      conversationStore.hideChangePreview();
    }
  }, [conversationStore]);

  /**
   * Accept a refined flow
   */
  const acceptRefinementFlow = useCallback((
    flow: GeneratedFlow,
    explanation: string
  ) => {
    // Update current flow in conversation
    conversationStore.updateCurrentFlow(flow);
    
    // Add to history for undo/redo
    conversationStore.addToHistory({
      type: 'refinement',
      flow,
    });
    
    // Update generation store (for compatibility with existing flow acceptance)
    generationStore.activeGeneration = flow;
  }, [conversationStore, generationStore]);

  /**
   * Reject a refined flow
   */
  const rejectRefinementFlow = useCallback((explanation: string) => {
    // Add a message indicating rejection
    conversationStore.addMessage({
      role: 'system',
      content: 'Refinement rejected by user.',
    });
  }, [conversationStore]);

  /**
   * Undo last refinement
   */
  const undo = useCallback(() => {
    const previousFlow = conversationStore.undo();
    
    if (previousFlow) {
      conversationStore.updateCurrentFlow(previousFlow);
      generationStore.activeGeneration = previousFlow;
      
      conversationStore.addMessage({
        role: 'system',
        content: 'Undone last change.',
      });
    }
  }, [conversationStore, generationStore]);

  /**
   * Redo last undone refinement
   */
  const redo = useCallback(() => {
    const nextFlow = conversationStore.redo();
    
    if (nextFlow) {
      conversationStore.updateCurrentFlow(nextFlow);
      generationStore.activeGeneration = nextFlow;
      
      conversationStore.addMessage({
        role: 'system',
        content: 'Redone change.',
      });
    }
  }, [conversationStore, generationStore]);

  return {
    isRefining,
    error,
    sendRefinementPrompt,
    acceptRefinement,
    rejectRefinement,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

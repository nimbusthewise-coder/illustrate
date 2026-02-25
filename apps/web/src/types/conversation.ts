/**
 * Conversation and Refinement Types
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Types for managing conversational refinement of generated flows.
 */

import type { FlowSpecification, GeneratedFlow, GenerationError } from './prompt';

/**
 * Type of refinement operation
 */
export type RefinementType =
  | 'add_component'      // Add new components
  | 'remove_component'   // Remove existing components
  | 'modify_component'   // Change component properties
  | 'add_connection'     // Add new connections
  | 'remove_connection'  // Remove existing connections
  | 'modify_connection'  // Change connection properties
  | 'rearrange_layout'   // Change layout/positioning
  | 'change_style'       // Modify visual style
  | 'clarification'      // Need more information
  | 'regenerate';        // Complete regeneration

/**
 * A single message in the conversation
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  
  // For assistant messages that generated flows
  flow?: GeneratedFlow;
  
  // For refinement responses
  refinement?: RefinementOperation;
  
  // For errors
  error?: GenerationError;
}

/**
 * Refinement operation details
 */
export interface RefinementOperation {
  type: RefinementType;
  description: string;
  changes: FlowChange[];
  requiresConfirmation: boolean;
}

/**
 * A specific change to the flow
 */
export interface FlowChange {
  id: string;
  type: 'add' | 'remove' | 'modify';
  target: 'component' | 'connection' | 'layout';
  targetId?: string; // ID of affected element
  before?: unknown; // State before change
  after?: unknown;  // State after change
  description: string;
}

/**
 * Complete conversation thread
 */
export interface ConversationThread {
  id: string;
  title: string; // Auto-generated from first prompt
  messages: ConversationMessage[];
  currentFlow: GeneratedFlow | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Refinement request from user
 */
export interface RefinementRequest {
  conversationId: string;
  prompt: string;
  currentFlow: GeneratedFlow;
  conversationHistory: ConversationMessage[];
}

/**
 * Refinement response from LLM
 */
export interface RefinementResponse {
  operation: RefinementOperation;
  updatedSpecification: FlowSpecification;
  explanation: string;
}

/**
 * Context for understanding refinement intent
 */
export interface RefinementContext {
  previousPrompts: string[];
  currentFlowState: FlowSpecification;
  recentChanges: FlowChange[];
  userIntent: string; // Interpreted intent
  ambiguous: boolean; // Whether clarification is needed
  suggestions?: string[]; // Possible interpretations if ambiguous
}

/**
 * Undo/Redo stack entry
 */
export interface HistoryEntry {
  id: string;
  type: 'generation' | 'refinement';
  flow: GeneratedFlow;
  operation?: RefinementOperation;
  timestamp: number;
}

/**
 * Change preview state
 */
export interface ChangePreviewState {
  visible: boolean;
  changes: FlowChange[];
  operation: RefinementOperation | null;
  onAccept: () => void;
  onReject: () => void;
}

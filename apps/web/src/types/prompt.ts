/**
 * Prompt-to-Flow Generation Types
 * F026: Prompt-to-Flow Generation
 */

import type { Layer } from '@/lib/types';

// ComponentInstance from LLM export types
export interface ComponentInstance {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Status of a flow generation operation
 */
export type GenerationStatus = 
  | 'idle'
  | 'processing'
  | 'parsing'
  | 'generating'
  | 'completed'
  | 'error';

/**
 * Input prompt for flow generation
 */
export interface FlowPrompt {
  id: string;
  text: string;
  createdAt: number;
}

/**
 * LLM provider configuration
 */
export interface LLMProvider {
  name: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

/**
 * Flow specification extracted from LLM response
 */
export interface FlowSpecification {
  title: string;
  description: string;
  components: ComponentSpec[];
  connections: ConnectionSpec[];
  layout: LayoutHints;
}

/**
 * Component specification for a single element in the flow
 */
export interface ComponentSpec {
  id: string;
  type: 'box' | 'text' | 'component';
  name: string;
  content?: string;
  role?: string; // For component instances
  slots?: Record<string, string>; // Slot name -> content
  style?: {
    charset?: 'light' | 'heavy' | 'double' | 'round';
    width?: number;
    height?: number;
  };
}

/**
 * Connection specification between components
 */
export interface ConnectionSpec {
  id: string;
  from: string; // Component ID
  to: string; // Component ID
  type: 'arrow' | 'line';
  label?: string;
  style?: {
    arrowhead?: boolean;
    bidirectional?: boolean;
    lineStyle?: 'light' | 'heavy' | 'double';
  };
}

/**
 * Layout hints for component placement
 */
export interface LayoutHints {
  direction: 'horizontal' | 'vertical' | 'grid';
  spacing: number; // Cell spacing between components
  alignment?: 'start' | 'center' | 'end';
  wrap?: boolean; // For grid layouts
}

/**
 * Generated flow result
 */
export interface GeneratedFlow {
  id: string;
  promptId: string;
  specification: FlowSpecification;
  layers: Layer[];
  components: ComponentInstance[];
  createdAt: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Error during generation
 */
export interface GenerationError {
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
}

/**
 * Generation result (success or error)
 */
export type GenerationResult = 
  | { success: true; flow: GeneratedFlow }
  | { success: false; error: GenerationError };

/**
 * Options for flow generation
 */
export interface GenerateFlowOptions {
  canvasWidth: number;
  canvasHeight: number;
  designSystemName?: string;
  targetLayerName?: string;
  autoPlace?: boolean; // Automatically place on canvas
  useExistingComponents?: boolean; // Use components from library
}

/**
 * History entry for prompt refinement
 */
export interface PromptHistoryEntry {
  id: string;
  prompt: FlowPrompt;
  result: GenerationResult;
  timestamp: number;
}

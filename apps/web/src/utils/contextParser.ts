/**
 * Context Parser Utility
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Parses user refinement prompts to understand intent and extract context.
 */

import type { RefinementContext, RefinementType } from '@/types/conversation';
import type { FlowSpecification } from '@/types/prompt';

/**
 * Keywords that indicate different types of refinements
 */
const REFINEMENT_KEYWORDS: Record<RefinementType, string[]> = {
  add_component: ['add', 'include', 'insert', 'create', 'new', 'another'],
  remove_component: ['remove', 'delete', 'take out', 'get rid of', 'eliminate'],
  modify_component: ['change', 'modify', 'update', 'edit', 'rename', 'resize'],
  add_connection: ['connect', 'link', 'arrow from', 'point to', 'flow to'],
  remove_connection: ['disconnect', 'unlink', 'remove arrow', 'remove connection'],
  modify_connection: ['change arrow', 'modify connection', 'update link'],
  rearrange_layout: ['rearrange', 'reposition', 'move', 'layout', 'organize', 'align'],
  change_style: ['style', 'color', 'theme', 'appearance', 'look'],
  clarification: ['what', 'which', 'where', 'how', 'unclear', 'ambiguous'],
  regenerate: ['start over', 'regenerate', 'redo', 'from scratch', 'completely new'],
};

/**
 * Parse refinement prompt to understand user intent
 */
export function parseRefinementContext(
  prompt: string,
  currentFlow: FlowSpecification,
  previousPrompts: string[]
): RefinementContext {
  const lowerPrompt = prompt.toLowerCase();
  
  // Detect refinement type
  const detectedTypes = detectRefinementTypes(lowerPrompt);
  
  // Check for ambiguity
  const ambiguous = detectedTypes.length > 1 || 
                    hasAmbiguousReferences(lowerPrompt, currentFlow);
  
  // Extract user intent
  const userIntent = extractIntent(prompt, detectedTypes);
  
  // Generate suggestions if ambiguous
  const suggestions = ambiguous 
    ? generateSuggestions(prompt, currentFlow, detectedTypes)
    : undefined;
  
  return {
    previousPrompts,
    currentFlowState: currentFlow,
    recentChanges: [],
    userIntent,
    ambiguous,
    suggestions,
  };
}

/**
 * Detect which types of refinements the prompt is requesting
 */
function detectRefinementTypes(prompt: string): RefinementType[] {
  const types: RefinementType[] = [];
  
  for (const [type, keywords] of Object.entries(REFINEMENT_KEYWORDS)) {
    if (keywords.some(keyword => prompt.includes(keyword))) {
      types.push(type as RefinementType);
    }
  }
  
  // Default to modify if nothing specific detected
  if (types.length === 0) {
    types.push('modify_component');
  }
  
  return types;
}

/**
 * Check if the prompt has ambiguous references
 */
function hasAmbiguousReferences(
  prompt: string,
  flow: FlowSpecification
): boolean {
  // Check for vague references
  const vagueTerms = ['it', 'that', 'this', 'those', 'these', 'the box'];
  const hasVagueTerms = vagueTerms.some(term => prompt.includes(term));
  
  // Check if multiple components could match
  const componentCount = flow.components.length;
  if (componentCount > 1 && hasVagueTerms) {
    return true;
  }
  
  return false;
}

/**
 * Extract the primary intent from the prompt
 */
function extractIntent(prompt: string, types: RefinementType[]): string {
  // Clean up the prompt
  const cleaned = prompt.trim();
  
  // If we have a clear type, use it as prefix
  if (types.length === 1) {
    const type = types[0];
    const action = typeToAction(type);
    return `${action}: ${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Convert refinement type to action verb
 */
function typeToAction(type: RefinementType): string {
  const actions: Record<RefinementType, string> = {
    add_component: 'Add',
    remove_component: 'Remove',
    modify_component: 'Modify',
    add_connection: 'Connect',
    remove_connection: 'Disconnect',
    modify_connection: 'Update connection',
    rearrange_layout: 'Rearrange',
    change_style: 'Restyle',
    clarification: 'Clarify',
    regenerate: 'Regenerate',
  };
  
  return actions[type] || 'Modify';
}

/**
 * Generate suggestions for ambiguous prompts
 */
function generateSuggestions(
  prompt: string,
  flow: FlowSpecification,
  types: RefinementType[]
): string[] {
  const suggestions: string[] = [];
  
  // If multiple types detected, suggest each
  if (types.length > 1) {
    types.forEach(type => {
      suggestions.push(`Did you want to ${typeToAction(type).toLowerCase()}?`);
    });
  }
  
  // If references are ambiguous, list components
  if (hasAmbiguousReferences(prompt.toLowerCase(), flow)) {
    const componentNames = flow.components.map(c => c.name).slice(0, 5);
    suggestions.push(
      `Which component? (${componentNames.join(', ')}${flow.components.length > 5 ? ', ...' : ''})`
    );
  }
  
  return suggestions;
}

/**
 * Find referenced component by name or fuzzy match
 */
export function findReferencedComponent(
  reference: string,
  flow: FlowSpecification
): string | null {
  const lowerRef = reference.toLowerCase();
  
  // Exact name match
  for (const comp of flow.components) {
    if (comp.name.toLowerCase() === lowerRef) {
      return comp.id;
    }
  }
  
  // Partial match
  for (const comp of flow.components) {
    if (comp.name.toLowerCase().includes(lowerRef) ||
        lowerRef.includes(comp.name.toLowerCase())) {
      return comp.id;
    }
  }
  
  // Role match (if available)
  for (const comp of flow.components) {
    if (comp.role?.toLowerCase() === lowerRef) {
      return comp.id;
    }
  }
  
  return null;
}

/**
 * Extract component references from prompt
 */
export function extractComponentReferences(
  prompt: string,
  flow: FlowSpecification
): string[] {
  const references: string[] = [];
  const lowerPrompt = prompt.toLowerCase();
  
  // Check each component name
  for (const comp of flow.components) {
    const lowerName = comp.name.toLowerCase();
    if (lowerPrompt.includes(lowerName)) {
      references.push(comp.id);
    }
  }
  
  return references;
}

/**
 * Build context string for LLM from conversation history
 */
export function buildContextString(
  currentFlow: FlowSpecification,
  previousPrompts: string[]
): string {
  const parts: string[] = [];
  
  // Add current flow summary
  parts.push('Current Flow State:');
  parts.push(`- Title: ${currentFlow.title}`);
  parts.push(`- Components: ${currentFlow.components.length}`);
  parts.push(`- Connections: ${currentFlow.connections.length}`);
  
  // Add component list
  if (currentFlow.components.length > 0) {
    parts.push('\nComponents:');
    currentFlow.components.forEach((comp, idx) => {
      parts.push(`  ${idx + 1}. ${comp.name} (${comp.type})`);
    });
  }
  
  // Add previous prompts (last 3)
  if (previousPrompts.length > 0) {
    parts.push('\nPrevious Refinements:');
    previousPrompts.slice(-3).forEach((prompt, idx) => {
      parts.push(`  ${idx + 1}. "${prompt}"`);
    });
  }
  
  return parts.join('\n');
}

/**
 * Refinement Service
 * F027: Iterative Refinement via Follow-up Prompts
 * 
 * Handles refinement of generated flows through conversational prompts.
 */

import type {
  RefinementRequest,
  RefinementResponse,
  RefinementOperation,
  RefinementType,
  FlowChange,
} from '@/types/conversation';
import type { FlowSpecification, LLMProvider } from '@/types/prompt';
import { parseRefinementContext, buildContextString } from '@/utils/contextParser';
import { calculateFlowDiff } from '@/utils/diffGenerator';
import { getDefaultProvider } from './llmService';

/**
 * System prompt for refinement
 */
const REFINEMENT_SYSTEM_PROMPT = `You are an expert at refining flowchart specifications based on user feedback.

Your task is to:
1. Understand the user's refinement request in context of their current flowchart
2. Apply the requested changes while preserving the integrity of the flow
3. Provide a clear explanation of what was changed

You will receive:
- The current flow specification (JSON)
- The user's refinement prompt
- Context from previous prompts

You must respond with valid JSON in this exact format:
{
  "operation": {
    "type": "add_component" | "remove_component" | "modify_component" | "add_connection" | "remove_connection" | "modify_connection" | "rearrange_layout" | "change_style" | "clarification" | "regenerate",
    "description": "Brief description of the operation",
    "changes": [
      {
        "type": "add" | "remove" | "modify",
        "target": "component" | "connection" | "layout",
        "description": "What changed"
      }
    ],
    "requiresConfirmation": false
  },
  "updatedSpecification": {
    // Full updated flow specification
  },
  "explanation": "Clear explanation of what was changed and why"
}

Guidelines:
- Make minimal changes - only what the user requested
- Preserve existing component IDs when possible
- Maintain consistent naming and style
- If the request is ambiguous, set requiresConfirmation: true and explain in the explanation
- For "clarification" type, don't modify the specification, just ask for clarification
- Ensure all connections reference valid component IDs
- Respect canvas dimensions and layout constraints`;

/**
 * Refine a flow based on user prompt
 */
export async function refineFlow(
  request: RefinementRequest,
  provider?: LLMProvider
): Promise<RefinementResponse> {
  const llmProvider = provider || getDefaultProvider();
  
  if (!llmProvider) {
    throw new Error('No LLM provider configured');
  }

  // Parse context to understand intent
  const context = parseRefinementContext(
    request.prompt,
    request.currentFlow.specification,
    request.conversationHistory.map(m => m.content)
  );

  // Build context string for LLM
  const contextStr = buildContextString(
    request.currentFlow.specification,
    context.previousPrompts
  );

  // Generate refinement
  const response = await callRefinementLLM(
    request.prompt,
    request.currentFlow.specification,
    contextStr,
    llmProvider
  );

  return response;
}

/**
 * Call LLM for refinement
 */
async function callRefinementLLM(
  prompt: string,
  currentSpec: FlowSpecification,
  context: string,
  provider: LLMProvider
): Promise<RefinementResponse> {
  const userMessage = `${context}

User Refinement Request: "${prompt}"

Current Flow Specification:
${JSON.stringify(currentSpec, null, 2)}

Please refine the flow according to the user's request.`;

  if (provider.name === 'openai') {
    return refineWithOpenAI(userMessage, provider);
  } else if (provider.name === 'anthropic') {
    return refineWithAnthropic(userMessage, provider);
  }

  throw new Error(`Unsupported provider: ${provider.name}`);
}

/**
 * Refine using OpenAI
 */
async function refineWithOpenAI(
  prompt: string,
  provider: LLMProvider
): Promise<RefinementResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || 'gpt-4o',
      messages: [
        { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response content from OpenAI');
  }

  return JSON.parse(content) as RefinementResponse;
}

/**
 * Refine using Anthropic
 */
async function refineWithAnthropic(
  prompt: string,
  provider: LLMProvider
): Promise<RefinementResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: provider.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: REFINEMENT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;

  if (!content) {
    throw new Error('No response content from Anthropic');
  }

  // Extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
    content.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Anthropic response');
  }

  return JSON.parse(jsonMatch[1]) as RefinementResponse;
}

/**
 * Validate refinement response
 */
export function validateRefinementResponse(
  response: unknown
): response is RefinementResponse {
  if (!response || typeof response !== 'object') return false;

  const r = response as Partial<RefinementResponse>;

  if (!r.operation || !r.updatedSpecification || !r.explanation) {
    return false;
  }

  return true;
}

/**
 * Create a manual refinement operation (without LLM)
 * Useful for simple operations or when LLM is unavailable
 */
export function createManualRefinement(
  type: RefinementType,
  currentSpec: FlowSpecification,
  updatedSpec: FlowSpecification,
  description: string
): RefinementResponse {
  const changes = calculateFlowDiff(currentSpec, updatedSpec);

  const operation: RefinementOperation = {
    type,
    description,
    changes,
    requiresConfirmation: false,
  };

  return {
    operation,
    updatedSpecification: updatedSpec,
    explanation: description,
  };
}

/**
 * Merge refinement into current flow
 */
export function mergeRefinement(
  currentSpec: FlowSpecification,
  refinement: RefinementResponse
): FlowSpecification {
  // Use the updated specification from the refinement
  return refinement.updatedSpecification;
}

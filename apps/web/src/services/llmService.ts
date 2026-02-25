/**
 * LLM Integration Service
 * F026: Prompt-to-Flow Generation
 * 
 * Handles communication with LLM providers (OpenAI, Anthropic)
 * to generate flow specifications from natural language prompts.
 */

import type { FlowSpecification, LLMProvider, GenerationError } from '@/types/prompt';

/**
 * System prompt for flow generation
 */
const SYSTEM_PROMPT = `You are an expert at converting natural language descriptions into structured flowchart specifications for illustrate.md, an ASCII diagram editor.

Your task is to analyze user prompts and generate a JSON specification for a flowchart that includes:
1. Components (boxes, text labels, shapes)
2. Connections (arrows, lines)
3. Layout hints (direction, spacing, alignment)

Guidelines:
- Use simple ASCII-compatible components
- Suggest appropriate component sizes based on content
- Use clear, descriptive names for all components
- Connect components logically based on the described flow
- Consider visual hierarchy and readability
- Respect canvas dimensions provided in the request
- Use 'light' charset by default (can be 'light', 'heavy', 'double', 'round')

Always respond with valid JSON in this exact format:
{
  "title": "Flow Title",
  "description": "Brief description of the flow",
  "components": [
    {
      "id": "comp_1",
      "type": "box" | "text" | "component",
      "name": "Component Name",
      "content": "Text content (optional)",
      "role": "dialog" | "button" | "header" | null,
      "style": {
        "charset": "light" | "heavy" | "double" | "round",
        "width": 20,
        "height": 5
      }
    }
  ],
  "connections": [
    {
      "id": "conn_1",
      "from": "comp_1",
      "to": "comp_2",
      "type": "arrow" | "line",
      "label": "Optional label",
      "style": {
        "arrowhead": true,
        "bidirectional": false,
        "lineStyle": "light"
      }
    }
  ],
  "layout": {
    "direction": "horizontal" | "vertical" | "grid",
    "spacing": 3,
    "alignment": "start" | "center" | "end",
    "wrap": false
  }
}`;

/**
 * Generate flow specification from prompt using OpenAI
 */
async function generateWithOpenAI(
  prompt: string,
  provider: LLMProvider,
  canvasWidth: number,
  canvasHeight: number
): Promise<FlowSpecification> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Canvas dimensions: ${canvasWidth}x${canvasHeight}\n\nUser prompt: ${prompt}`
        }
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

  return JSON.parse(content) as FlowSpecification;
}

/**
 * Generate flow specification from prompt using Anthropic Claude
 */
async function generateWithAnthropic(
  prompt: string,
  provider: LLMProvider,
  canvasWidth: number,
  canvasHeight: number
): Promise<FlowSpecification> {
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
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Canvas dimensions: ${canvasWidth}x${canvasHeight}\n\nUser prompt: ${prompt}`
        }
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

  return JSON.parse(jsonMatch[1]) as FlowSpecification;
}

/**
 * Validate flow specification structure
 */
function validateSpecification(spec: unknown): spec is FlowSpecification {
  if (!spec || typeof spec !== 'object') return false;
  
  const s = spec as Partial<FlowSpecification>;
  
  if (!s.title || typeof s.title !== 'string') return false;
  if (!s.description || typeof s.description !== 'string') return false;
  if (!Array.isArray(s.components)) return false;
  if (!Array.isArray(s.connections)) return false;
  if (!s.layout || typeof s.layout !== 'object') return false;
  
  return true;
}

/**
 * Get LLM provider from environment variables
 */
export function getDefaultProvider(): LLMProvider | null {
  // Check for OpenAI
  if (typeof window !== 'undefined') {
    const openaiKey = localStorage.getItem('llm_openai_key');
    if (openaiKey) {
      return {
        name: 'openai',
        apiKey: openaiKey,
        model: localStorage.getItem('llm_openai_model') || 'gpt-4o',
      };
    }

    // Check for Anthropic
    const anthropicKey = localStorage.getItem('llm_anthropic_key');
    if (anthropicKey) {
      return {
        name: 'anthropic',
        apiKey: anthropicKey,
        model: localStorage.getItem('llm_anthropic_model') || 'claude-3-5-sonnet-20241022',
      };
    }
  }

  return null;
}

/**
 * Store LLM provider credentials
 */
export function storeProvider(provider: LLMProvider): void {
  if (typeof window === 'undefined') return;

  if (provider.name === 'openai') {
    localStorage.setItem('llm_openai_key', provider.apiKey);
    localStorage.setItem('llm_openai_model', provider.model);
  } else if (provider.name === 'anthropic') {
    localStorage.setItem('llm_anthropic_key', provider.apiKey);
    localStorage.setItem('llm_anthropic_model', provider.model);
  }
}

/**
 * Clear stored LLM provider credentials
 */
export function clearProvider(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('llm_openai_key');
  localStorage.removeItem('llm_openai_model');
  localStorage.removeItem('llm_anthropic_key');
  localStorage.removeItem('llm_anthropic_model');
}

/**
 * Generate flow specification from natural language prompt
 * 
 * @param prompt - User's natural language description
 * @param options - Generation options (canvas size, provider, etc.)
 * @returns Flow specification or throws error
 */
export async function generateFlowFromPrompt(
  prompt: string,
  options: {
    canvasWidth: number;
    canvasHeight: number;
    provider?: LLMProvider;
  }
): Promise<FlowSpecification> {
  const provider = options.provider || getDefaultProvider();
  
  if (!provider) {
    throw new Error('No LLM provider configured. Please set up OpenAI or Anthropic API key.');
  }

  try {
    let spec: FlowSpecification;

    if (provider.name === 'openai') {
      spec = await generateWithOpenAI(
        prompt,
        provider,
        options.canvasWidth,
        options.canvasHeight
      );
    } else if (provider.name === 'anthropic') {
      spec = await generateWithAnthropic(
        prompt,
        provider,
        options.canvasWidth,
        options.canvasHeight
      );
    } else {
      throw new Error(`Unsupported LLM provider: ${provider.name}`);
    }

    // Validate the specification
    if (!validateSpecification(spec)) {
      throw new Error('Invalid flow specification received from LLM');
    }

    return spec;
  } catch (error) {
    if (error instanceof Error) {
      // Wrap with more context
      throw new Error(`Flow generation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Convert generation error to user-friendly format
 */
export function formatGenerationError(error: unknown): GenerationError {
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for retryable errors
    const retryable = 
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503');

    // Determine error code
    let code = 'UNKNOWN_ERROR';
    if (message.includes('No LLM provider')) code = 'NO_PROVIDER';
    else if (message.includes('API error')) code = 'API_ERROR';
    else if (message.includes('Invalid flow specification')) code = 'INVALID_SPEC';
    else if (message.includes('rate limit')) code = 'RATE_LIMIT';
    else if (retryable) code = 'NETWORK_ERROR';

    return {
      code,
      message: message,
      details: error.stack,
      retryable,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    retryable: false,
  };
}

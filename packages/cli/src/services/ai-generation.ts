/**
 * AI Generation Service
 * 
 * Placeholder for prompt-to-flow generation (F026).
 * This service will integrate with the actual AI backend when Phase 6 is implemented.
 */

import type { CanvasDocument } from '@illustrate.md/core';

export interface GenerationOptions {
  prompt: string;
  designSystem?: string;
  width?: number;
  height?: number;
  title?: string;
}

export interface GenerationProgress {
  stage: 'analyzing' | 'planning' | 'generating' | 'refining' | 'complete';
  message: string;
  progress: number; // 0-100
}

export interface GenerationResult {
  document: CanvasDocument;
  metadata: {
    prompt: string;
    designSystem: string;
    generatedAt: string;
    tokensUsed?: number;
  };
}

/**
 * Generate a flow diagram from a text prompt
 * 
 * @param options - Generation options including prompt and design system
 * @param onProgress - Optional callback for progress updates
 * @returns Generated canvas document
 */
export async function generateFromPrompt(
  options: GenerationOptions,
  onProgress?: (progress: GenerationProgress) => void
): Promise<GenerationResult> {
  // Phase 6 implementation placeholder
  // This will integrate with the AI service (OpenAI/Anthropic) when F026 is implemented
  
  const { prompt, designSystem = 'standard', width = 80, height = 40, title } = options;
  
  // Simulate progress for now
  if (onProgress) {
    onProgress({ stage: 'analyzing', message: 'Analyzing prompt...', progress: 10 });
    await sleep(300);
    
    onProgress({ stage: 'planning', message: 'Planning layout...', progress: 30 });
    await sleep(300);
    
    onProgress({ stage: 'generating', message: 'Generating diagram...', progress: 60 });
    await sleep(500);
    
    onProgress({ stage: 'refining', message: 'Refining details...', progress: 90 });
    await sleep(200);
    
    onProgress({ stage: 'complete', message: 'Generation complete', progress: 100 });
  }
  
  // Create a placeholder document
  // In Phase 6, this will contain the actual AI-generated diagram
  const document: CanvasDocument = {
    id: `generated-${Date.now()}`,
    title: title || `Generated: ${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}`,
    width,
    height,
    layers: [
      {
        id: 'generated-layer-1',
        name: 'Generated Content',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: {
          width,
          height,
          chars: new Uint16Array(width * height),
          fg: new Uint32Array(width * height),
          bg: new Uint32Array(width * height),
          flags: new Uint8Array(width * height)
        }
      }
    ],
    designSystem: designSystem as any, // Will be properly typed in Phase 6
    tags: ['ai-generated', designSystem],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  // Add placeholder text to the buffer
  const placeholderText = createPlaceholderDiagram(prompt, designSystem, width, height);
  writePlaceholderToBuffer(document.layers[0].buffer, placeholderText, width);
  
  return {
    document,
    metadata: {
      prompt,
      designSystem,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Create a placeholder diagram with informative text
 */
function createPlaceholderDiagram(
  prompt: string,
  designSystem: string,
  width: number,
  height: number
): string[] {
  const lines: string[] = [];
  const border = '─'.repeat(width - 4);
  
  lines.push(`┌─${border}─┐`);
  lines.push(`│ ${center('ILLUSTRATE.MD - AI GENERATION', width - 4)} │`);
  lines.push(`├─${border}─┤`);
  lines.push(`│ ${pad('', width - 4)} │`);
  lines.push(`│ ${pad('This is a placeholder for F061/F026 integration', width - 4)} │`);
  lines.push(`│ ${pad('', width - 4)} │`);
  lines.push(`│ ${pad('Prompt:', width - 4)} │`);
  
  // Wrap prompt text
  const promptLines = wrapText(prompt, width - 8);
  for (const line of promptLines.slice(0, 5)) {
    lines.push(`│ ${pad(`  "${line}"`, width - 4)} │`);
  }
  if (promptLines.length > 5) {
    lines.push(`│ ${pad('  ...', width - 4)} │`);
  }
  
  lines.push(`│ ${pad('', width - 4)} │`);
  lines.push(`│ ${pad(`Design System: ${designSystem}`, width - 4)} │`);
  lines.push(`│ ${pad(`Canvas: ${width}×${height}`, width - 4)} │`);
  lines.push(`│ ${pad('', width - 4)} │`);
  lines.push(`│ ${pad('Phase 6 (F026) will integrate with AI service', width - 4)} │`);
  lines.push(`│ ${pad('to generate actual flow diagrams from prompts.', width - 4)} │`);
  lines.push(`│ ${pad('', width - 4)} │`);
  lines.push(`└─${border}─┘`);
  
  // Fill remaining height
  while (lines.length < height) {
    lines.push('');
  }
  
  return lines.slice(0, height);
}

/**
 * Write placeholder text to buffer
 */
function writePlaceholderToBuffer(
  buffer: { chars: Uint16Array; width: number; height: number },
  lines: string[],
  width: number
): void {
  for (let y = 0; y < lines.length && y < buffer.height; y++) {
    const line = lines[y];
    for (let x = 0; x < Math.min(line.length, width); x++) {
      buffer.chars[y * width + x] = line.charCodeAt(x);
    }
  }
}

/**
 * Center text within a given width
 */
function center(text: string, width: number): string {
  if (text.length >= width) return text.substring(0, width);
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
}

/**
 * Pad text to a given width
 */
function pad(text: string, width: number): string {
  if (text.length >= width) return text.substring(0, width);
  return text + ' '.repeat(width - text.length);
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word.length <= width ? word : word.substring(0, width);
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Sleep utility for simulating async operations
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

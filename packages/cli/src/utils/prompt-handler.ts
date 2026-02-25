/**
 * Prompt Handler
 * 
 * Utilities for handling prompt input in CLI commands.
 * Supports both inline prompts and interactive mode.
 */

import * as readline from 'readline';

/**
 * Get prompt from arguments or interactive input
 * 
 * @param inlinePrompt - Prompt provided as command argument
 * @param interactive - Whether to use interactive mode
 * @returns The prompt string
 */
export async function getPrompt(
  inlinePrompt?: string,
  interactive = false
): Promise<string> {
  if (inlinePrompt && !interactive) {
    return inlinePrompt;
  }
  
  if (interactive || !inlinePrompt) {
    return await getInteractivePrompt(inlinePrompt);
  }
  
  return inlinePrompt;
}

/**
 * Get prompt through interactive input
 */
async function getInteractivePrompt(defaultPrompt?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    const question = defaultPrompt
      ? `Refine your prompt (press Enter to use: "${defaultPrompt}"):\n> `
      : 'Enter your prompt (describe the flow diagram you want to create):\n> ';
    
    rl.question(question, (answer) => {
      rl.close();
      const prompt = answer.trim() || defaultPrompt || '';
      resolve(prompt);
    });
  });
}

/**
 * Validate prompt input
 * 
 * @param prompt - The prompt to validate
 * @returns Validation result with error message if invalid
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty. Please provide a description of the flow diagram you want to create.'
    };
  }
  
  if (prompt.trim().length < 5) {
    return {
      valid: false,
      error: 'Prompt is too short. Please provide a more detailed description (at least 5 characters).'
    };
  }
  
  if (prompt.length > 1000) {
    return {
      valid: false,
      error: 'Prompt is too long. Please keep it under 1000 characters.'
    };
  }
  
  return { valid: true };
}

/**
 * Ask user if they want to refine the prompt
 */
export async function askForRefinement(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\nWould you like to refine your prompt? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
    });
  });
}

/**
 * Display prompt for confirmation
 */
export function displayPrompt(prompt: string): void {
  console.log('\nPrompt:');
  console.log('─'.repeat(Math.min(process.stdout.columns || 80, 80)));
  console.log(prompt);
  console.log('─'.repeat(Math.min(process.stdout.columns || 80, 80)));
  console.log('');
}

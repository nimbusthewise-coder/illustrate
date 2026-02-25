/**
 * F061: CLI Prompt-to-Flow Generation
 * 
 * Generate flow diagrams from natural language prompts using AI.
 * Integrates with F026 (Prompt-to-Flow Generation) service.
 */

import { getPrompt, validatePrompt, askForRefinement, displayPrompt } from '../utils/prompt-handler.js';
import { handleOutput, suggestFilename, displaySaveHint } from '../utils/output-manager.js';
import { generateFromPrompt, type GenerationProgress } from '../services/ai-generation.js';

interface GenerateOptions {
  /** Design system to use (default: standard) */
  designSystem?: string;
  
  /** Canvas width (default: 80) */
  width?: number;
  
  /** Canvas height (default: 40) */
  height?: number;
  
  /** Output file path */
  out?: string;
  
  /** Output format for file */
  format?: 'illustrate' | 'ascii' | 'markdown';
  
  /** Diagram title */
  title?: string;
  
  /** Interactive mode for prompt refinement */
  interactive?: boolean;
  
  /** Disable terminal display */
  noDisplay?: boolean;
  
  /** Disable colors in terminal output */
  noColor?: boolean;
  
  /** Disable border in terminal output */
  noBorder?: boolean;
  
  /** Quiet mode (suppress non-error output) */
  quiet?: boolean;
  
  /** Verbose mode (show detailed progress) */
  verbose?: boolean;
}

/**
 * Generate command handler
 */
export async function generateCommand(
  promptArg: string | undefined,
  options: GenerateOptions
): Promise<void> {
  try {
    // Get prompt (inline or interactive)
    let prompt = await getPrompt(promptArg, options.interactive);
    
    // Validate prompt
    let validation = validatePrompt(prompt);
    if (!validation.valid) {
      console.error(`\n❌ Invalid prompt: ${validation.error}\n`);
      process.exit(1);
    }
    
    // Display prompt if verbose or interactive
    if (options.verbose || options.interactive) {
      displayPrompt(prompt);
    }
    
    // Refinement loop (interactive mode only)
    if (options.interactive) {
      let shouldRefine = await askForRefinement();
      while (shouldRefine) {
        prompt = await getPrompt(prompt, true);
        validation = validatePrompt(prompt);
        
        if (!validation.valid) {
          console.error(`\n❌ Invalid prompt: ${validation.error}\n`);
          shouldRefine = await askForRefinement();
          continue;
        }
        
        displayPrompt(prompt);
        shouldRefine = await askForRefinement();
      }
    }
    
    // Show generation start message
    if (!options.quiet) {
      console.log('\n🎨 Generating diagram from prompt...\n');
    }
    
    // Progress callback
    let lastProgress = 0;
    const onProgress = options.quiet ? undefined : (progress: GenerationProgress) => {
      if (options.verbose) {
        console.log(`   [${progress.progress}%] ${progress.message}`);
      } else {
        // Simple progress bar
        const barWidth = 30;
        const filled = Math.floor((progress.progress / 100) * barWidth);
        const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
        
        if (progress.progress > lastProgress) {
          process.stdout.write(`\r   ${bar} ${progress.progress}%`);
          lastProgress = progress.progress;
        }
        
        if (progress.progress === 100) {
          process.stdout.write('\n');
        }
      }
    };
    
    // Generate the diagram
    const result = await generateFromPrompt(
      {
        prompt,
        designSystem: options.designSystem || 'standard',
        width: options.width || 80,
        height: options.height || 40,
        title: options.title
      },
      onProgress
    );
    
    // Show success message
    if (!options.quiet) {
      console.log('\n✓ Generation complete!\n');
    }
    
    // Handle output (display and/or save)
    await handleOutput(result.document, {
      out: options.out,
      display: !options.noDisplay,
      format: options.format || 'illustrate',
      noColor: options.noColor,
      noBorder: options.noBorder,
      quiet: options.quiet
    });
    
    // Show save hint if not saving to file
    if (!options.out && !options.quiet) {
      displaySaveHint(prompt);
    }
    
    // Display metadata if verbose
    if (options.verbose && !options.quiet) {
      console.log('\nGeneration metadata:');
      console.log(`  Prompt: "${result.metadata.prompt}"`);
      console.log(`  Design System: ${result.metadata.designSystem}`);
      console.log(`  Generated at: ${result.metadata.generatedAt}`);
      if (result.metadata.tokensUsed) {
        console.log(`  Tokens used: ${result.metadata.tokensUsed}`);
      }
      console.log('');
    }
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    // Handle errors
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}\n`);
      
      if (options.verbose) {
        console.error('Stack trace:');
        console.error(error.stack);
        console.error('');
      }
    } else {
      console.error(`\n❌ Unexpected error: ${String(error)}\n`);
    }
    
    process.exit(1);
  }
}

/**
 * Display help for generate command
 */
export function displayGenerateHelp(): void {
  console.log(`
illustrate generate - Generate flow diagrams from text prompts

USAGE
  illustrate generate [prompt] [options]

ARGUMENTS
  [prompt]              Natural language description of the flow diagram
                        (optional if using --interactive mode)

OPTIONS
  --design-system <name>    Design system to use (default: standard)
                            Available: standard, dieter, warhol, moebius, 
                            peanuts, bass, albers, mondrian, ghibli, kare,
                            klein, morris, vignelli, hockney

  -w, --width <number>      Canvas width in characters (default: 80)
  -h, --height <number>     Canvas height in characters (default: 40)
  -t, --title <title>       Diagram title
  
  -o, --out <file>          Save to file (auto-detects format from extension)
  --format <format>         Output format: illustrate, ascii, markdown
                            (default: illustrate)
  
  -i, --interactive         Interactive mode with prompt refinement
  --no-display              Don't display in terminal (save to file only)
  --no-color                Disable ANSI colors in terminal output
  --no-border               Disable border in terminal output
  
  -q, --quiet               Suppress non-error output
  -v, --verbose             Show detailed progress and metadata

EXAMPLES
  # Generate and display a login flow
  illustrate generate "user login flow with email and password"

  # Generate with specific design system
  illustrate generate "checkout process" --design-system mondrian

  # Generate and save to file
  illustrate generate "user registration" --out registration.illustrate

  # Interactive mode with refinement
  illustrate generate --interactive

  # Generate custom size diagram
  illustrate generate "dashboard layout" --width 120 --height 60

  # Generate and export as ASCII
  illustrate generate "api workflow" --out api.txt --format ascii

  # Generate and export as markdown
  illustrate generate "data pipeline" --out pipeline.md --format markdown

NOTES
  - This feature integrates with F026 (Prompt-to-Flow Generation)
  - AI generation requires Phase 6 implementation
  - Current version shows placeholder diagrams
  - Design system selection will affect component styles in Phase 6

For more information, see PRD.md §6.5 (AI-Assisted Flow Generation)
`);
}

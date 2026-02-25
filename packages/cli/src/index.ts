#!/usr/bin/env node

/**
 * illustrate.md CLI
 * 
 * Command-line interface for illustrate.md diagrams.
 * See PRD.md §7.2 for TUI features (F054-F063)
 */

import { Command } from 'commander';
import { exportCommand } from './commands/export.js';
import { copyCommand } from './commands/copy.js';
import { renderCommand } from './commands/render.js';
import { createCommand, listCommand, validateCommand, infoCommand } from './commands/file.js';
import { showCommand } from './commands/show.js';
import { generateCommand } from './commands/generate.js';

const program = new Command();

program
  .name('illustrate')
  .description('Command-line interface for illustrate.md')
  .version('0.1.0');

// F061: CLI Prompt-to-Flow Generation
program
  .command('generate [prompt]')
  .description('Generate flow diagram from text prompt using AI (F061)')
  .option('--design-system <name>', 'Design system to use (default: standard)')
  .option('-w, --width <number>', 'Canvas width in characters (default: 80)', parseInt)
  .option('-h, --height <number>', 'Canvas height in characters (default: 40)', parseInt)
  .option('-t, --title <title>', 'Diagram title')
  .option('-o, --out <file>', 'Save to file')
  .option('--format <format>', 'Output format: illustrate, ascii, markdown (default: illustrate)')
  .option('-i, --interactive', 'Interactive mode with prompt refinement')
  .option('--no-display', 'Don\'t display in terminal (save to file only)')
  .option('--no-color', 'Disable ANSI colors in terminal output')
  .option('--no-border', 'Disable border in terminal output')
  .option('-q, --quiet', 'Suppress non-error output')
  .option('-v, --verbose', 'Show detailed progress and metadata')
  .action(generateCommand);

// F062: Pipe ASCII to stdout
// F042: Markdown code block export
program
  .command('export <id>')
  .description('Export diagram as plain ASCII or markdown to stdout (F062, F042)')
  .option('-f, --file <path>', 'Load from local .illustrate file instead of cloud')
  .option('--format <format>', 'Export format: ascii or markdown (default: ascii)')
  .option('--lang <language>', 'Language hint for markdown code block (e.g., ascii, text, diagram)')
  .option('--title <title>', 'Add title as markdown heading')
  .option('--heading-level <level>', 'Heading level for title (1-6, default: 2)', parseInt)
  .option('--metadata', 'Include metadata comment (canvas size, layer count)')
  .action(exportCommand);

// F045: Copy to clipboard
program
  .command('copy <id>')
  .description('Copy diagram to system clipboard (F045)')
  .option('-f, --file <path>', 'Load from local .illustrate file instead of cloud')
  .option('-c, --colors', 'Include ANSI color codes')
  .option('-v, --verbose', 'Show detailed progress')
  .action(copyCommand);

// F054: Render in terminal
program
  .command('render <id>')
  .description('Render diagram in terminal with colors and navigation (F054)')
  .option('-f, --file <path>', 'Load from local .illustrate file instead of cloud')
  .option('--no-color', 'Disable ANSI color codes')
  .option('--no-border', 'Disable border around diagram')
  .option('--no-interactive', 'Disable interactive navigation for large diagrams')
  .option('--stream', 'Use streaming rendering for very large diagrams')
  .action(renderCommand);

// F063: Local .illustrate file operations
program
  .command('create <name>')
  .description('Create a new .illustrate file (F063)')
  .option('-w, --width <number>', 'Canvas width (default: 80)', parseInt)
  .option('-h, --height <number>', 'Canvas height (default: 24)', parseInt)
  .option('-t, --title <title>', 'Diagram title')
  .option('-a, --author <author>', 'Author name')
  .option('-d, --description <description>', 'File description')
  .action(createCommand);

program
  .command('list [directory]')
  .description('List all .illustrate files in directory (F063)')
  .option('-r, --recursive', 'Search subdirectories recursively')
  .option('-v, --validate', 'Validate each file')
  .option('-d, --detailed', 'Show detailed information')
  .action(listCommand);

program
  .command('validate <file>')
  .description('Validate a .illustrate file (F063)')
  .option('-v, --verbose', 'Show detailed file information')
  .action(validateCommand);

program
  .command('info <file>')
  .description('Show detailed information about a .illustrate file (F063)')
  .action(infoCommand);

program
  .command('show <file>')
  .description('Show diagram content from a .illustrate file (F063)')
  .option('--json', 'Output raw JSON')
  .option('--meta', 'Show metadata only')
  .action(showCommand);

program.parse();

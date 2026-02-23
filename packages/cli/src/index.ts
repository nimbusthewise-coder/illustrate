#!/usr/bin/env node

/**
 * illustrate.md CLI
 * 
 * Terminal UI for ASCII wireframing and diagramming
 * Phase 3 TUI features (F054-F063)
 */

import { Command } from 'commander';
import { createViewCommand } from './commands/view.js';
import { createExportCommand } from './commands/export.js';
import { createOpenCommand } from './commands/open.js';
import { createSaveCommand } from './commands/save.js';
import { createListCommand } from './commands/list.js';

const program = new Command();

program
  .name('illustrate')
  .description('ASCII wireframing and diagramming for the terminal')
  .version('0.1.0');

// Add commands
program.addCommand(createViewCommand());
program.addCommand(createExportCommand());
program.addCommand(createOpenCommand());
program.addCommand(createSaveCommand());
program.addCommand(createListCommand());

// Parse and execute
program.parse(process.argv);

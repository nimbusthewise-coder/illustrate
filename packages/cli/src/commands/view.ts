/**
 * View command - F054: Render diagram in terminal
 * 
 * Usage:
 *   illustrate view {id}
 *   illustrate view {username}/{id}
 */

import { Command } from 'commander';
import { renderDocumentWithFrame, detectColorLevel, ColorLevel } from '../renderer.js';
import { CanvasDocument } from '@illustrate.md/core';

/**
 * Parse diagram identifier
 * Supports: {id} or {username}/{id}
 */
function parseDiagramId(identifier: string): { username?: string; id: string } {
  const parts = identifier.split('/');
  
  if (parts.length === 2) {
    return { username: parts[0], id: parts[1] };
  }
  
  return { id: identifier };
}

/**
 * Fetch diagram from API (placeholder for Phase 3)
 * For now, this returns a mock document for demonstration
 */
async function fetchDiagram(username: string | undefined, id: string): Promise<CanvasDocument> {
  // TODO: Implement actual API fetch when backend is ready (Phase 3)
  // For now, return a demo document
  
  throw new Error(
    `API fetch not yet implemented (requires Phase 3).\n` +
    `Diagram ID: ${username ? `${username}/` : ''}${id}\n\n` +
    `To view local diagrams, use: illustrate open {file.illustrate}`
  );
}

/**
 * Create view command
 */
export function createViewCommand(): Command {
  const command = new Command('view');
  
  command
    .description('Render diagram in terminal with box-drawing chars and color')
    .argument('<identifier>', 'Diagram ID or username/id')
    .option('--no-frame', 'Hide title frame')
    .option('--color <level>', 'Override color level: none|basic|256|truecolor')
    .action(async (identifier: string, options) => {
      try {
        // Parse identifier
        const { username, id } = parseDiagramId(identifier);
        
        // Determine color level
        let colorLevel: ColorLevel | undefined;
        if (options.color) {
          const colorMap: Record<string, ColorLevel> = {
            'none': ColorLevel.None,
            'basic': ColorLevel.Basic,
            '256': ColorLevel.Ansi256,
            'truecolor': ColorLevel.TrueColor,
          };
          
          colorLevel = colorMap[options.color.toLowerCase()];
          
          if (colorLevel === undefined) {
            console.error(`Invalid color level: ${options.color}`);
            console.error(`Valid values: none, basic, 256, truecolor`);
            process.exit(1);
          }
        } else {
          // Auto-detect
          colorLevel = detectColorLevel();
        }
        
        // Fetch diagram
        const document = await fetchDiagram(username, id);
        
        // Render to terminal
        const output = renderDocumentWithFrame(document, options.frame !== false, colorLevel);
        
        // Print to stdout
        console.log(output);
        
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error: ${error.message}`);
        } else {
          console.error('An unexpected error occurred');
        }
        process.exit(1);
      }
    });
  
  return command;
}

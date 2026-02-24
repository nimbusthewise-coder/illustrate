/**
 * F054: Terminal Navigation Utilities
 * 
 * Handles keyboard input for interactive terminal navigation of large diagrams.
 */

import * as readline from 'readline';
import type { Viewport } from './terminal-layout.js';
import type { TerminalCapabilities } from './terminal-detector.js';

export type NavigationAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'pageUp'
  | 'pageDown'
  | 'home'
  | 'end'
  | 'quit'
  | 'help';

export interface NavigationState {
  viewport: Viewport;
  panX: number;
  panY: number;
}

/**
 * Setup raw mode for keyboard input
 */
export function setupRawMode(): void {
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
  }
}

/**
 * Cleanup raw mode
 */
export function cleanupRawMode(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}

/**
 * Parse keypress event to navigation action
 */
export function parseKeypress(key: { name: string; ctrl: boolean; shift: boolean }): NavigationAction | null {
  // Quit commands
  if (key.ctrl && key.name === 'c') return 'quit';
  if (key.name === 'q') return 'quit';
  if (key.name === 'escape') return 'quit';

  // Help
  if (key.name === 'h' || key.name === '?') return 'help';

  // Arrow keys
  if (key.name === 'up') return 'up';
  if (key.name === 'down') return 'down';
  if (key.name === 'left') return 'left';
  if (key.name === 'right') return 'right';

  // Page navigation
  if (key.name === 'pageup') return 'pageUp';
  if (key.name === 'pagedown') return 'pageDown';

  // Home/End
  if (key.name === 'home') return 'home';
  if (key.name === 'end') return 'end';

  // WASD keys (alternative to arrows)
  if (key.name === 'w') return 'up';
  if (key.name === 's') return 'down';
  if (key.name === 'a') return 'left';
  if (key.name === 'd') return 'right';

  return null;
}

/**
 * Apply navigation action to current state
 */
export function applyNavigation(
  action: NavigationAction,
  state: NavigationState,
  bufferWidth: number,
  bufferHeight: number,
  capabilities: TerminalCapabilities
): NavigationState {
  const stepSize = 5; // Number of characters to pan per keypress
  const pageSize = Math.floor(capabilities.height * 0.8); // 80% of screen height

  const newState = { ...state };

  switch (action) {
    case 'up':
      newState.panY = Math.max(0, state.panY - stepSize);
      break;

    case 'down':
      newState.panY = Math.min(
        bufferHeight - state.viewport.height,
        state.panY + stepSize
      );
      break;

    case 'left':
      newState.panX = Math.max(0, state.panX - stepSize);
      break;

    case 'right':
      newState.panX = Math.min(
        bufferWidth - state.viewport.width,
        state.panX + stepSize
      );
      break;

    case 'pageUp':
      newState.panY = Math.max(0, state.panY - pageSize);
      break;

    case 'pageDown':
      newState.panY = Math.min(
        bufferHeight - state.viewport.height,
        state.panY + pageSize
      );
      break;

    case 'home':
      newState.panX = 0;
      newState.panY = 0;
      break;

    case 'end':
      newState.panY = Math.max(0, bufferHeight - state.viewport.height);
      break;
  }

  // Update viewport position
  newState.viewport = {
    ...state.viewport,
    x: newState.panX,
    y: newState.panY
  };

  return newState;
}

/**
 * Get help text for navigation controls
 */
export function getNavigationHelp(): string {
  return `
Navigation Controls:
  Arrow Keys / WASD  - Pan view (5 chars at a time)
  Page Up/Down       - Scroll by page
  Home               - Go to top-left
  End                - Go to bottom
  H or ?             - Show this help
  Q or Esc or Ctrl+C - Quit

`;
}

/**
 * Clear terminal screen
 */
export function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Move cursor to position
 */
export function moveCursor(x: number, y: number): void {
  process.stdout.write(`\x1b[${y + 1};${x + 1}H`);
}

/**
 * Hide cursor
 */
export function hideCursor(): void {
  process.stdout.write('\x1b[?25l');
}

/**
 * Show cursor
 */
export function showCursor(): void {
  process.stdout.write('\x1b[?25h');
}

/**
 * Create a navigation session for interactive viewing
 */
export class NavigationSession {
  private state: NavigationState;
  private onUpdate: (state: NavigationState) => void;
  private onQuit: () => void;
  private bufferWidth: number;
  private bufferHeight: number;
  private capabilities: TerminalCapabilities;

  constructor(
    initialViewport: Viewport,
    bufferWidth: number,
    bufferHeight: number,
    capabilities: TerminalCapabilities,
    onUpdate: (state: NavigationState) => void,
    onQuit: () => void
  ) {
    this.state = {
      viewport: initialViewport,
      panX: initialViewport.x,
      panY: initialViewport.y
    };
    this.onUpdate = onUpdate;
    this.onQuit = onQuit;
    this.bufferWidth = bufferWidth;
    this.bufferHeight = bufferHeight;
    this.capabilities = capabilities;
  }

  start(): void {
    setupRawMode();
    hideCursor();

    process.stdin.on('keypress', this.handleKeypress.bind(this));

    // Initial render
    this.onUpdate(this.state);
  }

  stop(): void {
    process.stdin.removeAllListeners('keypress');
    cleanupRawMode();
    showCursor();
  }

  private handleKeypress(_str: string, key: any): void {
    if (!key) return;

    const action = parseKeypress(key);
    if (!action) return;

    if (action === 'quit') {
      this.stop();
      this.onQuit();
      return;
    }

    if (action === 'help') {
      clearScreen();
      console.log(getNavigationHelp());
      console.log('Press any key to continue...');
      
      const resumeHandler = () => {
        process.stdin.removeListener('keypress', resumeHandler);
        clearScreen();
        this.onUpdate(this.state);
      };
      
      process.stdin.once('keypress', resumeHandler);
      return;
    }

    // Apply navigation
    this.state = applyNavigation(
      action,
      this.state,
      this.bufferWidth,
      this.bufferHeight,
      this.capabilities
    );

    // Re-render
    clearScreen();
    this.onUpdate(this.state);
  }
}

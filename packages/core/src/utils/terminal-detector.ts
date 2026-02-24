/**
 * F054: Terminal Detection and Capability Assessment
 * 
 * Detects terminal type, dimensions, and capabilities for optimal rendering.
 */

export interface TerminalCapabilities {
  width: number;
  height: number;
  supportsColor: boolean;
  colorLevel: 0 | 1 | 2 | 3; // 0=none, 1=basic(16), 2=256, 3=truecolor
  supportsUnicode: boolean;
  supportsBoxDrawing: boolean;
  terminalType: string;
  isInteractive: boolean;
}

/**
 * Detect color support level
 * 0 = no color support
 * 1 = basic 16 colors (ANSI)
 * 2 = 256 colors
 * 3 = true color (16M colors)
 */
function detectColorLevel(): 0 | 1 | 2 | 3 {
  // Check if output is being redirected (non-TTY)
  if (!process.stdout.isTTY) {
    return 0;
  }

  // Check environment variables
  const env = process.env;
  
  // Explicit no color
  if ('NO_COLOR' in env || env.NODE_DISABLE_COLORS === '1') {
    return 0;
  }

  // Check COLORTERM for truecolor
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
    return 3;
  }

  // Check TERM for color support
  const term = env.TERM || '';
  
  if (term === 'dumb') {
    return 0;
  }

  if (term.includes('256color')) {
    return 2;
  }

  if (term.includes('color') || term.includes('ansi') || term.includes('xterm')) {
    return 1;
  }

  // Windows terminal detection
  if (process.platform === 'win32') {
    const version = process.version;
    const major = parseInt(version.split('.')[0].slice(1));
    
    // Windows 10+ supports ANSI colors
    if (major >= 10) {
      return 1;
    }
  }

  // Default: basic color support
  return 1;
}

/**
 * Detect Unicode and box-drawing character support
 */
function detectUnicodeSupport(): { unicode: boolean; boxDrawing: boolean } {
  const env = process.env;
  
  // Check locale/language settings
  const locale = env.LC_ALL || env.LC_CTYPE || env.LANG || '';
  const hasUTF8 = locale.toLowerCase().includes('utf');
  
  // Check terminal type
  const term = env.TERM || '';
  const termProgram = env.TERM_PROGRAM || '';
  
  // Modern terminals generally support Unicode
  const modernTerminal = 
    termProgram.includes('iTerm') ||
    termProgram.includes('Apple_Terminal') ||
    termProgram.includes('vscode') ||
    term.includes('xterm') ||
    term.includes('screen') ||
    term.includes('tmux');

  const supportsUnicode = hasUTF8 || modernTerminal;
  
  // Box drawing requires Unicode support
  const supportsBoxDrawing = supportsUnicode;

  return {
    unicode: supportsUnicode,
    boxDrawing: supportsBoxDrawing
  };
}

/**
 * Get terminal dimensions with fallbacks
 */
function getTerminalDimensions(): { width: number; height: number } {
  // Try to get from stdout
  if (process.stdout.columns && process.stdout.rows) {
    return {
      width: process.stdout.columns,
      height: process.stdout.rows
    };
  }

  // Try environment variables
  const cols = parseInt(process.env.COLUMNS || '');
  const rows = parseInt(process.env.LINES || '');
  
  if (!isNaN(cols) && !isNaN(rows)) {
    return { width: cols, height: rows };
  }

  // Fallback to common defaults
  return {
    width: 80,
    height: 24
  };
}

/**
 * Detect all terminal capabilities
 */
export function detectTerminalCapabilities(): TerminalCapabilities {
  const colorLevel = detectColorLevel();
  const { unicode, boxDrawing } = detectUnicodeSupport();
  const { width, height } = getTerminalDimensions();
  
  return {
    width,
    height,
    supportsColor: colorLevel > 0,
    colorLevel,
    supportsUnicode: unicode,
    supportsBoxDrawing: boxDrawing,
    terminalType: process.env.TERM || 'unknown',
    isInteractive: process.stdout.isTTY || false
  };
}

/**
 * Check if terminal is wide enough for a given width
 */
export function isTerminalWideEnough(requiredWidth: number, capabilities?: TerminalCapabilities): boolean {
  const caps = capabilities || detectTerminalCapabilities();
  return caps.width >= requiredWidth;
}

/**
 * Get maximum usable width (leaving margin for readability)
 */
export function getMaxUsableWidth(capabilities?: TerminalCapabilities): number {
  const caps = capabilities || detectTerminalCapabilities();
  // Leave 2 character margin on each side
  return Math.max(1, caps.width - 4);
}

/**
 * Get maximum usable height (leaving margin for UI chrome)
 */
export function getMaxUsableHeight(capabilities?: TerminalCapabilities): number {
  const caps = capabilities || detectTerminalCapabilities();
  // Leave 2 rows for UI (header/footer)
  return Math.max(1, caps.height - 2);
}

/**
 * TerminalPreview Component
 * F054: Terminal Rendering Preview
 * 
 * Shows a preview of how the diagram will render in terminal environments
 * with ANSI colors converted to HTML/CSS for web display.
 */

'use client';

import React, { useMemo, useCallback, useState } from 'react';
import type { CanvasDocument } from '@illustrate.md/core';
import {
  renderToTerminal,
  detectTerminalCapabilities,
  getTerminalRenderInfo,
  stripAnsi
} from '@illustrate.md/core';

export interface TerminalPreviewProps {
  document: CanvasDocument;
  className?: string;
  showBorder?: boolean;
  colorize?: boolean;
  showStatus?: boolean;
}

/**
 * Convert ANSI escape codes to HTML with inline styles
 * Supports basic 16 colors, 256 colors, and 24-bit truecolor
 */
function ansiToHtml(text: string): string {
  // ANSI color map for 16 basic colors
  const colorMap: { [key: string]: string } = {
    '30': '#000000', '31': '#cd0000', '32': '#00cd00', '33': '#cdcd00',
    '34': '#0000ee', '35': '#cd00cd', '36': '#00cdcd', '37': '#e5e5e5',
    '90': '#7f7f7f', '91': '#ff0000', '92': '#00ff00', '93': '#ffff00',
    '94': '#5c5cff', '95': '#ff00ff', '96': '#00ffff', '97': '#ffffff',
    
    '40': '#000000', '41': '#cd0000', '42': '#00cd00', '43': '#cdcd00',
    '44': '#0000ee', '45': '#cd00cd', '46': '#00cdcd', '47': '#e5e5e5',
    '100': '#7f7f7f', '101': '#ff0000', '102': '#00ff00', '103': '#ffff00',
    '104': '#5c5cff', '105': '#ff00ff', '106': '#00ffff', '107': '#ffffff'
  };

  let html = '';
  let currentFg = '';
  let currentBg = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '\x1b' && text[i + 1] === '[') {
      // Found ANSI escape sequence
      let j = i + 2;
      while (j < text.length && text[j] !== 'm') {
        j++;
      }

      const codes = text.substring(i + 2, j).split(';');
      
      for (let k = 0; k < codes.length; k++) {
        const code = codes[k];
        
        if (code === '0' || code === '') {
          // Reset
          currentFg = '';
          currentBg = '';
        } else if (code === '38' && codes[k + 1] === '2') {
          // 24-bit foreground color: \x1b[38;2;R;G;Bm
          const r = codes[k + 2];
          const g = codes[k + 3];
          const b = codes[k + 4];
          currentFg = `rgb(${r},${g},${b})`;
          k += 4;
        } else if (code === '48' && codes[k + 1] === '2') {
          // 24-bit background color: \x1b[48;2;R;G;Bm
          const r = codes[k + 2];
          const g = codes[k + 3];
          const b = codes[k + 4];
          currentBg = `rgb(${r},${g},${b})`;
          k += 4;
        } else if (code === '38' && codes[k + 1] === '5') {
          // 256-color foreground: \x1b[38;5;Nm
          const colorIdx = parseInt(codes[k + 2]);
          currentFg = get256Color(colorIdx);
          k += 2;
        } else if (code === '48' && codes[k + 1] === '5') {
          // 256-color background: \x1b[48;5;Nm
          const colorIdx = parseInt(codes[k + 2]);
          currentBg = get256Color(colorIdx);
          k += 2;
        } else if (colorMap[code]) {
          // 16-color
          if (parseInt(code) >= 40) {
            currentBg = colorMap[code];
          } else {
            currentFg = colorMap[code];
          }
        }
      }

      i = j + 1;
    } else {
      // Regular character
      const char = text[i];
      
      if (currentFg || currentBg) {
        const styles: string[] = [];
        if (currentFg) styles.push(`color:${currentFg}`);
        if (currentBg) styles.push(`background-color:${currentBg}`);
        html += `<span style="${styles.join(';')}">${escapeHtml(char)}</span>`;
      } else {
        html += escapeHtml(char);
      }
      
      i++;
    }
  }

  return html;
}

/**
 * Get RGB color for 256-color palette index
 */
function get256Color(index: number): string {
  if (index < 16) {
    // Use basic 16 colors
    const colors = [
      '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000ee', '#cd00cd', '#00cdcd', '#e5e5e5',
      '#7f7f7f', '#ff0000', '#00ff00', '#ffff00', '#5c5cff', '#ff00ff', '#00ffff', '#ffffff'
    ];
    return colors[index];
  } else if (index >= 232) {
    // Grayscale
    const gray = 8 + (index - 232) * 10;
    return `rgb(${gray},${gray},${gray})`;
  } else {
    // 216-color cube
    const i = index - 16;
    const r = Math.floor(i / 36) * 51;
    const g = Math.floor((i % 36) / 6) * 51;
    const b = (i % 6) * 51;
    return `rgb(${r},${g},${b})`;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(char: string): string {
  switch (char) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '"': return '&quot;';
    case "'": return '&#39;';
    case ' ': return '&nbsp;';
    default: return char;
  }
}

/**
 * TerminalPreview component
 */
export const TerminalPreview: React.FC<TerminalPreviewProps> = ({
  document,
  className = '',
  showBorder = true,
  colorize = true,
  showStatus = false
}) => {
  const [useColor, setUseColor] = useState(colorize);
  
  const { terminalOutput, renderInfo } = useMemo(() => {
    // Detect terminal capabilities (simulated for web preview)
    const capabilities = {
      width: 120,
      height: 40,
      supportsColor: useColor,
      colorLevel: (useColor ? 3 : 0) as 0 | 1 | 2 | 3, // 0=none, 1=basic(16), 2=256, 3=truecolor
      supportsUnicode: true,
      supportsBoxDrawing: true,
      terminalType: 'xterm-256color',
      isInteractive: false
    };
    
    // Get render info
    const info = getTerminalRenderInfo(document, capabilities);
    
    // Render to terminal string
    const output = renderToTerminal(document, {
      capabilities,
      colorize: useColor,
      showBorder,
      showStatus,
      centerContent: true
    });
    
    return { terminalOutput: output, renderInfo: info };
  }, [document, useColor, showBorder, showStatus]);

  const htmlOutput = useMemo(() => {
    const lines = terminalOutput.split('\n');
    return lines.map(line => ansiToHtml(line)).join('<br/>');
  }, [terminalOutput]);

  const plainOutput = useMemo(() => {
    return stripAnsi(terminalOutput);
  }, [terminalOutput]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(useColor ? terminalOutput : plainOutput);
      alert('Terminal output copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  }, [terminalOutput, plainOutput, useColor]);

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={useColor}
              onChange={(e) => setUseColor(e.target.checked)}
              className="rounded border-border"
            />
            <span>ANSI Colors</span>
          </label>
          
          <span className="text-xs text-muted-foreground">
            {renderInfo.fitsInTerminal 
              ? '✓ Fits in standard terminal' 
              : '⚠ Larger than typical terminal (120×40)'}
          </span>
        </div>
        
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Copy Output
        </button>
      </div>

      {/* Terminal Preview */}
      <div
        className="p-4 bg-terminal text-terminal-text font-mono text-sm overflow-auto rounded-lg border border-border"
        style={{
          lineHeight: '1.2',
          whiteSpace: 'pre',
          maxHeight: '600px'
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: htmlOutput }} />
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
        <div>Terminal size: {renderInfo.capabilities.width}×{renderInfo.capabilities.height}</div>
        <div>Diagram size: {document.width}×{document.height}</div>
        <div>Color level: {useColor ? ['none', 'basic (16)', '256-color', 'truecolor (24-bit)'][renderInfo.capabilities.colorLevel] : 'monochrome'}</div>
        {renderInfo.requiresInteraction && (
          <div className="text-warning">
            ⚠ This diagram requires interactive navigation in actual terminals
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalPreview;

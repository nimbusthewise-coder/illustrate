'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { exportAsPlainText, exportAsMarkdown } from '@/lib/export';

export function ExportPanel() {
  const { document } = useCanvasStore();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [languageHint, setLanguageHint] = useState('ascii');

  if (!document) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center text-muted-foreground">
        <p className="text-sm">Initialize a canvas to enable export</p>
      </div>
    );
  }

  const { layers, width, height } = document;

  const handleCopyPlainText = async () => {
    const plainText = exportAsPlainText(layers, width, height);
    await navigator.clipboard.writeText(plainText);
    setCopiedFormat('plain');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleCopyMarkdown = async () => {
    const markdown = exportAsMarkdown(layers, width, height, languageHint);
    await navigator.clipboard.writeText(markdown);
    setCopiedFormat('markdown');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadPlainText = () => {
    const plainText = exportAsPlainText(layers, width, height);
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title || 'diagram'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const markdown = exportAsMarkdown(layers, width, height, languageHint);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title || 'diagram'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-4">Export</h3>

      <div className="space-y-4">
        {/* Language Hint for Markdown */}
        <div>
          <label className="block text-sm text-muted-foreground mb-1">
            Language Hint (for Markdown)
          </label>
          <input
            type="text"
            value={languageHint}
            onChange={(e) => setLanguageHint(e.target.value)}
            placeholder="ascii"
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional language identifier (e.g., ascii, text, diagram)
          </p>
        </div>

        {/* Plain Text Export */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Plain ASCII Text</h4>
          <div className="flex gap-2">
            <button
              onClick={handleCopyPlainText}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                copiedFormat === 'plain'
                  ? 'bg-success text-white'
                  : 'bg-muted text-foreground hover:bg-accent'
              }`}
            >
              {copiedFormat === 'plain' ? '✓ Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadPlainText}
              className="flex-1 px-3 py-2 text-sm bg-muted text-foreground hover:bg-accent rounded"
            >
              Download
            </button>
          </div>
        </div>

        {/* Markdown Code Block Export */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Markdown Code Block</h4>
          <div className="flex gap-2">
            <button
              onClick={handleCopyMarkdown}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                copiedFormat === 'markdown'
                  ? 'bg-success text-white'
                  : 'bg-muted text-foreground hover:bg-accent'
              }`}
            >
              {copiedFormat === 'markdown' ? '✓ Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex-1 px-3 py-2 text-sm bg-muted text-foreground hover:bg-accent rounded"
            >
              Download
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Wrapped in triple backticks with language hint
          </p>
        </div>

        {/* Preview */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Preview</h4>
          <div className="bg-terminal text-terminal-text p-3 rounded text-xs font-mono overflow-auto max-h-48">
            <pre>{exportAsPlainText(layers, width, height)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

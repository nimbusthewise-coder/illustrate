/**
 * EmbedPreview Component
 * 
 * Preview component for testing diagram embeds across different platforms.
 * Shows how the diagram will appear in GitHub, Notion, Linear, etc.
 */

'use client';

import { useState } from 'react';

type Platform = 'github' | 'notion' | 'linear' | 'slack' | 'discord' | 'browser';

interface EmbedPreviewProps {
  diagramId: string;
  title?: string;
}

export function EmbedPreview({ diagramId, title = 'My Diagram' }: EmbedPreviewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('github');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const platforms: { id: Platform; name: string; description: string }[] = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Issues, PRs, and README files',
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Embedded in pages',
    },
    {
      id: 'linear',
      name: 'Linear',
      description: 'Issue descriptions',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Message unfurls (PNG)',
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Embed previews (PNG)',
    },
    {
      id: 'browser',
      name: 'Browser',
      description: 'Direct link preview',
    },
  ];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `${baseUrl}/api/embed/${diagramId}`;
  const embedUrlWithTheme = `${embedUrl}?theme=${theme}`;
  const svgUrl = `${baseUrl}/api/diagrams/${diagramId}/render/svg?theme=${theme}`;

  // Example markdown for different platforms
  const getMarkdownExample = () => {
    switch (selectedPlatform) {
      case 'github':
        return `# ${title}

![Diagram](${embedUrl})

Or in a README:

\`\`\`markdown
![${title}](${embedUrl})
\`\`\``;

      case 'notion':
        return `In Notion, use the /embed command and paste:
${embedUrl}

Or simply paste the URL on its own line.`;

      case 'linear':
        return `In Linear issue description:

![Diagram](${embedUrl})

The diagram will render inline in comments and descriptions.`;

      case 'slack':
      case 'discord':
        return `Just paste the URL and it will unfurl:

${embedUrl}

Note: These platforms will receive PNG format once implemented.`;

      case 'browser':
        return `Share the URL directly:

${embedUrl}

Users will see an interactive preview page.`;

      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Select Platform</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  selectedPlatform === platform.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="font-semibold">{platform.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {platform.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Toggle */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Theme</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all
              ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }
            `}
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all
              ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }
            `}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div
          className={`
            rounded-lg border-2 p-6
            ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
          `}
        >
          <img
            src={embedUrlWithTheme}
            alt={title}
            className="max-w-full h-auto"
          />
        </div>
      </div>

      {/* Usage Examples */}
      <div>
        <h3 className="text-lg font-semibold mb-3">How to Use</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {getMarkdownExample()}
          </pre>
        </div>
      </div>

      {/* URLs */}
      <div>
        <h3 className="text-lg font-semibold mb-3">URLs</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Embed URL (Platform-aware)
            </label>
            <input
              type="text"
              readOnly
              value={embedUrlWithTheme}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-800"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Direct SVG URL
            </label>
            <input
              type="text"
              readOnly
              value={svgUrl}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-800"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

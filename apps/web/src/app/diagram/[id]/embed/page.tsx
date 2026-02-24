/**
 * Embed Preview Page
 * 
 * /diagram/[id]/embed
 * 
 * Interactive page for previewing how a diagram will appear
 * when embedded in different platforms.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EmbedPreview } from '@/components/EmbedPreview';
import { checkDiagramAccess } from '@/lib/diagram-access';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function EmbedPageContent({ id }: { id: string }) {
  // Check diagram access
  const access = await checkDiagramAccess(id);

  if (access.error || !access.diagram) {
    notFound();
  }

  const diagram = access.diagram;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Embed Preview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test how your diagram appears on different platforms
          </p>
        </div>

        {/* Diagram Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {diagram.title || 'Untitled Diagram'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ID: {diagram.id}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visibility: {diagram.is_public ? 'Public' : 'Private'}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/diagram/${id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Diagram
              </a>
            </div>
          </div>

          {!diagram.is_public && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This diagram is private. Embeds will only work for you
                while logged in. To share publicly, make the diagram public first.
              </p>
            </div>
          )}
        </div>

        {/* Embed Preview Component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <EmbedPreview diagramId={id} title={diagram.title || 'Untitled Diagram'} />
        </div>

        {/* Additional Resources */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            Embedding Guide
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Our embed endpoint automatically detects the platform and serves the optimal format.
            Just use the embed URL in any of the supported platforms!
          </p>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              <strong>GitHub:</strong> Use in README.md files, issues, and pull requests
            </li>
            <li>
              <strong>Notion:</strong> Use the /embed command or paste the URL
            </li>
            <li>
              <strong>Linear:</strong> Paste in issue descriptions and comments
            </li>
            <li>
              <strong>Slack/Discord:</strong> URL unfurls automatically (PNG coming soon)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default async function EmbedPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      }
    >
      <EmbedPageContent id={id} />
    </Suspense>
  );
}

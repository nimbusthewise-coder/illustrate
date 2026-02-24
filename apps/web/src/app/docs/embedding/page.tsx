/**
 * Embedding Documentation Page
 * 
 * User-facing guide for embedding diagrams
 */

export default function EmbeddingDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          Embedding Diagrams
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Share your diagrams anywhere with native embedding support for GitHub, Notion, Linear, and more.
        </p>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Quick Start
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Every public diagram has an embed URL:
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm mb-4">
              https://illustrate.md/api/embed/{'{diagram-id}'}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300">
              Just paste this URL in any supported platform, and it will automatically render as an image!
            </p>
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Supported Platforms
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* GitHub */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                GitHub
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Works in README.md files, issues, pull requests, and wikis.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                {'![Diagram](https://illustrate.md/api/embed/abc123)'}
              </div>
            </div>

            {/* Notion */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Notion
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Use the /embed command or paste the URL directly.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                /embed https://illustrate.md/api/embed/abc123
              </div>
            </div>

            {/* Linear */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Linear
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Paste in issue descriptions and comments for inline rendering.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                {'![Diagram](https://illustrate.md/api/embed/abc123)'}
              </div>
            </div>

            {/* Browser */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Direct Links
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Share the URL directly for an interactive preview page.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                https://illustrate.md/api/embed/abc123
              </div>
            </div>
          </div>
        </section>

        {/* Customization */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Customization
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Add query parameters to customize the appearance:
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Theme
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                  ?theme=dark
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Size
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                  ?width=800&height=600
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Font Size & Padding
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                  ?fontSize=16&padding=20
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Custom Colors
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-xs">
                  ?bg=%23ffffff&fg=%23000000
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Privacy & Access
          </h2>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Public Diagrams Only
            </h3>
            <p className="text-yellow-800 dark:text-yellow-200">
              Only <strong>public</strong> diagrams can be embedded externally. Make your diagram
              public before sharing the embed URL. Private diagrams will show "Access Denied" to
              other users.
            </p>
          </div>
        </section>

        {/* Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Test Your Embeds
          </h2>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Use the embed preview page to test how your diagram will appear on different platforms:
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-3 font-mono text-sm">
              /diagram/{'{id}'}/embed
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Examples
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                GitHub README
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-sm overflow-x-auto">
{`# My Project

Architecture overview:

![Architecture](https://illustrate.md/api/embed/abc123)

## Components

![Component Diagram](https://illustrate.md/api/embed/def456?theme=dark)`}
              </pre>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                Notion Page
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-sm overflow-x-auto">
{`System Design

/embed https://illustrate.md/api/embed/abc123

The diagram above shows our microservices architecture...`}
              </pre>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                Linear Issue
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-sm overflow-x-auto">
{`## Implementation Plan

Current state:
![Current](https://illustrate.md/api/embed/abc123?width=600)

Proposed changes:
![Proposed](https://illustrate.md/api/embed/def456?width=600)`}
              </pre>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <summary className="font-semibold cursor-pointer text-gray-900 dark:text-white">
                Why isn't my embed showing?
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Make sure your diagram is public. Private diagrams require authentication and
                won't display for other users.
              </p>
            </details>
            
            <details className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <summary className="font-semibold cursor-pointer text-gray-900 dark:text-white">
                How long does caching last?
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Embeds are cached for 1-24 hours depending on the platform. Updates to your diagram
                will appear after the cache expires. You can force a refresh by adding a version
                parameter: ?v=2
              </p>
            </details>
            
            <details className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <summary className="font-semibold cursor-pointer text-gray-900 dark:text-white">
                Can I embed in other platforms?
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                The embed endpoint works anywhere that displays images from URLs. If you need
                support for a specific platform, let us know!
              </p>
            </details>
            
            <details className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <summary className="font-semibold cursor-pointer text-gray-900 dark:text-white">
                Is there a rate limit?
              </summary>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Embeds are cached aggressively, so there's no practical rate limit for viewing.
                The endpoint is designed to handle high traffic.
              </p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}

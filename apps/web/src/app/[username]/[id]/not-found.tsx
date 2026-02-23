export default function DiagramNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <pre className="text-terminal-text bg-terminal p-6 rounded-lg mb-6 text-left font-mono text-sm">
{`
╔══════════════════════════════╗
║                              ║
║         404 Not Found        ║
║                              ║
║    ┌─────────┐               ║
║    │ ? ? ? ? │               ║
║    │ ? ? ? ? │               ║
║    │ ? ? ? ? │               ║
║    └─────────┘               ║
║                              ║
║   Diagram not found          ║
║                              ║
╚══════════════════════════════╝
`}
        </pre>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Diagram Not Found
        </h1>
        <p className="text-muted-foreground mb-6">
          This diagram doesn't exist or may have been deleted.
        </p>
        <a
          href="/"
          className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-mono mb-2">illustrate.md</h1>
        <p className="text-gray-400 font-mono text-sm">
          ASCII wireframing &amp; diagramming tool
        </p>
      </div>

      <Link
        href="/editor"
        className="rounded-lg bg-white text-black px-6 py-3 font-mono font-medium hover:bg-gray-200 transition-colors"
      >
        Create New Document
      </Link>

      <pre className="text-gray-500 text-xs font-mono mt-8 select-none">
{`┌─────────────────────────┐
│   illustrate.md v0.0.1  │
│   ───────────────────    │
│   Draw. Export. Share.   │
└─────────────────────────┘`}
      </pre>
    </main>
  );
}

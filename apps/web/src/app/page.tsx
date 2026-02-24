'use client';

import { ThemeSelector } from '@/components/ThemeSelector';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tinker Project</h1>
          <ThemeSelector />
        </header>
        
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome</h2>
          <p className="text-muted-foreground">
            This project uses the Tinker Design System with 14 themes and light/dark modes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium mb-2">Semantic Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Use classes like <code className="bg-muted px-1 rounded">bg-background</code>, 
              <code className="bg-muted px-1 rounded">text-foreground</code>, 
              <code className="bg-muted px-1 rounded">border-border</code>
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium mb-2">Theme Switching</h3>
            <p className="text-sm text-muted-foreground">
              Use the theme selector above to switch between 14 designer-inspired themes.
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex gap-4">
          <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:opacity-90">
            Primary Action
          </button>
          <button className="bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:opacity-80">
            Secondary
          </button>
        </div>
      </div>
    </main>
  );
}

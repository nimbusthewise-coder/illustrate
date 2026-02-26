import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ShortcutProvider } from '@/components/providers/ShortcutProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'illustrate.md',
  description: 'Create beautiful ASCII art diagrams, wireframes, and illustrations. Perfect for documentation, README files, and anywhere you need text-based graphics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <ThemeProvider>
          <ShortcutProvider>{children}</ShortcutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

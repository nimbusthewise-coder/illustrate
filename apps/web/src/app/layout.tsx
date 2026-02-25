import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ShortcutProvider } from '@/components/providers/ShortcutProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'illustrate.md — ASCII diagrams, beautifully simple',
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
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link 
          href="https://cdn.jsdelivr.net/npm/iosevka-webfont@13.1.0/iosevka.min.css" 
          rel="stylesheet" 
        />
      </head>
      <body style={{ fontFamily: "'Iosevka Web', 'Iosevka', monospace" }}>
        <ThemeProvider>
          <ShortcutProvider>{children}</ShortcutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

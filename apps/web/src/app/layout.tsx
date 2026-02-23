import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'illustrate.md',
  description: 'ASCII wireframing and diagramming for AI-assisted development',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider>
            <OfflineIndicator />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

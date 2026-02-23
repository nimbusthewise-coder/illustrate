import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EmbedDiagramView } from '@/components/EmbedDiagramView';

interface EmbedPageProps {
  params: Promise<{
    username: string;
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

export async function generateMetadata({
  params,
}: EmbedPageProps): Promise<Metadata> {
  const { username, id } = await params;

  try {
    // Look up user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return {
        title: 'Diagram not found',
      };
    }

    // Look up document
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!document) {
      return {
        title: 'Diagram not found',
      };
    }

    return {
      title: document.title || 'Untitled Diagram',
      description: `ASCII diagram by ${username}`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Diagram',
    };
  }
}

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { username, id } = await params;
  const { token } = await searchParams;

  try {
    // Look up user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      notFound();
    }

    // Look up document
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!document) {
      notFound();
    }

    // Public diagrams: always accessible without auth
    if (document.isPublic) {
      return (
        <EmbedDiagramView
          document={document}
          username={username}
        />
      );
    }

    // Private diagrams: check for valid embed token
    if (token) {
      const embedToken = await prisma.embedToken.findUnique({
        where: { token },
      });

      if (
        embedToken &&
        embedToken.documentId === id &&
        !embedToken.revokedAt &&
        (!embedToken.expiresAt || embedToken.expiresAt > new Date())
      ) {
        return (
          <EmbedDiagramView
            document={document}
            username={username}
          />
        );
      }
    }

    // No valid access — show private message
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Private Diagram
          </h1>
          <p className="text-muted-foreground">
            This diagram is private. A valid embed token is required to view it.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching diagram:', error);
    notFound();
  }
}

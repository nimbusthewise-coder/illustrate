import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EmbedDiagramView } from '@/components/EmbedDiagramView';

interface EmbedPageProps {
  params: Promise<{
    username: string;
    id: string;
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

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { username, id } = await params;

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

    // Check if document is public
    // For now, we'll allow viewing if public
    // TODO: Add authentication check to allow owners to view private diagrams
    if (!document.isPublic) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Private Diagram
            </h1>
            <p className="text-muted-foreground">
              This diagram is private and cannot be viewed.
            </p>
          </div>
        </div>
      );
    }

    // Return the embed view
    return (
      <EmbedDiagramView
        document={document}
        username={username}
      />
    );
  } catch (error) {
    console.error('Error fetching diagram:', error);
    notFound();
  }
}

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EmbedDiagramView } from '@/components/EmbedDiagramView';

/**
 * F033: Living diagram updates on source change
 * ISR revalidation window — page will serve stale content for at most 60s
 * after a source change, then re-render with latest data on next request.
 * On-demand revalidation via revalidatePath in updateDocument provides
 * best-effort instant invalidation; this is the fallback.
 */
export const revalidate = 60;

interface EmbedPageProps {
  params: Promise<{
    username: string;
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
    v?: string; // Version parameter (also supports @v in URL)
  }>;
}

/**
 * Parse version from ID string if it contains @v syntax
 * e.g., "abc123@v2" => { id: "abc123", version: 2 }
 */
function parseVersionedId(id: string): { id: string; version: number | null } {
  const versionMatch = id.match(/^(.+)@v(\d+)$/);
  if (versionMatch) {
    return {
      id: versionMatch[1],
      version: parseInt(versionMatch[2], 10),
    };
  }
  return { id, version: null };
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
  const { username, id: rawId } = await params;
  const { token, v: versionParam } = await searchParams;

  try {
    // Parse version from URL (supports both /{id}@v2 and /{id}?v=2)
    const { id, version: urlVersion } = parseVersionedId(rawId);
    const requestedVersion = urlVersion || (versionParam ? parseInt(versionParam, 10) : null);

    // Look up user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      notFound();
    }

    // If a specific version is requested, fetch from DocumentVersion
    if (requestedVersion !== null) {
      const versionDoc = await prisma.documentVersion.findUnique({
        where: {
          documentId_version: {
            documentId: id,
            version: requestedVersion,
          },
        },
      });

      if (!versionDoc) {
        notFound();
      }

      // Get the parent document to check ownership and access control
      const parentDoc = await prisma.document.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!parentDoc) {
        notFound();
      }

      // Build a document-like object from the version
      const versionedDocument = {
        id: parentDoc.id,
        userId: parentDoc.userId,
        title: versionDoc.title,
        width: versionDoc.width,
        height: versionDoc.height,
        data: versionDoc.data,
        tags: versionDoc.tags,
        isPublic: parentDoc.isPublic,
        createdAt: versionDoc.createdAt,
        updatedAt: versionDoc.createdAt, // Version creation time
      };

      // Public diagrams: always accessible without auth
      if (parentDoc.isPublic) {
        return (
          <EmbedDiagramView
            document={versionedDocument}
            username={username}
            version={requestedVersion}
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
              document={versionedDocument}
              username={username}
              version={requestedVersion}
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
    }

    // No version specified — fetch latest version from Document
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

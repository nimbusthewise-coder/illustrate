'use server';

/**
 * Server actions for document operations with tier enforcement
 */

import { prisma } from '@/lib/prisma';
import {
  enforcePrivateDocumentCreation,
  enforceCanvasSize,
  enforceDocumentOperation,
} from '@/lib/tier-enforcement';
import { revalidatePath, revalidateTag } from 'next/cache';

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  upgradeRequired?: boolean;
};

/**
 * Create a new document with tier enforcement
 */
export async function createDocument(params: {
  userId: string;
  title: string;
  width: number;
  height: number;
  isPublic: boolean;
  tags?: string[];
  data: unknown;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, title, width, height, isPublic, tags = [], data } = params;

    // Enforce canvas size limits
    const sizeCheck = await enforceCanvasSize(userId, width, height);
    if (!sizeCheck.allowed) {
      return {
        success: false,
        error: sizeCheck.reason,
        upgradeRequired: sizeCheck.upgradeRequired,
      };
    }

    // Enforce private document creation limits
    if (!isPublic) {
      const privateCheck = await enforcePrivateDocumentCreation(userId);
      if (!privateCheck.allowed) {
        return {
          success: false,
          error: privateCheck.reason,
          upgradeRequired: privateCheck.upgradeRequired,
        };
      }
    }

    // Create the document
    const document = await prisma.document.create({
      data: {
        userId,
        title,
        width,
        height,
        isPublic,
        tags,
        data: JSON.parse(JSON.stringify(data)),
      },
    });

    revalidatePath('/dashboard');

    return {
      success: true,
      data: { id: document.id },
    };
  } catch (error) {
    console.error('Error creating document:', error);
    return {
      success: false,
      error: 'Failed to create document',
    };
  }
}

/**
 * Update document with tier enforcement
 */
export async function updateDocument(params: {
  userId: string;
  documentId: string;
  updates: {
    title?: string;
    width?: number;
    height?: number;
    isPublic?: boolean;
    tags?: string[];
    data?: unknown;
  };
}): Promise<ActionResult> {
  try {
    const { userId, documentId, updates } = params;

    // Check if user can update this document
    const opCheck = await enforceDocumentOperation(userId, documentId, 'update');
    if (!opCheck.allowed) {
      return {
        success: false,
        error: opCheck.reason,
      };
    }

    // If changing dimensions, enforce canvas size
    if (updates.width !== undefined || updates.height !== undefined) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!doc) {
        return {
          success: false,
          error: 'Document not found',
        };
      }

      const width = updates.width ?? doc.width;
      const height = updates.height ?? doc.height;

      const sizeCheck = await enforceCanvasSize(userId, width, height);
      if (!sizeCheck.allowed) {
        return {
          success: false,
          error: sizeCheck.reason,
          upgradeRequired: sizeCheck.upgradeRequired,
        };
      }
    }

    // If changing to private, check limits
    if (updates.isPublic === false) {
      const privateCheck = await enforcePrivateDocumentCreation(userId);
      if (!privateCheck.allowed) {
        return {
          success: false,
          error: privateCheck.reason,
          upgradeRequired: privateCheck.upgradeRequired,
        };
      }
    }

    // Update the document
    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.width !== undefined) updateData.width = updates.width;
    if (updates.height !== undefined) updateData.height = updates.height;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.data !== undefined) updateData.data = JSON.parse(JSON.stringify(updates.data));

    await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    revalidatePath('/dashboard');
    revalidatePath(`/documents/${documentId}`);

    // F033: Invalidate embed caches so living diagrams reflect latest saved version
    // Revalidate the embed API route
    revalidateTag(`embed-${documentId}`);
    // Revalidate the public embed page (look up username for path-based revalidation)
    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    if (owner?.username) {
      revalidatePath(`/${owner.username}/${documentId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      success: false,
      error: 'Failed to update document',
    };
  }
}

/**
 * Delete document with tier enforcement
 */
export async function deleteDocument(params: {
  userId: string;
  documentId: string;
}): Promise<ActionResult> {
  try {
    const { userId, documentId } = params;

    // Check if user can delete this document
    const opCheck = await enforceDocumentOperation(userId, documentId, 'delete');
    if (!opCheck.allowed) {
      return {
        success: false,
        error: opCheck.reason,
      };
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: 'Failed to delete document',
    };
  }
}

/**
 * Get the embed URL for a document.
 * Returns the persistent /{username}/{id} URL.
 * For public diagrams, this URL is directly accessible without auth.
 * For private diagrams, an embed token can be appended as ?token=...
 */
export async function getEmbedUrl(params: {
  userId: string;
  documentId: string;
}): Promise<ActionResult<{ url: string; apiUrl: string; isPublic: boolean }>> {
  try {
    const { userId, documentId } = params;

    // Get user to get username
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!user || !user.username) {
      return {
        success: false,
        error: 'User must have a username to generate embed URLs',
      };
    }

    // Verify document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
      select: { id: true, isPublic: true },
    });

    if (!document) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Generate embed URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/${user.username}/${documentId}`;
    const apiUrl = `${baseUrl}/api/embed/${documentId}`;

    return {
      success: true,
      data: { url, apiUrl, isPublic: document.isPublic },
    };
  } catch (error) {
    console.error('Error generating embed URL:', error);
    return {
      success: false,
      error: 'Failed to generate embed URL',
    };
  }
}

/**
 * List user's documents with optional search and sorting
 */
export async function listDocuments(
  userId: string,
  options?: {
    search?: string;
    tags?: string[];
    sortBy?: 'date' | 'name';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<
  ActionResult<
    Array<{
      id: string;
      title: string;
      width: number;
      height: number;
      tags: string[];
      isPublic: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>
  >
> {
  try {
    const { search, tags, sortBy = 'date', sortOrder = 'desc' } = options || {};

    // Build where clause
    const where: {
      userId: string;
      AND?: Array<{
        OR?: Array<{
          title?: { contains: string; mode: 'insensitive' };
          tags?: { hasSome: string[] };
        }>;
        tags?: { hasSome: string[] };
      }>;
    } = { userId };

    // Add search filter for title and tags
    if (search || tags) {
      where.AND = [];
      
      if (search) {
        where.AND.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
          ],
        });
      }
      
      if (tags && tags.length > 0) {
        where.AND.push({
          tags: { hasSome: tags },
        });
      }
    }

    // Build orderBy clause
    const orderBy =
      sortBy === 'name'
        ? { title: sortOrder }
        : { updatedAt: sortOrder };

    const documents = await prisma.document.findMany({
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        width: true,
        height: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    console.error('Error listing documents:', error);
    return {
      success: false,
      error: 'Failed to load documents',
    };
  }
}

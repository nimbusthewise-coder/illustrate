import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    document: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock tier enforcement
vi.mock('@/lib/tier-enforcement', () => ({
  enforcePrivateDocumentCreation: vi.fn(),
  enforceCanvasSize: vi.fn(),
  enforceDocumentOperation: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { getEmbedUrl, updateDocument } from './document-actions';
import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { enforceDocumentOperation } from '@/lib/tier-enforcement';

describe('getEmbedUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://illustrate.md';
  });

  it('should generate correct embed URL for valid user and document', async () => {
    const userId = 'user123';
    const documentId = 'doc456';
    const username = 'testuser';

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: userId,
      username,
    } as any);

    vi.mocked(prisma.document.findFirst).mockResolvedValue({
      id: documentId,
    } as any);

    const result = await getEmbedUrl({ userId, documentId });

    expect(result.success).toBe(true);
    expect(result.data?.url).toBe(`https://illustrate.md/${username}/${documentId}`);
  });

  it('should return error if user has no username', async () => {
    const userId = 'user123';
    const documentId = 'doc456';

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: userId,
      username: null,
    } as any);

    const result = await getEmbedUrl({ userId, documentId });

    expect(result.success).toBe(false);
    expect(result.error).toBe('User must have a username to generate embed URLs');
  });

  it('should return error if user not found', async () => {
    const userId = 'user123';
    const documentId = 'doc456';

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await getEmbedUrl({ userId, documentId });

    expect(result.success).toBe(false);
    expect(result.error).toBe('User must have a username to generate embed URLs');
  });

  it('should return error if document not found', async () => {
    const userId = 'user123';
    const documentId = 'doc456';
    const username = 'testuser';

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: userId,
      username,
    } as any);

    vi.mocked(prisma.document.findFirst).mockResolvedValue(null);

    const result = await getEmbedUrl({ userId, documentId });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Document not found');
  });

  it('should return apiUrl in response', async () => {
    const userId = 'user123';
    const documentId = 'doc456';
    const username = 'testuser';

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: userId,
      username,
    } as any);

    vi.mocked(prisma.document.findFirst).mockResolvedValue({
      id: documentId,
      isPublic: true,
    } as any);

    const result = await getEmbedUrl({ userId, documentId });

    expect(result.success).toBe(true);
    expect(result.data?.apiUrl).toBe(`https://illustrate.md/api/embed/${documentId}`);
  });

  it('should maintain URL stability - same URL for same inputs', async () => {
    const userId = 'user123';
    const documentId = 'doc456';
    const username = 'testuser';

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: userId,
      username,
    } as any);

    vi.mocked(prisma.document.findFirst).mockResolvedValue({
      id: documentId,
    } as any);

    const result1 = await getEmbedUrl({ userId, documentId });
    const result2 = await getEmbedUrl({ userId, documentId });

    expect(result1.data?.url).toBe(result2.data?.url);
  });
});

describe('F033: Living diagram updates on source change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://illustrate.md';
  });

  it('should revalidate embed cache tags when document is updated', async () => {
    const userId = 'user123';
    const documentId = 'doc456';

    vi.mocked(enforceDocumentOperation).mockResolvedValue({
      allowed: true,
    } as any);

    vi.mocked(prisma.document.update).mockResolvedValue({
      id: documentId,
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: userId,
      username: 'alice',
    } as any);

    const result = await updateDocument({
      userId,
      documentId,
      updates: { data: { layers: [] } },
    });

    expect(result.success).toBe(true);
    // F033: embed tag should be revalidated
    expect(revalidateTag).toHaveBeenCalledWith(`embed-${documentId}`);
  });

  it('should revalidate embed page path when document is updated', async () => {
    const userId = 'user123';
    const documentId = 'doc456';

    vi.mocked(enforceDocumentOperation).mockResolvedValue({
      allowed: true,
    } as any);

    vi.mocked(prisma.document.update).mockResolvedValue({
      id: documentId,
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: userId,
      username: 'alice',
    } as any);

    const result = await updateDocument({
      userId,
      documentId,
      updates: { title: 'Updated Title' },
    });

    expect(result.success).toBe(true);
    // F033: embed page path should be revalidated
    expect(revalidatePath).toHaveBeenCalledWith('/alice/doc456');
  });

  it('should handle missing username gracefully during revalidation', async () => {
    const userId = 'user123';
    const documentId = 'doc456';

    vi.mocked(enforceDocumentOperation).mockResolvedValue({
      allowed: true,
    } as any);

    vi.mocked(prisma.document.update).mockResolvedValue({
      id: documentId,
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await updateDocument({
      userId,
      documentId,
      updates: { data: { layers: [] } },
    });

    // Should still succeed even if username lookup fails
    expect(result.success).toBe(true);
    // Tag revalidation should still happen
    expect(revalidateTag).toHaveBeenCalledWith(`embed-${documentId}`);
    // Path revalidation should happen for dashboard/documents but NOT for embed page
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(revalidatePath).toHaveBeenCalledWith('/documents/doc456');
    // Should only be called twice (no embed page revalidation since no username)
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });
});

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
}));

import { getEmbedUrl } from './document-actions';
import { prisma } from '@/lib/prisma';

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

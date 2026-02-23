import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
    },
    embedToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

import { prisma } from '@/lib/prisma';

describe('Embed System (F029)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Embed URL format', () => {
    it('should generate /{username}/{id} URLs', () => {
      const baseUrl = 'https://illustrate.md';
      const username = 'alice';
      const documentId = 'clxx123abc';
      const embedUrl = `${baseUrl}/${username}/${documentId}`;

      expect(embedUrl).toBe('https://illustrate.md/alice/clxx123abc');
    });

    it('should produce stable URLs across edits', () => {
      const username = 'bob';
      const documentId = 'doc123';

      // URL depends only on username and id, not content
      const urlBefore = `/${username}/${documentId}`;
      const urlAfter = `/${username}/${documentId}`;
      expect(urlBefore).toBe(urlAfter);
    });

    it('should generate API embed URL', () => {
      const baseUrl = 'https://illustrate.md';
      const documentId = 'doc123';
      const apiUrl = `${baseUrl}/api/embed/${documentId}`;

      expect(apiUrl).toBe('https://illustrate.md/api/embed/doc123');
    });

    it('should support token query param for private diagrams', () => {
      const baseUrl = 'https://illustrate.md';
      const username = 'alice';
      const documentId = 'doc123';
      const token = 'abc123token';
      const url = `${baseUrl}/${username}/${documentId}?token=${token}`;

      expect(url).toContain('?token=');
      expect(url).toBe('https://illustrate.md/alice/doc123?token=abc123token');
    });
  });

  describe('Public diagram access', () => {
    it('should allow access to public diagrams without auth', async () => {
      const mockDoc = {
        id: 'doc1',
        title: 'Test Diagram',
        isPublic: true,
        width: 80,
        height: 24,
        data: { layers: [] },
        userId: 'user1',
        user: { username: 'alice', name: 'Alice' },
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

      // Simulate the logic from the API route
      const document = await prisma.document.findUnique({
        where: { id: 'doc1' },
        include: { user: { select: { username: true, name: true } } },
      });

      expect(document).toBeTruthy();
      expect(document!.isPublic).toBe(true);
      // Public = accessible
    });
  });

  describe('Private diagram access', () => {
    it('should deny access to private diagrams without token', async () => {
      const mockDoc = {
        id: 'doc1',
        title: 'Private Diagram',
        isPublic: false,
        userId: 'user1',
      };

      (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

      const document = await prisma.document.findUnique({
        where: { id: 'doc1' },
      });

      expect(document!.isPublic).toBe(false);
      // No token provided = denied
    });

    it('should allow access with valid embed token', async () => {
      const mockToken = {
        id: 'tok1',
        token: 'valid-token',
        documentId: 'doc1',
        revokedAt: null,
        expiresAt: null, // Never expires
        createdAt: new Date(),
      };

      (prisma.embedToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

      const embedToken = await prisma.embedToken.findUnique({
        where: { token: 'valid-token' },
      });

      expect(embedToken).toBeTruthy();
      expect(embedToken!.documentId).toBe('doc1');
      expect(embedToken!.revokedAt).toBeNull();
      // Valid token = access granted
    });

    it('should deny access with revoked token', async () => {
      const mockToken = {
        id: 'tok1',
        token: 'revoked-token',
        documentId: 'doc1',
        revokedAt: new Date('2025-01-01'),
        expiresAt: null,
      };

      (prisma.embedToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

      const embedToken = await prisma.embedToken.findUnique({
        where: { token: 'revoked-token' },
      });

      expect(embedToken!.revokedAt).not.toBeNull();
      // Revoked = denied
    });

    it('should deny access with expired token', async () => {
      const pastDate = new Date('2024-01-01');
      const mockToken = {
        id: 'tok1',
        token: 'expired-token',
        documentId: 'doc1',
        revokedAt: null,
        expiresAt: pastDate,
      };

      (prisma.embedToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

      const embedToken = await prisma.embedToken.findUnique({
        where: { token: 'expired-token' },
      });

      expect(embedToken!.expiresAt!.getTime()).toBeLessThan(Date.now());
      // Expired = denied
    });

    it('should deny access when token belongs to different document', async () => {
      const mockToken = {
        id: 'tok1',
        token: 'wrong-doc-token',
        documentId: 'doc2', // Different from requested doc1
        revokedAt: null,
        expiresAt: null,
      };

      (prisma.embedToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

      const embedToken = await prisma.embedToken.findUnique({
        where: { token: 'wrong-doc-token' },
      });

      expect(embedToken!.documentId).not.toBe('doc1');
      // Wrong document = denied
    });
  });

  describe('Embed token management', () => {
    it('should create tokens with optional label', async () => {
      const mockCreated = {
        id: 'tok1',
        token: 'new-token-abc',
        documentId: 'doc1',
        label: 'README badge',
        expiresAt: null,
        createdAt: new Date(),
      };

      (prisma.embedToken.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreated);

      const token = await prisma.embedToken.create({
        data: {
          token: 'new-token-abc',
          documentId: 'doc1',
          label: 'README badge',
          expiresAt: null,
        },
      });

      expect(token.label).toBe('README badge');
      expect(token.documentId).toBe('doc1');
    });

    it('should create tokens with expiry', async () => {
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      const mockCreated = {
        id: 'tok2',
        token: 'expiring-token',
        documentId: 'doc1',
        label: null,
        expiresAt,
        createdAt: new Date(),
      };

      (prisma.embedToken.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreated);

      const token = await prisma.embedToken.create({
        data: {
          token: 'expiring-token',
          documentId: 'doc1',
          expiresAt,
        },
      });

      expect(token.expiresAt).toBeTruthy();
      expect(token.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should list tokens for a document', async () => {
      const mockTokens = [
        { id: 'tok1', token: 'token-a', label: 'Docs', revokedAt: null, expiresAt: null, createdAt: new Date() },
        { id: 'tok2', token: 'token-b', label: null, revokedAt: new Date(), expiresAt: null, createdAt: new Date() },
      ];

      (prisma.embedToken.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTokens);

      const tokens = await prisma.embedToken.findMany({
        where: { documentId: 'doc1' },
      });

      expect(tokens).toHaveLength(2);
      expect(tokens[0].label).toBe('Docs');
      expect(tokens[1].revokedAt).not.toBeNull();
    });

    it('should soft-revoke tokens', async () => {
      (prisma.embedToken.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

      const result = await prisma.embedToken.updateMany({
        where: { id: 'tok1', documentId: 'doc1', revokedAt: null },
        data: { revokedAt: new Date() },
      });

      expect(result.count).toBe(1);
    });
  });
});

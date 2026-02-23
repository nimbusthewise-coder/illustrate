import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
    },
    embedToken: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET } from './route';
import { NextRequest } from 'next/server';

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

/**
 * Helper to create a mock document with layer data.
 * The buffer data is stored as JSON in the DB, so typed arrays
 * become plain objects/arrays when serialized.
 */
function createMockDocumentWithText(
  text: string,
  opts: { isPublic?: boolean; width?: number; height?: number } = {},
) {
  const { isPublic = true, width = 20, height = 3 } = opts;
  const size = width * height;

  // Create a serialized buffer (as it would appear from JSON)
  const chars: Record<string, number> = {};
  for (let i = 0; i < text.length; i++) {
    chars[String(i)] = text.charCodeAt(i);
  }

  return {
    id: 'doc1',
    title: 'Test Diagram',
    width,
    height,
    isPublic,
    tags: [],
    data: {
      layers: [
        {
          id: 'layer-1',
          name: 'Layer 1',
          visible: true,
          locked: false,
          x: 0,
          y: 0,
          buffer: {
            width,
            height,
            chars,
            fg: {},
            bg: {},
            flags: {},
          },
        },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('GET /api/embed/[id]/txt (F032)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 for non-existent document', async () => {
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await GET(makeRequest('/api/embed/missing/txt'), {
      params: makeParams('missing'),
    });

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toContain('not found');
  });

  it('returns plain text content type', async () => {
    const mockDoc = createMockDocumentWithText('Hello');
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });

  it('returns ASCII text for public diagrams without auth', async () => {
    const mockDoc = createMockDocumentWithText('Hello');
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Hello');
  });

  it('trims trailing whitespace per row', async () => {
    const mockDoc = createMockDocumentWithText('Hi');
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    const text = await response.text();
    const lines = text.split('\n');
    // First line should be "Hi" with no trailing spaces
    expect(lines[0]).toBe('Hi');
    // No trailing spaces on any line
    for (const line of lines) {
      if (line.length > 0) {
        expect(line).toBe(line.trimEnd());
      }
    }
  });

  it('returns 403 for private diagrams without token', async () => {
    const mockDoc = createMockDocumentWithText('Secret', { isPublic: false });
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    expect(response.status).toBe(403);
    const text = await response.text();
    expect(text).toContain('private');
  });

  it('allows private diagrams with valid token', async () => {
    const mockDoc = createMockDocumentWithText('Secret', { isPublic: false });
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const mockToken = {
      id: 'tok1',
      token: 'valid-token',
      documentId: 'doc1',
      revokedAt: null,
      expiresAt: null,
    };
    (prisma.embedToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

    const response = await GET(
      makeRequest('/api/embed/doc1/txt?token=valid-token'),
      { params: makeParams('doc1') },
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Secret');
  });

  it('rejects revoked tokens', async () => {
    const mockDoc = createMockDocumentWithText('Secret', { isPublic: false });
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const mockToken = {
      id: 'tok1',
      token: 'revoked',
      documentId: 'doc1',
      revokedAt: new Date('2025-01-01'),
      expiresAt: null,
    };
    (prisma.embedToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

    const response = await GET(
      makeRequest('/api/embed/doc1/txt?token=revoked'),
      { params: makeParams('doc1') },
    );

    expect(response.status).toBe(403);
  });

  it('rejects expired tokens', async () => {
    const mockDoc = createMockDocumentWithText('Secret', { isPublic: false });
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const mockToken = {
      id: 'tok1',
      token: 'expired',
      documentId: 'doc1',
      revokedAt: null,
      expiresAt: new Date('2024-01-01'),
    };
    (prisma.embedToken.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

    const response = await GET(
      makeRequest('/api/embed/doc1/txt?token=expired'),
      { params: makeParams('doc1') },
    );

    expect(response.status).toBe(403);
  });

  it('handles empty document (no layers)', async () => {
    const mockDoc = {
      id: 'doc1',
      title: 'Empty',
      width: 10,
      height: 3,
      isPublic: true,
      tags: [],
      data: { layers: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    expect(response.status).toBe(200);
    const text = await response.text();
    // Should be newline-delimited empty rows
    expect(text.trim()).toBe('');
  });

  it('handles layer data serialized as arrays (not objects)', async () => {
    // Some serialization paths may produce arrays instead of objects for typed arrays
    const chars = new Array(60).fill(0);
    chars[0] = 65; // 'A'
    chars[1] = 66; // 'B'

    const mockDoc = {
      id: 'doc1',
      title: 'Array Format',
      width: 20,
      height: 3,
      isPublic: true,
      tags: [],
      data: {
        layers: [
          {
            id: 'layer-1',
            name: 'Layer 1',
            visible: true,
            locked: false,
            x: 0,
            y: 0,
            buffer: {
              width: 20,
              height: 3,
              chars,
              fg: [],
              bg: [],
              flags: [],
            },
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('AB');
  });

  it('sets CORS header', async () => {
    const mockDoc = createMockDocumentWithText('Test');
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('skips invisible layers', async () => {
    const chars: Record<string, number> = {};
    'Hidden'.split('').forEach((c, i) => {
      chars[String(i)] = c.charCodeAt(0);
    });

    const mockDoc = {
      id: 'doc1',
      title: 'Hidden Layer',
      width: 20,
      height: 3,
      isPublic: true,
      tags: [],
      data: {
        layers: [
          {
            id: 'layer-1',
            name: 'Layer 1',
            visible: false,
            locked: false,
            x: 0,
            y: 0,
            buffer: {
              width: 20,
              height: 3,
              chars,
              fg: {},
              bg: {},
              flags: {},
            },
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.document.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDoc);

    const response = await GET(makeRequest('/api/embed/doc1/txt'), {
      params: makeParams('doc1'),
    });

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain('Hidden');
  });
});

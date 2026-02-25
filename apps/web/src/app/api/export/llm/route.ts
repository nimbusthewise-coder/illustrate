/**
 * LLM Export API
 * F028: LLM-Readable Export Format with Semantic Annotations
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportLLMFormat, exportLLMFormatAsText } from '@illustrate.md/core';
import type { CanvasDocument } from '@illustrate.md/core';

/**
 * POST /api/export/llm
 * 
 * Export a canvas document in LLM-readable format.
 * 
 * Request body:
 * - document: CanvasDocument
 * - format: 'json' | 'text' (default: 'json')
 * 
 * Response (format=json):
 * - LLMExportFormat JSON object
 * 
 * Response (format=text):
 * - Plain text markdown with semantic annotations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, format = 'json' } = body as {
      document: CanvasDocument;
      format?: 'json' | 'text';
    };

    if (!document) {
      return NextResponse.json(
        { error: 'Missing document in request body' },
        { status: 400 }
      );
    }

    if (!document.layers || !Array.isArray(document.layers)) {
      return NextResponse.json(
        { error: 'Invalid document structure: missing layers array' },
        { status: 400 }
      );
    }

    if (typeof document.width !== 'number' || typeof document.height !== 'number') {
      return NextResponse.json(
        { error: 'Invalid document structure: width and height must be numbers' },
        { status: 400 }
      );
    }

    if (format !== 'json' && format !== 'text') {
      return NextResponse.json(
        { error: 'Invalid format: must be "json" or "text"' },
        { status: 400 }
      );
    }

    if (format === 'text') {
      const text = exportLLMFormatAsText(document);
      return new NextResponse(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }

    // Default: JSON format
    const result = exportLLMFormat(document);
    return NextResponse.json(result);
  } catch (error) {
    console.error('LLM export error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to export LLM format',
      },
      { status: 500 }
    );
  }
}

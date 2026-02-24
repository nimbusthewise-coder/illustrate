/**
 * Markdown Export API
 * F042: Markdown Code Block Export
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportMarkdownCodeBlock } from '@illustrate.md/core';
import type { CanvasDocument, MarkdownExportOptions } from '@illustrate.md/core';

/**
 * POST /api/export/markdown
 * 
 * Export a canvas document as markdown code block.
 * 
 * Request body:
 * - document: CanvasDocument
 * - options: MarkdownExportOptions (optional)
 * 
 * Response:
 * - markdown: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, options } = body as {
      document: CanvasDocument;
      options?: MarkdownExportOptions;
    };

    if (!document) {
      return NextResponse.json(
        { error: 'Missing document in request body' },
        { status: 400 }
      );
    }

    // Validate document structure
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

    // Validate options if provided
    if (options) {
      if (options.headingLevel !== undefined) {
        const level = options.headingLevel;
        if (level < 1 || level > 6) {
          return NextResponse.json(
            { error: 'Invalid heading level: must be between 1 and 6' },
            { status: 400 }
          );
        }
      }

      if (options.title !== undefined && typeof options.title !== 'string') {
        return NextResponse.json(
          { error: 'Invalid title: must be a string' },
          { status: 400 }
        );
      }

      if (options.language !== undefined && typeof options.language !== 'string') {
        return NextResponse.json(
          { error: 'Invalid language: must be a string' },
          { status: 400 }
        );
      }
    }

    // Export to markdown
    const markdown = exportMarkdownCodeBlock(document, options);

    return NextResponse.json({
      markdown,
      metadata: {
        width: document.width,
        height: document.height,
        layerCount: document.layers.filter(l => l.visible).length,
        totalLayers: document.layers.length,
      },
    });
  } catch (error) {
    console.error('Markdown export error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to export markdown'
      },
      { status: 500 }
    );
  }
}

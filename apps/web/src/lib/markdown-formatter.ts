/**
 * Markdown Formatting Helpers — F042: Markdown Code Block Export
 * 
 * Utility functions for markdown formatting and validation.
 * Used by the web UI export dialog.
 */

/**
 * Options for exporting to Markdown format
 */
export interface MarkdownExportOptions {
  language?: string;
  headingLevel?: number;
  includeMetadata?: boolean;
  title?: string;
}

/**
 * Supported code block languages for ASCII diagrams.
 */
export const MARKDOWN_LANGUAGES = [
  { value: 'text', label: 'Plain Text' },
  { value: 'ascii', label: 'ASCII Art' },
  { value: 'diagram', label: 'Diagram' },
  { value: '', label: 'No Language' },
] as const;

/**
 * Validate markdown export options.
 * 
 * @param options - Options to validate
 * @returns Validation result with error message if invalid
 */
export function validateMarkdownOptions(
  options: MarkdownExportOptions
): { valid: boolean; error?: string } {
  if (options.headingLevel && (options.headingLevel < 1 || options.headingLevel > 6)) {
    return {
      valid: false,
      error: 'Heading level must be between 1 and 6',
    };
  }

  if (options.title && options.title.trim().length === 0) {
    return {
      valid: false,
      error: 'Title cannot be empty',
    };
  }

  return { valid: true };
}

/**
 * Get default markdown export options.
 * 
 * @returns Default options for markdown export
 */
export function getDefaultMarkdownOptions(): MarkdownExportOptions {
  return {
    language: 'text',
    headingLevel: 2,
    includeMetadata: false,
  };
}

/**
 * Format file name for markdown export.
 * Ensures proper .md extension.
 * 
 * @param baseName - Base file name without extension
 * @returns File name with .md extension
 */
export function formatMarkdownFileName(baseName: string): string {
  const cleaned = baseName.trim();
  if (cleaned.endsWith('.md')) {
    return cleaned;
  }
  return `${cleaned}.md`;
}

/**
 * Preview markdown export format.
 * Generates a preview string showing how the markdown will look.
 * 
 * @param options - Markdown export options
 * @param contentPreview - Short preview of the ASCII content
 * @returns Preview string
 */
export function previewMarkdownFormat(
  options: MarkdownExportOptions,
  contentPreview: string = '...'
): string {
  const parts: string[] = [];

  if (options.title) {
    const heading = '#'.repeat(options.headingLevel || 2);
    parts.push(`${heading} ${options.title}`);
    parts.push('');
  }

  if (options.includeMetadata) {
    parts.push('<!-- Canvas: ... | Layers: ... -->');
    parts.push('');
  }

  parts.push(`\`\`\`${options.language || 'text'}`);
  parts.push(contentPreview);
  parts.push('```');

  return parts.join('\n');
}

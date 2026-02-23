/**
 * List command - F057: List all user diagrams
 * 
 * Usage: illustrate list [options]
 * Example: illustrate list --format json
 */

import { Command } from 'commander';

const DEFAULT_API_URL = process.env.ILLUSTRATE_API_URL || 'http://localhost:3000';

/**
 * Document summary for list view
 */
interface DocumentSummary {
  id: string;
  title: string;
  width: number;
  height: number;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response structure
 */
interface ListResponse {
  documents: DocumentSummary[];
}

/**
 * Fetch user's documents from the API
 */
async function fetchDocuments(
  apiUrl: string,
  token?: string
): Promise<DocumentSummary[]> {
  const url = `${apiUrl}/api/documents`;
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authentication if token provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Please provide a valid API token');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as ListResponse;
    return data.documents;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch documents: ${error}`);
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffMins > 0) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  }
  return 'just now';
}

/**
 * Truncate string to max length with ellipsis
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Render documents as a formatted table
 */
function renderTable(documents: DocumentSummary[]): string {
  if (documents.length === 0) {
    return 'No diagrams found.\n';
  }
  
  // Calculate column widths
  const titleWidth = 40;
  const idWidth = 12;
  const updatedWidth = 16;
  const visibilityWidth = 10;
  
  // Header
  const header = [
    'TITLE'.padEnd(titleWidth),
    'ID'.padEnd(idWidth),
    'UPDATED'.padEnd(updatedWidth),
    'VISIBILITY',
  ].join(' │ ');
  
  const separator = '─'.repeat(header.length);
  
  // Rows
  const rows = documents.map((doc) => {
    const title = truncate(doc.title, titleWidth).padEnd(titleWidth);
    const id = truncate(doc.id, idWidth).padEnd(idWidth);
    const updated = formatRelativeTime(doc.updatedAt).padEnd(updatedWidth);
    const visibility = (doc.isPublic ? 'public' : 'private').padEnd(visibilityWidth);
    
    return [title, id, updated, visibility].join(' │ ');
  });
  
  return [header, separator, ...rows].join('\n') + '\n';
}

/**
 * Create the list command
 */
export function createListCommand(): Command {
  const command = new Command('list');
  
  command
    .description('List all user diagrams')
    .option('--format <format>', 'Output format (table|json)', 'table')
    .option('--token <token>', 'API authentication token (or use ILLUSTRATE_API_TOKEN env var)')
    .option('--api-url <url>', 'API base URL', DEFAULT_API_URL)
    .action(async (options: { 
      format: string; 
      token?: string;
      apiUrl: string;
    }) => {
      try {
        // Get token from option or environment variable
        const token = options.token || process.env.ILLUSTRATE_API_TOKEN;
        
        if (!token) {
          process.stderr.write(
            'Error: No API token provided.\n' +
            'Please set ILLUSTRATE_API_TOKEN environment variable or use --token option.\n'
          );
          process.exit(1);
        }
        
        // Validate format option
        if (options.format !== 'table' && options.format !== 'json') {
          process.stderr.write(`Error: Invalid format "${options.format}". Use "table" or "json".\n`);
          process.exit(1);
        }
        
        // Fetch documents from API
        const documents = await fetchDocuments(options.apiUrl, token);
        
        // Output in requested format
        if (options.format === 'json') {
          // JSON format for scripting
          process.stdout.write(JSON.stringify(documents, null, 2) + '\n');
        } else {
          // Table format for human reading
          const output = renderTable(documents);
          process.stdout.write(output);
        }
        
        process.exit(0);
      } catch (error) {
        if (error instanceof Error) {
          process.stderr.write(`Error: ${error.message}\n`);
        } else {
          process.stderr.write(`Error: ${error}\n`);
        }
        process.exit(1);
      }
    });
  
  return command;
}

/**
 * Database schema for diagram library
 * F048: Diagram Library
 * 
 * This file documents the extended Supabase schema for the diagram library.
 * Run these SQL statements in your Supabase SQL editor to extend the diagrams table.
 */

/**
 * Extended diagrams table schema for library features
 */
export const DIAGRAMS_LIBRARY_SCHEMA = `
-- Extend diagrams table with library features
ALTER TABLE diagrams 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS template_category TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES diagrams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS embed_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS embed_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS embed_privacy TEXT DEFAULT 'private' CHECK (embed_privacy IN ('public', 'unlisted', 'private')),
  ADD COLUMN IF NOT EXISTS embed_views INTEGER DEFAULT 0;

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_diagrams_tags 
  ON diagrams USING GIN(tags);

-- Create index for templates
CREATE INDEX IF NOT EXISTS idx_diagrams_template 
  ON diagrams(is_template, template_category) 
  WHERE is_template = TRUE;

-- Create index for favorites
CREATE INDEX IF NOT EXISTS idx_diagrams_favorites 
  ON diagrams(user_id, is_favorite) 
  WHERE is_favorite = TRUE;

-- Create index for last opened
CREATE INDEX IF NOT EXISTS idx_diagrams_last_opened 
  ON diagrams(user_id, last_opened_at DESC);

-- Create index for embed_id lookups
CREATE INDEX IF NOT EXISTS idx_diagrams_embed_id 
  ON diagrams(embed_id) 
  WHERE embed_id IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_diagrams_search 
  ON diagrams USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Add computed column for search
ALTER TABLE diagrams 
  ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_diagrams_search_vector 
  ON diagrams USING GIN(search_vector);
`;

/**
 * diagram_versions table for version history
 */
export const DIAGRAM_VERSIONS_SCHEMA = `
-- Create diagram_versions table
CREATE TABLE IF NOT EXISTS diagram_versions (
  id TEXT PRIMARY KEY,
  diagram_id TEXT NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layers JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  change_description TEXT,
  
  UNIQUE(diagram_id, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_diagram_versions_diagram_id 
  ON diagram_versions(diagram_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_diagram_versions_user_id 
  ON diagram_versions(user_id);

-- Enable Row Level Security
ALTER TABLE diagram_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own diagram versions"
  ON diagram_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagram versions"
  ON diagram_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
`;

/**
 * diagram_shares table for sharing diagrams
 */
export const DIAGRAM_SHARES_SCHEMA = `
-- Create diagram_shares table for future sharing functionality
CREATE TABLE IF NOT EXISTS diagram_shares (
  id TEXT PRIMARY KEY,
  diagram_id TEXT NOT NULL REFERENCES diagrams(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view', -- 'view' or 'edit'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(diagram_id, shared_with_email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_diagram_shares_diagram_id 
  ON diagram_shares(diagram_id);

CREATE INDEX IF NOT EXISTS idx_diagram_shares_email 
  ON diagram_shares(shared_with_email);

-- Enable Row Level Security
ALTER TABLE diagram_shares ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view shares for their diagrams"
  ON diagram_shares FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create shares for their diagrams"
  ON diagram_shares FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete shares for their diagrams"
  ON diagram_shares FOR DELETE
  USING (auth.uid() = owner_id);
`;

/**
 * TypeScript types for the extended schema
 */
export interface DiagramLibraryItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  layers: unknown;
  tags: string[];
  thumbnail: string | null;
  is_template: boolean;
  template_category: string | null;
  version: number;
  parent_id: string | null;
  is_favorite: boolean;
  last_opened_at: string | null;
  embed_id: string | null;
  embed_enabled: boolean;
  embed_privacy: 'public' | 'unlisted' | 'private';
  embed_views: number;
  metadata: DiagramMetadata | null;
  created_at: string;
  updated_at: string;
  sync_version: number;
  sync_checksum: string | null;
  last_modified_by: string | null;
  last_modified_at: number | null;
}

export interface DiagramMetadata {
  author?: string;
  characterSet?: string;
  exportedFormats?: string[];
  statistics?: {
    cellCount?: number;
    layerCount?: number;
    componentCount?: number;
  };
  [key: string]: unknown;
}

export interface DiagramVersion {
  id: string;
  diagram_id: string;
  user_id: string;
  version: number;
  name: string;
  description: string | null;
  layers: unknown;
  metadata: unknown | null;
  created_at: string;
  created_by: string | null;
  change_description: string | null;
}

export interface DiagramShare {
  id: string;
  diagram_id: string;
  owner_id: string;
  shared_with_email: string;
  permission: 'view' | 'edit';
  created_at: string;
  expires_at: string | null;
}

/**
 * Search and filter options
 */
export interface DiagramSearchOptions {
  query?: string;
  tags?: string[];
  isTemplate?: boolean;
  templateCategory?: string;
  isFavorite?: boolean;
  sortBy?: 'created' | 'updated' | 'opened' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Diagram statistics
 */
export interface DiagramStatistics {
  totalDiagrams: number;
  totalTemplates: number;
  totalFavorites: number;
  uniqueTags: string[];
  recentlyOpened: DiagramLibraryItem[];
}

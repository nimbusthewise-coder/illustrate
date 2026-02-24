-- Migration: Add embed fields to diagrams table
-- F029: Unique Persistent Embed URL per Diagram
-- Run this migration in your Supabase SQL editor

-- Add embed-related columns to diagrams table
ALTER TABLE diagrams 
  ADD COLUMN IF NOT EXISTS embed_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS embed_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS embed_privacy TEXT DEFAULT 'private' CHECK (embed_privacy IN ('public', 'unlisted', 'private')),
  ADD COLUMN IF NOT EXISTS embed_views INTEGER DEFAULT 0;

-- Create index for embed_id lookups (critical for performance)
CREATE INDEX IF NOT EXISTS idx_diagrams_embed_id 
  ON diagrams(embed_id) 
  WHERE embed_id IS NOT NULL;

-- Create index for public/unlisted diagrams
CREATE INDEX IF NOT EXISTS idx_diagrams_embeddable 
  ON diagrams(embed_enabled, embed_privacy) 
  WHERE embed_enabled = TRUE AND embed_privacy IN ('public', 'unlisted');

-- Add comment to document the embed_id format
COMMENT ON COLUMN diagrams.embed_id IS 'Unique 16-character base62 identifier for embed URLs';
COMMENT ON COLUMN diagrams.embed_privacy IS 'Privacy level: public (searchable), unlisted (link-only), or private (owner-only)';
COMMENT ON COLUMN diagrams.embed_views IS 'Total number of times this diagram has been viewed via embed';

-- Update RLS policies to allow public access to embeddable diagrams
-- This policy allows anyone to read diagrams with public or unlisted embed settings
CREATE POLICY "Public embed access for embeddable diagrams"
  ON diagrams FOR SELECT
  USING (
    embed_enabled = TRUE 
    AND embed_privacy IN ('public', 'unlisted')
  );

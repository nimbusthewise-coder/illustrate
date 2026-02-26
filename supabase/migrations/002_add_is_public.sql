-- Add is_public column for cross-device and public sharing
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create index for public diagrams
CREATE INDEX IF NOT EXISTS idx_diagrams_public ON diagrams(is_public) WHERE is_public = TRUE;

-- Policy: Anyone can read public diagrams
CREATE POLICY "Anyone can read public diagrams"
  ON diagrams FOR SELECT
  USING (is_public = TRUE);

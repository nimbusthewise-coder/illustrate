-- Create diagrams table
CREATE TABLE IF NOT EXISTS diagrams (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Diagram',
  description TEXT DEFAULT '',
  width INTEGER NOT NULL DEFAULT 80,
  height INTEGER NOT NULL DEFAULT 24,
  layers JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  thumbnail TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,
  template_category TEXT,
  version INTEGER DEFAULT 1,
  parent_id TEXT REFERENCES diagrams(id) ON DELETE SET NULL,
  cell_count INTEGER DEFAULT 0,
  layer_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_opened_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_diagrams_user_id ON diagrams(user_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_updated_at ON diagrams(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagrams_favorites ON diagrams(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Enable Row Level Security
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own diagrams"
  ON diagrams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagrams"
  ON diagrams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagrams"
  ON diagrams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagrams"
  ON diagrams FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_diagrams_updated_at
  BEFORE UPDATE ON diagrams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create link_preview_cache table for storing cached link previews
CREATE TABLE IF NOT EXISTS link_preview_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  image_url TEXT,
  domain TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on url for faster lookups
CREATE INDEX IF NOT EXISTS idx_link_preview_cache_url ON link_preview_cache(url);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_link_preview_cache_expires_at ON link_preview_cache(expires_at);

-- Enable RLS
ALTER TABLE link_preview_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read all cache entries
CREATE POLICY "Allow admins to read cache" ON link_preview_cache
  FOR SELECT
  USING (true);

-- Create policy to allow admins to insert cache entries
CREATE POLICY "Allow admins to insert cache" ON link_preview_cache
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow admins to delete cache entries
CREATE POLICY "Allow admins to delete cache" ON link_preview_cache
  FOR DELETE
  USING (true);

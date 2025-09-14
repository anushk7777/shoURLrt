-- URL Shortener Database Schema
-- Run this SQL in your Supabase SQL Editor to create the actual links table
-- This replaces any mock implementations with real database tables

-- Create the links table with the exact schema specified in story requirements
CREATE TABLE IF NOT EXISTS public.links (
  short_code TEXT PRIMARY KEY,
  long_url TEXT NOT NULL,
  click_count BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for fast lookups on the primary key (short_code)
-- This index optimizes the redirect service performance
CREATE INDEX IF NOT EXISTS idx_links_short_code ON public.links(short_code);

-- Add comments to document the table structure
COMMENT ON TABLE public.links IS 'Stores URL mappings for the shortener service';
COMMENT ON COLUMN public.links.short_code IS 'Unique identifier for shortened links (primary key)';
COMMENT ON COLUMN public.links.long_url IS 'Original URL to redirect to';
COMMENT ON COLUMN public.links.click_count IS 'Number of times this link has been accessed';
COMMENT ON COLUMN public.links.created_at IS 'Timestamp when the link was created (UTC)';

-- Verify the table was created successfully
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'links' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert to verify constraints work
-- INSERT INTO public.links (short_code, long_url) VALUES ('test123', 'https://example.com');
-- SELECT * FROM public.links WHERE short_code = 'test123';
-- DELETE FROM public.links WHERE short_code = 'test123';
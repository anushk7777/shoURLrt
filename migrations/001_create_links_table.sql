-- Migration: Create links table for URL shortener
-- Description: Creates the main links table with proper constraints and indexes
-- Author: Dev Agent (James)
-- Date: 2024-03-14
-- Version: 1.0

-- Create the links table with the exact schema specified in the story requirements
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
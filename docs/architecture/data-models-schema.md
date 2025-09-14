# Data Models & Schema

A single table is required for the MVP to store the link mappings.

links Table Schema
SQL

CREATE TABLE public.links (
short_code TEXT PRIMARY KEY,
long_url TEXT NOT NULL,
click_count BIGINT DEFAULT 0 NOT NULL,
created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups on the primary key
CREATE INDEX idx_links_short_code ON public.links(short_code);

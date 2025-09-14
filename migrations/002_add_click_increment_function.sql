-- Migration: Add atomic click count increment function
-- Description: Creates a PostgreSQL function for atomic click count increments
-- Author: Dev Agent
-- Date: 2024-01-14
-- Version: 1.0

-- Create function to atomically increment click count
-- This prevents race conditions when multiple users access the same short link simultaneously
CREATE OR REPLACE FUNCTION increment_click_count(short_code_param TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atomically increment the click count for the given short code
  UPDATE public.links 
  SET click_count = click_count + 1 
  WHERE short_code = short_code_param;
  
  -- Log if no rows were affected (short code not found)
  IF NOT FOUND THEN
    RAISE WARNING 'Short code not found for click increment: %', short_code_param;
  END IF;
END;
$$;

-- Add comment to document the function
COMMENT ON FUNCTION increment_click_count(TEXT) IS 'Atomically increments click count for a given short code, preventing race conditions';

-- Grant execute permission to authenticated users (if using RLS)
-- This allows the service role to execute the function
GRANT EXECUTE ON FUNCTION increment_click_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_click_count(TEXT) TO service_role;
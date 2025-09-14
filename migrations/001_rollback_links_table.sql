-- Rollback Migration: Drop links table
-- Description: Rollback script for the links table creation
-- Author: Dev Agent (James)
-- Date: 2024-03-14
-- Version: 1.0
-- WARNING: This will delete all data in the links table!

-- Drop the index first
DROP INDEX IF EXISTS public.idx_links_short_code;

-- Drop the links table
DROP TABLE IF EXISTS public.links;

-- Log the rollback completion
-- Note: In a production environment, you would want to log this to an audit table
SELECT 'Links table rollback completed successfully' AS rollback_status;
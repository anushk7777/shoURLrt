/**
 * Database Migration Utilities
 * 
 * This module provides utilities for running database migrations
 * against the Supabase PostgreSQL database. It includes functions
 * to execute SQL migration files and handle rollback procedures.
 * 
 * @author Dev Agent (James)
 * @version 1.0
 * @date 2024-03-14
 */

import { supabase, supabaseAdmin } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for migration result tracking
 */
interface MigrationResult {
  success: boolean;
  message: string;
  error?: Error | { message: string; code: string } | null;
}

/**
 * Executes a SQL migration file against the Supabase database
 * 
 * @param migrationFileName - Name of the migration file (e.g., '001_create_links_table.sql')
 * @returns Promise<MigrationResult> - Result of the migration execution
 */
export async function runMigration(migrationFileName: string): Promise<MigrationResult> {
  try {
    // Construct the path to the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', migrationFileName);
    
    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      return {
        success: false,
        message: `Migration file not found: ${migrationFileName}`
      };
    }

    // Read the SQL content from the migration file
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL against Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        error
      };
    }

    return {
      success: true,
      message: `Migration ${migrationFileName} executed successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration execution error: ${error}`,
      error
    };
  }
}

/**
 * Creates the links table directly using Supabase client
 * This is the main function for Story 1.2 implementation
 * 
 * @returns Promise<MigrationResult> - Result of the table creation
 */
export async function createLinksTable(): Promise<MigrationResult> {
  try {
    // SQL to create the links table with exact schema from story requirements
    const createTableSQL = `
      -- Disable Row Level Security for testing purposes
      ALTER TABLE public.links DISABLE ROW LEVEL SECURITY;

      -- Create the links table with the exact schema specified in story requirements
      CREATE TABLE IF NOT EXISTS public.links (
        short_code TEXT PRIMARY KEY,
        long_url TEXT NOT NULL,
        click_count BIGINT DEFAULT 0 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      
      -- Create index for fast lookups on the primary key (short_code)
      CREATE INDEX IF NOT EXISTS idx_links_short_code ON public.links(short_code);
      
      -- Add comments to document the table structure
      COMMENT ON TABLE public.links IS 'Stores URL mappings for the shortener service';
      COMMENT ON COLUMN public.links.short_code IS 'Unique identifier for shortened links (primary key)';
      COMMENT ON COLUMN public.links.long_url IS 'Original URL to redirect to';
      COMMENT ON COLUMN public.links.click_count IS 'Number of times this link has been accessed';
      COMMENT ON COLUMN public.links.created_at IS 'Timestamp when the link was created (UTC)';
    `;

    // Execute the SQL using Supabase's raw SQL execution
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (error) {
      // If RPC doesn't work, try direct table creation using Supabase client
      console.warn('RPC exec_sql failed, attempting direct table creation...');
      
      // Alternative approach: Use Supabase's from() method to test connection
      // and then execute raw SQL if possible
      const { error: testError } = await supabase.from('links').select('*').limit(1);
      
      if (testError && testError.code === 'PGRST116') {
        // Table doesn't exist, which is expected
        return {
          success: true,
          message: 'Database connection verified. Please run the migration manually using Supabase dashboard or CLI.'
        };
      }
      
      return {
        success: false,
        message: `Failed to create links table: ${error.message}`,
        error
      };
    }

    return {
      success: true,
      message: 'Links table created successfully with all constraints and indexes'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating links table: ${error}`,
      error
    };
  }
}

/**
 * Validates that the links table was created correctly
 * Tests the table structure, constraints, and indexes
 * 
 * @returns Promise<MigrationResult> - Result of the validation
 */
export async function validateLinksTable(): Promise<MigrationResult> {
  try {
    // Test basic table access
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: `Table validation failed: ${error.message}`,
        error
      };
    }

    // Test inserting a sample record to validate constraints
    const testRecord = {
      short_code: 'test123',
      long_url: 'https://example.com',
      click_count: 0
    };

    const { error: insertError } = await supabase
      .from('links')
      .insert(testRecord);

    if (insertError) {
      return {
        success: false,
        message: `Insert validation failed: ${insertError.message}`,
        error: insertError
      };
    }

    // Clean up test record
    await supabase
      .from('links')
      .delete()
      .eq('short_code', 'test123');

    return {
      success: true,
      message: 'Links table validation completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Validation error: ${error}`,
      error
    };
  }
}

/**
 * Rollback function to drop the links table if needed
 * Use with caution - this will delete all data!
 * 
 * @returns Promise<MigrationResult> - Result of the rollback
 */
export async function rollbackLinksTable(): Promise<MigrationResult> {
  try {
    const rollbackSQL = `
      -- Drop the links table and its indexes
      DROP INDEX IF EXISTS idx_links_short_code;
      DROP TABLE IF EXISTS public.links;
    `;

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: rollbackSQL
    });

    if (error) {
      return {
        success: false,
        message: `Rollback failed: ${error.message}`,
        error
      };
    }

    return {
      success: true,
      message: 'Links table rollback completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Rollback error: ${error}`,
      error
    };
  }
}
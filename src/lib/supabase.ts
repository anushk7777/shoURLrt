/**
 * Supabase Client Configuration
 * 
 * This module creates and exports Supabase clients for both client-side and server-side operations.
 * Environment variables are automatically loaded by Next.js from .env.local file.
 * 
 * @author Dev Agent
 * @version 1.1
 * @date 2024-01-14
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables - automatically loaded by Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('Environment variables check:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceRoleKey
  });
}

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing required environment variables: ${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`);
}

/**
 * Client for client-side (browser) operations
 * Uses the anonymous key for public access with Row Level Security
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin client for server-side operations
 * Only create if service role key is available
 */
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
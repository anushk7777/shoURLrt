/**
 * Short Code Generation Service
 * 
 * This service generates unique short codes for URL shortening.
 * It implements secure random generation with collision detection and retry logic.
 * 
 * Features:
 * - Cryptographically secure random generation
 * - Configurable code length (6-8 characters)
 * - Database uniqueness validation
 * - Collision handling with retry mechanism
 * - Comprehensive error handling and logging
 */

import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

// Configuration constants
const DEFAULT_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 8;
const MIN_CODE_LENGTH = 4;
const MAX_RETRY_ATTEMPTS = 10;
const CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Configuration interface for short code generation
 */
export interface ShortCodeConfig {
  length?: number;
  maxRetries?: number;
}

/**
 * Result interface for short code generation
 */
export interface ShortCodeResult {
  success: boolean;
  shortCode?: string;
  error?: string;
  attempts?: number;
}

/**
 * Error class for short code generation failures
 */
export class ShortCodeGenerationError extends Error {
  constructor(message: string, public attempts?: number) {
    super(message);
    this.name = 'ShortCodeGenerationError';
  }
}

/**
 * Generates a cryptographically secure random alphanumeric string
 * 
 * @param length - The desired length of the code (4-8 characters)
 * @returns A random alphanumeric string
 * @throws ShortCodeGenerationError if length is invalid
 */
function generateRandomCode(length: number): string {
  if (length < MIN_CODE_LENGTH || length > MAX_CODE_LENGTH) {
    throw new ShortCodeGenerationError(
      `Code length must be between ${MIN_CODE_LENGTH} and ${MAX_CODE_LENGTH} characters`
    );
  }

  const randomBytes = crypto.randomBytes(length * 2); // Generate extra bytes for better distribution
  let result = '';
  
  for (let i = 0; i < length; i++) {
    // Use two bytes to get better distribution across character set
    const randomIndex = (randomBytes[i * 2] << 8 | randomBytes[i * 2 + 1]) % CHARACTER_SET.length;
    result += CHARACTER_SET[randomIndex];
  }
  
  return result;
}

/**
 * Checks if a short code already exists in the database
 * 
 * @param shortCode - The code to check for existence
 * @returns Promise<boolean> - true if code exists, false otherwise
 * @throws Error if database query fails
 */
async function isCodeExists(shortCode: string): Promise<boolean> {
  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not available. Check SUPABASE_SERVICE_ROLE_KEY environment variable.');
    throw new Error('Database connection not available. Missing service role key.');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('links')
      .select('short_code')
      .eq('short_code', shortCode)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Database error checking code existence:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    return data !== null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Database query failed')) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('Database connection not available')) {
      throw error;
    }
    console.error('Unexpected error checking code existence:', error);
    throw new Error('Failed to check code existence');
  }
}

/**
 * Generates a unique short code with collision detection and retry logic
 * 
 * @param config - Configuration options for code generation
 * @returns Promise<ShortCodeResult> - Result object with success status and generated code
 */
export async function generateUniqueShortCode(
  config: ShortCodeConfig = {}
): Promise<ShortCodeResult> {
  const length = config.length ?? DEFAULT_CODE_LENGTH;
  const maxRetries = config.maxRetries ?? MAX_RETRY_ATTEMPTS;
  
  let attempts = 0;
  let lastError: string | undefined;

  // Validate configuration
  if (length < MIN_CODE_LENGTH || length > MAX_CODE_LENGTH) {
    return {
      success: false,
      error: `Invalid code length. Must be between ${MIN_CODE_LENGTH} and ${MAX_CODE_LENGTH} characters.`,
      attempts: 0
    };
  }

  if (maxRetries < 1 || maxRetries > 100) {
    return {
      success: false,
      error: 'Invalid maxRetries. Must be between 1 and 100.',
      attempts: 0
    };
  }

  console.log(`Starting short code generation with length ${length}, max retries ${maxRetries}`);

  while (attempts < maxRetries) {
    attempts++;
    
    try {
      // Generate a random code
      const shortCode = generateRandomCode(length);
      
      // Check if it already exists
      const exists = await isCodeExists(shortCode);
      
      if (!exists) {
        console.log(`Successfully generated unique short code after ${attempts} attempt(s)`);
        return {
          success: true,
          shortCode,
          attempts
        };
      }
      
      // Log collision for monitoring
      console.warn(`Short code collision detected: ${shortCode} (attempt ${attempts})`);
      lastError = `Code collision on attempt ${attempts}`;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error generating short code (attempt ${attempts}):`, errorMessage);
      lastError = errorMessage;
      
      // For database connection or query errors, fail fast
      if (errorMessage.includes('Database query failed') || 
          errorMessage.includes('Database connection not available')) {
        return {
          success: false,
          error: `Database error: ${errorMessage}`,
          attempts
        };
      }
    }
  }

  // All attempts exhausted
  const finalError = `Failed to generate unique short code after ${maxRetries} attempts. Last error: ${lastError}`;
  console.error(finalError);
  
  return {
    success: false,
    error: finalError,
    attempts
  };
}

/**
 * Validates a short code format
 * 
 * @param shortCode - The code to validate
 * @returns boolean - true if valid format, false otherwise
 */
export function isValidShortCodeFormat(shortCode: string): boolean {
  if (!shortCode || typeof shortCode !== 'string') {
    return false;
  }
  
  if (shortCode.length < MIN_CODE_LENGTH || shortCode.length > MAX_CODE_LENGTH) {
    return false;
  }
  
  // Check if all characters are in the allowed character set
  return shortCode.split('').every(char => CHARACTER_SET.includes(char));
}

/**
 * Gets statistics about the short code generation service
 * 
 * @returns Object with service configuration and statistics
 */
export function getShortCodeServiceInfo() {
  return {
    characterSet: CHARACTER_SET,
    characterSetSize: CHARACTER_SET.length,
    defaultLength: DEFAULT_CODE_LENGTH,
    minLength: MIN_CODE_LENGTH,
    maxLength: MAX_CODE_LENGTH,
    maxRetries: MAX_RETRY_ATTEMPTS,
    possibleCombinations: {
      length6: Math.pow(CHARACTER_SET.length, 6),
      length7: Math.pow(CHARACTER_SET.length, 7),
      length8: Math.pow(CHARACTER_SET.length, 8)
    }
  };
}
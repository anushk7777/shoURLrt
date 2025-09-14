/**
 * Unit Tests for Short Code Generation Service
 * 
 * This test suite covers all aspects of the short code generation service:
 * - Random code generation with various lengths
 * - Uniqueness validation logic
 * - Collision handling and retry mechanism
 * - Error scenarios and edge cases
 * - Configuration validation
 * - Format validation
 */

import {
  generateUniqueShortCode,
  isValidShortCodeFormat,
  getShortCodeServiceInfo
} from '../lib/shortCodeGenerator';
import { supabaseAdmin } from '../lib/supabase';

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

// Mock crypto module for deterministic testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn()
}));

import crypto from 'crypto';

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('Short Code Generation Service', () => {
  // Helper function to mock random bytes
  const mockRandomBytes = (values: number[]) => {
    const buffer = Buffer.from(values);
    mockCrypto.randomBytes.mockReturnValue(buffer);
  };

  // Helper function to mock database responses
  interface SupabaseError {
    message: string;
    code: string;
  }

  interface MockSelect {
    eq: jest.Mock<MockSelect, [string, unknown]>;
    limit: jest.Mock<MockSelect, [number]>;
    single: jest.Mock<Promise<{data: unknown; error: unknown}>, []>;
  }

  const mockDatabaseResponse = (exists: boolean, error?: SupabaseError) => {
    const mockSelect: MockSelect = {
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: exists ? { short_code: 'test123' } : null,
        error: error || null
      })
    };
    
    mockSupabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnValue(mockSelect)
    } as unknown as ReturnType<typeof mockSupabaseAdmin.from>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateUniqueShortCode', () => {



    it('should generate a unique short code successfully', async () => {
      // Mock crypto to return predictable values
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]); // Will generate "AABBCC"
      
      // Mock database to return no existing code
      mockDatabaseResponse(false);

      const result = await generateUniqueShortCode({ length: 6 });

      expect(result.success).toBe(true);
      expect(result.shortCode).toBeDefined();
      expect(result.shortCode?.length).toBe(6);
      expect(result.attempts).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should handle collisions and retry successfully', async () => {
      // Mock crypto to return different values on each call
      mockCrypto.randomBytes
        .mockReturnValueOnce(Buffer.from([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])) // First attempt
        .mockReturnValueOnce(Buffer.from([10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15])); // Second attempt

      // Mock database responses: first exists, second doesn't
      let callCount = 0;
      const mockSelect: MockSelect = {
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            data: callCount === 1 ? { short_code: 'collision' } : null,
            error: null
          });
        })
      };
      
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      } as unknown as ReturnType<typeof mockSupabaseAdmin.from>);

      const result = await generateUniqueShortCode({ length: 6 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Short code collision detected'));
    });

    it('should fail after maximum retry attempts', async () => {
      // Mock crypto to always return the same values (causing collisions)
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
      
      // Mock database to always return existing code
      mockDatabaseResponse(true);

      const result = await generateUniqueShortCode({ length: 6, maxRetries: 3 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to generate unique short code after 3 attempts');
      expect(result.attempts).toBe(3);
    });

    it('should handle database errors gracefully', async () => {
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
      
      // Mock database error
      mockDatabaseResponse(false, { message: 'Connection failed', code: 'CONNECTION_ERROR' });

      const result = await generateUniqueShortCode({ length: 6 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(result.attempts).toBe(1);
    });

    it('should validate configuration parameters', async () => {
      // Test invalid length (these are validated before any database calls)
      let result = await generateUniqueShortCode({ length: 3 }); // Too short
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid code length');
      expect(result.attempts).toBe(0);

      result = await generateUniqueShortCode({ length: 10 }); // Too long
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid code length');
      expect(result.attempts).toBe(0);
    });

    it('should validate maxRetries parameter', async () => {
      // Test invalid maxRetries - these should fail validation before any database calls
      const result1 = await generateUniqueShortCode({ maxRetries: 0 }); // Too low
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Invalid maxRetries. Must be between 1 and 100.');
      expect(result1.attempts).toBe(0);

      const result2 = await generateUniqueShortCode({ maxRetries: 101 }); // Too high
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Invalid maxRetries. Must be between 1 and 100.');
      expect(result2.attempts).toBe(0);
    });

    it('should use default configuration when none provided', async () => {
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
      mockDatabaseResponse(false);

      const result = await generateUniqueShortCode();

      expect(result.success).toBe(true);
      expect(result.shortCode?.length).toBe(6); // Default length
    });

    it('should handle different code lengths correctly', async () => {
      mockDatabaseResponse(false);

      // Test length 4
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3]);
      let result = await generateUniqueShortCode({ length: 4 });
      expect(result.success).toBe(true);
      expect(result.shortCode?.length).toBe(4);

      // Test length 8
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]);
      result = await generateUniqueShortCode({ length: 8 });
      expect(result.success).toBe(true);
      expect(result.shortCode?.length).toBe(8);
    });
  });

  describe('isValidShortCodeFormat', () => {
    it('should validate correct short code formats', () => {
      expect(isValidShortCodeFormat('abc123')).toBe(true);
      expect(isValidShortCodeFormat('ABC123')).toBe(true);
      expect(isValidShortCodeFormat('aB3')).toBe(false); // Too short
      expect(isValidShortCodeFormat('abcdefghi')).toBe(false); // Too long
    });

    it('should reject invalid characters', () => {
      expect(isValidShortCodeFormat('abc-123')).toBe(false); // Contains hyphen
      expect(isValidShortCodeFormat('abc_123')).toBe(false); // Contains underscore
      expect(isValidShortCodeFormat('abc@123')).toBe(false); // Contains special char
      expect(isValidShortCodeFormat('abc 123')).toBe(false); // Contains space
    });

    it('should handle edge cases', () => {
      expect(isValidShortCodeFormat('')).toBe(false); // Empty string
      expect(isValidShortCodeFormat(null)).toBe(false); // Null
      expect(isValidShortCodeFormat(undefined)).toBe(false); // Undefined
      expect(isValidShortCodeFormat(123 as unknown as string)).toBe(false); // Number
    });
  });

  describe('getShortCodeServiceInfo', () => {
    it('should return correct service information', () => {
      const info = getShortCodeServiceInfo();

      expect(info.characterSet).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
      expect(info.characterSetSize).toBe(62);
      expect(info.defaultLength).toBe(6);
      expect(info.minLength).toBe(4);
      expect(info.maxLength).toBe(8);
      expect(info.maxRetries).toBe(10);
      expect(info.possibleCombinations.length6).toBe(Math.pow(62, 6));
      expect(info.possibleCombinations.length7).toBe(Math.pow(62, 7));
      expect(info.possibleCombinations.length8).toBe(Math.pow(62, 8));
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected database errors', async () => {
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
      
      // Mock unexpected error
      const mockSelect: MockSelect = {
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Unexpected database error'))
      };
      
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      } as unknown as ReturnType<typeof mockSupabaseAdmin.from>);

      const result = await generateUniqueShortCode({ length: 6 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to check code existence');
    });

    it('should handle PGRST116 (not found) error correctly', async () => {
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
      
      // Mock PGRST116 error (record not found)
      const mockSelect: MockSelect = {
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      };
      
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      } as unknown as ReturnType<typeof mockSupabaseAdmin.from>);

      const result = await generateUniqueShortCode({ length: 6 });

      expect(result.success).toBe(true); // Should succeed because PGRST116 means code doesn't exist
    });
  });

  describe('Performance and Monitoring', () => {
    it('should log collision events for monitoring', async () => {
      mockCrypto.randomBytes
        .mockReturnValueOnce(Buffer.from([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]))
        .mockReturnValueOnce(Buffer.from([10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]));

      let callCount = 0;
      const mockSelect = {
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            data: callCount === 1 ? { short_code: 'collision' } : null,
            error: null
          });
        })
      };
      
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelect)
      } as unknown as ReturnType<typeof mockSupabaseAdmin.from>);

      await generateUniqueShortCode({ length: 6 });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Short code collision detected'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Successfully generated unique short code'));
    });

    it('should log generation start and completion', async () => {
      mockRandomBytes([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
      mockDatabaseResponse(false);

      await generateUniqueShortCode({ length: 6, maxRetries: 5 });

      expect(console.log).toHaveBeenCalledWith('Starting short code generation with length 6, max retries 5');
      expect(console.log).toHaveBeenCalledWith('Successfully generated unique short code after 1 attempt(s)');
    });
  });
});
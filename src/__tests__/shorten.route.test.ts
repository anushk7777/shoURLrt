/**
 * Test suite for the /api/shorten endpoint
 * Tests URL shortening functionality, validation, security, and error handling
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../app/api/shorten/route';

// Mock the external dependencies
jest.mock('../lib/supabase', () => ({
  supabaseAdmin: null // Will be set in tests
}));

jest.mock('../lib/shortCodeGenerator', () => ({
  generateUniqueShortCode: jest.fn()
}));

// Import mocked modules
import { generateUniqueShortCode } from '../lib/shortCodeGenerator';
const mockGenerateUniqueShortCode = generateUniqueShortCode as jest.MockedFunction<typeof generateUniqueShortCode>;

// Mock supabaseAdmin - will be reassigned in tests
let mockSupabaseAdmin: unknown;

// Import and mock the supabase module
import * as supabaseModule from '../lib/supabase';

describe('/api/shorten API Endpoint', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mockSupabaseAdmin to default working state
    mockSupabaseAdmin = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        }),
        insert: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
      })
    };
    
    // Set the mock in the module
    supabaseModule.supabaseAdmin = mockSupabaseAdmin;
    
    // Setup default mock request
    mockRequest = {
      json: jest.fn().mockResolvedValue({ url: 'https://example.com' }),
      headers: new Headers(),
      nextUrl: { origin: 'http://localhost:3000' } as URL
    };
    
    // Setup default successful short code generation
    mockGenerateUniqueShortCode.mockResolvedValue({
      success: true,
      shortCode: 'abc123'
    });
  });

  describe('POST /api/shorten', () => {
    describe('Successful operations', () => {
      it('should successfully shorten a valid URL', async () => {
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.shortCode).toBe('abc123');
        expect(result.shortUrl).toContain('abc123');
      });
    });

    describe('Input validation', () => {
      it('should return 400 for invalid URL', async () => {
        (mockRequest.json as jest.Mock).mockResolvedValue({ url: 'invalid-url' });
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('valid URL starting with http:// or https://');
      });

      it('should return 400 for missing URL', async () => {
        (mockRequest.json as jest.Mock).mockResolvedValue({});
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('URL is required');
      });
    });

    describe('Security validation', () => {
      it('should return 400 for self-referencing URL', async () => {
        mockRequest.headers = new Headers({ 'x-forwarded-for': '192.168.1.102' });
        (mockRequest.json as jest.Mock).mockResolvedValue({ url: 'http://localhost:3000/some-path' });
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('URL failed security validation');
      });

      it('should return 400 for javascript: protocol', async () => {
        mockRequest.headers = new Headers({ 'x-forwarded-for': '192.168.1.103' });
        (mockRequest.json as jest.Mock).mockResolvedValue({ url: 'javascript:alert("xss")' });
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Please enter a valid URL starting with http:// or https://');
      });

      it('should return 400 for data: protocol', async () => {
        mockRequest.headers = new Headers({ 'x-forwarded-for': '192.168.1.104' });
        (mockRequest.json as jest.Mock).mockResolvedValue({ url: 'data:text/html,<script>alert("xss")</script>' });
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Please enter a valid URL starting with http:// or https://');
      });
    });

    describe('Rate limiting', () => {
      it('should allow requests within rate limit', async () => {
        mockRequest.headers = new Headers({ 'x-forwarded-for': '192.168.1.100' });
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
      });

      it('should return 429 when rate limit is exceeded', async () => {
        // Use the same IP for multiple requests to trigger rate limiting
        const testIP = '192.168.1.101';
        mockRequest.headers = new Headers({ 'x-forwarded-for': testIP });
        
        // Make 11 requests (rate limit is 10 per minute)
        for (let i = 0; i < 11; i++) {
          await POST(mockRequest as NextRequest);
        }
        
        // The 12th request should be rate limited
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(429);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Rate limit exceeded');
      });
    });

    describe('Database operations', () => {
      it('should return 500 when Supabase admin client is not available', async () => {
        // Set supabaseAdmin to null
        supabaseModule.supabaseAdmin = null;
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Database connection not available');
      });

      it('should return 500 when short code generation fails', async () => {
        mockGenerateUniqueShortCode.mockResolvedValue({
          success: false,
          error: 'Failed to generate unique code after maximum retries'
        });

        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to generate unique code after maximum retries');
      });

      it('should return 500 when database insertion fails', async () => {
        const mockInsert = {
          insert: jest.fn().mockResolvedValue({ 
            error: { message: 'Database insertion failed' }
          })
        };
        
        mockSupabaseAdmin.from = jest.fn().mockReturnValue(mockInsert);
        supabaseModule.supabaseAdmin = mockSupabaseAdmin;
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to store URL mapping');
      });
    });

    describe('Error handling', () => {
      it('should handle malformed JSON request', async () => {
        (mockRequest.json as jest.Mock).mockRejectedValue(new Error('Invalid JSON'));
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Internal server error');
      });

      it('should handle unexpected errors gracefully', async () => {
        // Use a unique IP to avoid rate limiting
        mockRequest.headers = new Headers({ 'x-forwarded-for': '192.168.1.200' });
        mockGenerateUniqueShortCode.mockRejectedValue(new Error('Unexpected error'));
        
        const response = await POST(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Internal server error');
      });
    });
  });

  describe('GET /api/shorten', () => {
    it('should return API information', async () => {
      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe('URL Shortening API');
      expect(result.endpoint).toBe('POST /api/shorten');
      expect(result.usage).toBe('Send a POST request with { "url": "https://example.com" }');
    });
  });
});
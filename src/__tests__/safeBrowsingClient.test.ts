/**
 * Unit Tests for Safe Browsing API Client
 * 
 * This test suite covers all functionality of the SafeBrowsingClient class,
 * including request formatting, response parsing, error handling, rate limiting,
 * circuit breaker patterns, and security features.
 * 
 * Test Categories:
 * - Configuration validation
 * - URL sanitization and validation
 * - Request formatting
 * - Response parsing
 * - Error handling
 * - Rate limiting
 * - Circuit breaker functionality
 * - Security features
 */

import { SafeBrowsingClient, createSafeBrowsingClient, getSafeBrowsingClient } from '../lib/safeBrowsingClient';
import { SafeBrowsingError, SafeBrowsingConfig } from '../types/safeBrowsing';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock AbortSignal.timeout
global.AbortSignal.timeout = jest.fn().mockReturnValue(new AbortController().signal);

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset environment variables
  delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
});

describe('SafeBrowsingClient', () => {
  const validConfig: SafeBrowsingConfig = {
    apiKey: 'test-api-key',
    clientId: 'test-client',
    clientVersion: '1.0.0'
  };

  describe('Configuration Validation', () => {
    test('should create client with valid configuration', () => {
      expect(() => new SafeBrowsingClient(validConfig)).not.toThrow();
    });

    test('should throw error for missing API key', () => {
      const config = { ...validConfig, apiKey: '' };
      expect(() => new SafeBrowsingClient(config)).toThrow(SafeBrowsingError);
      expect(() => new SafeBrowsingClient(config)).toThrow('API key is required');
    });

    test('should throw error for missing client ID', () => {
      const config = { ...validConfig, clientId: '' };
      expect(() => new SafeBrowsingClient(config)).toThrow(SafeBrowsingError);
      expect(() => new SafeBrowsingClient(config)).toThrow('Client ID is required');
    });

    test('should throw error for missing client version', () => {
      const config = { ...validConfig, clientVersion: '' };
      expect(() => new SafeBrowsingClient(config)).toThrow(SafeBrowsingError);
      expect(() => new SafeBrowsingClient(config)).toThrow('Client version is required');
    });

    test('should apply default configuration values', () => {
      const client = new SafeBrowsingClient(validConfig);
      expect(client).toBeDefined();
      // Test that defaults are applied by checking they don't throw errors
      expect(() => client.getRateLimitInfo()).not.toThrow();
      expect(() => client.getCircuitBreakerInfo()).not.toThrow();
    });
  });

  describe('URL Sanitization and Validation', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should handle valid URLs', async () => {
      mockSuccessfulApiResponse([]);
      await expect(client.checkUrl('https://example.com')).resolves.toBeDefined();
      
      mockSuccessfulApiResponse([]);
      await expect(client.checkUrl('http://test.com')).resolves.toBeDefined();
    });

    test('should add protocol to URLs without protocol', async () => {
      mockSuccessfulApiResponse([]);
      
      const result = await client.checkUrl('example.com');
      
      // Verify the request was made with http:// prefix
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('safebrowsing.googleapis.com'),
        expect.objectContaining({
          body: expect.stringContaining('http://example.com')
        })
      );
      expect(result.url).toBe('http://example.com');
    });

    test('should trim whitespace from URLs', async () => {
      mockSuccessfulApiResponse([]);
      
      await client.checkUrl('  https://example.com  ');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('https://example.com')
        })
      );
    });

    test('should throw error for invalid URL format', async () => {
      await expect(client.checkUrl('not-a-valid-url')).rejects.toThrow(SafeBrowsingError);
      await expect(client.checkUrl('not-a-valid-url')).rejects.toThrow('Failed to check URLs');
    });

    test('should throw error for empty URL', async () => {
      await expect(client.checkUrl('')).rejects.toThrow(SafeBrowsingError);
      await expect(client.checkUrl('')).rejects.toThrow('Invalid URL provided');
    });

    test('should throw error for null/undefined URL', async () => {
      await expect(client.checkUrl(null as unknown as string)).rejects.toThrow(SafeBrowsingError);
      await expect(client.checkUrl(undefined as unknown as string)).rejects.toThrow(SafeBrowsingError);
    });
  });

  describe('Request Formatting', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should format single URL request correctly', async () => {
      mockSuccessfulApiResponse([]);
      
      await client.checkUrl('https://example.com');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('threatMatches:find?key=test-api-key'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'test-client/1.0.0'
          }),
          body: expect.stringContaining('"threatTypes":["MALWARE","SOCIAL_ENGINEERING","UNWANTED_SOFTWARE"]')
        })
      );
    });

    test('should format multiple URLs request correctly', async () => {
      mockSuccessfulApiResponse([]);
      
      const urls = ['https://example1.com', 'https://example2.com'];
      await client.checkUrls(urls);
      
      const requestBody = JSON.parse((mockFetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.client.clientId).toBe('test-client');
      expect(requestBody.client.clientVersion).toBe('1.0.0');
      expect(requestBody.threatInfo.threatEntries).toHaveLength(2);
      expect(requestBody.threatInfo.threatEntries[0].url).toBe('https://example1.com');
      expect(requestBody.threatInfo.threatEntries[1].url).toBe('https://example2.com');
    });

    test('should include all required threat types', async () => {
      mockSuccessfulApiResponse([]);
      
      await client.checkUrl('https://example.com');
      
      const requestBody = JSON.parse((mockFetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.threatInfo.threatTypes).toEqual([
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE'
      ]);
      expect(requestBody.threatInfo.platformTypes).toEqual(['ANY_PLATFORM']);
      expect(requestBody.threatInfo.threatEntryTypes).toEqual(['URL']);
    });
  });

  describe('Response Parsing', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should parse response with no threats correctly', async () => {
      mockSuccessfulApiResponse([]);
      
      const result = await client.checkUrl('https://safe-site.com');
      
      expect(result.url).toBe('https://safe-site.com');
      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
      expect(result.checkedAt).toBeInstanceOf(Date);
    });

    test('should parse response with threats correctly', async () => {
      const mockMatches = [{
        threatType: 'MALWARE' as const,
        platformType: 'ANY_PLATFORM' as const,
        threatEntryType: 'URL' as const,
        threat: { url: 'https://malicious-site.com' },
        cacheDuration: '300s'
      }];
      
      mockSuccessfulApiResponse(mockMatches);
      
      const result = await client.checkUrl('https://malicious-site.com');
      
      expect(result.url).toBe('https://malicious-site.com');
      expect(result.isSafe).toBe(false);
      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].type).toBe('MALWARE');
      expect(result.threats[0].platform).toBe('ANY_PLATFORM');
      expect(result.threats[0].description).toBe('Malicious software that can harm your device');
      expect(result.cacheExpiresAt).toBeInstanceOf(Date);
    });

    test('should handle multiple URLs with mixed results', async () => {
      const mockMatches = [{
        threatType: 'SOCIAL_ENGINEERING' as const,
        platformType: 'ANY_PLATFORM' as const,
        threatEntryType: 'URL' as const,
        threat: { url: 'https://phishing-site.com' }
      }];
      
      mockSuccessfulApiResponse(mockMatches);
      
      const urls = ['https://safe-site.com', 'https://phishing-site.com'];
      const results = await client.checkUrls(urls);
      
      expect(results).toHaveLength(2);
      expect(results[0].isSafe).toBe(true);
      expect(results[1].isSafe).toBe(false);
      expect(results[1].threats[0].type).toBe('SOCIAL_ENGINEERING');
    });
  });

  describe('Error Handling', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should handle API request failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid request')
      } as Response);
      
      await expect(client.checkUrl('https://example.com')).rejects.toThrow(SafeBrowsingError);
      await expect(client.checkUrl('https://example.com')).rejects.toThrow('Failed to check URLs');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(client.checkUrl('https://example.com')).rejects.toThrow(SafeBrowsingError);
      await expect(client.checkUrl('https://example.com')).rejects.toThrow('Failed to check URLs');
    });

    test('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response);
      
      await expect(client.checkUrl('https://example.com')).rejects.toThrow(SafeBrowsingError);
    });

    test('should throw error for empty URLs array', async () => {
      await expect(client.checkUrls([])).rejects.toThrow(SafeBrowsingError);
      await expect(client.checkUrls([])).rejects.toThrow('No URLs provided');
    });

    test('should throw error for too many URLs', async () => {
      const tooManyUrls = Array(501).fill('https://example.com');
      await expect(client.checkUrls(tooManyUrls)).rejects.toThrow(SafeBrowsingError);
      await expect(client.checkUrls(tooManyUrls)).rejects.toThrow('Too many URLs');
    });
  });

  describe('Rate Limiting', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should track rate limit information', async () => {
      mockSuccessfulApiResponse([]);
      
      const initialRateLimit = client.getRateLimitInfo();
      expect(initialRateLimit.remaining).toBeGreaterThan(0);
      
      await client.checkUrl('https://example.com');
      
      const updatedRateLimit = client.getRateLimitInfo();
      expect(updatedRateLimit.remaining).toBe(initialRateLimit.remaining - 1);
    });

    test('should provide rate limit information', () => {
      const rateLimitInfo = client.getRateLimitInfo();
      
      expect(rateLimitInfo).toHaveProperty('remaining');
      expect(rateLimitInfo).toHaveProperty('resetTime');
      expect(rateLimitInfo).toHaveProperty('limit');
      expect(typeof rateLimitInfo.remaining).toBe('number');
      expect(rateLimitInfo.resetTime).toBeInstanceOf(Date);
    });
  });

  describe('Circuit Breaker', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should provide circuit breaker information', () => {
      const circuitBreakerInfo = client.getCircuitBreakerInfo();
      
      expect(circuitBreakerInfo).toHaveProperty('state');
      expect(circuitBreakerInfo).toHaveProperty('failureCount');
      expect(circuitBreakerInfo.state).toBe('CLOSED');
      expect(circuitBreakerInfo.failureCount).toBe(0);
    });

    test('should handle circuit breaker state changes on failures', async () => {
      // Mock multiple failures
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Make multiple failed requests
      for (let i = 0; i < 5; i++) {
        try {
          await client.checkUrl('https://example.com');
        } catch {
          // Expected to fail
        }
      }
      
      const circuitBreakerInfo = client.getCircuitBreakerInfo();
      expect(circuitBreakerInfo.failureCount).toBeGreaterThanOrEqual(5);
      expect(['OPEN', 'HALF_OPEN']).toContain(circuitBreakerInfo.state);
    });
  });

  describe('Factory Functions', () => {
    test('createSafeBrowsingClient should throw error without API key', () => {
      expect(() => createSafeBrowsingClient()).toThrow(SafeBrowsingError);
      expect(() => createSafeBrowsingClient()).toThrow('GOOGLE_SAFE_BROWSING_API_KEY environment variable is not set');
    });

    test('createSafeBrowsingClient should create client with API key', () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
      
      expect(() => createSafeBrowsingClient()).not.toThrow();
      const client = createSafeBrowsingClient();
      expect(client).toBeInstanceOf(SafeBrowsingClient);
    });

    test('getSafeBrowsingClient should return singleton instance', () => {
      process.env.GOOGLE_SAFE_BROWSING_API_KEY = 'test-key';
      
      const client1 = getSafeBrowsingClient();
      const client2 = getSafeBrowsingClient();
      
      expect(client1).toBe(client2); // Same instance
    });
  });

  describe('Security Features', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should not expose API key in any public methods', () => {
      // Check that API key is not exposed in any public properties or methods
      const rateLimitInfo = client.getRateLimitInfo();
      expect(JSON.stringify(rateLimitInfo)).not.toContain('test-api-key');
      
      const circuitBreakerInfo = client.getCircuitBreakerInfo();
      expect(JSON.stringify(circuitBreakerInfo)).not.toContain('test-api-key');
    });

    test('should include timeout in requests', async () => {
      mockSuccessfulApiResponse([]);
      
      await client.checkUrl('https://example.com');
      
      expect(AbortSignal.timeout).toHaveBeenCalledWith(10000); // Default timeout
    });

    test('should use custom timeout when provided', async () => {
      const customConfig = { ...validConfig, timeoutMs: 5000 };
      const customClient = new SafeBrowsingClient(customConfig);
      
      mockSuccessfulApiResponse([]);
      
      await customClient.checkUrl('https://example.com');
      
      expect(AbortSignal.timeout).toHaveBeenCalledWith(5000);
    });
  });

  describe('Threat Description Mapping', () => {
    let client: SafeBrowsingClient;

    beforeEach(() => {
      client = new SafeBrowsingClient(validConfig);
    });

    test('should provide correct descriptions for all threat types', async () => {
      const threatTypes = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_UNWANTED_APPLICATION'] as const;
      
      for (const threatType of threatTypes) {
        const mockMatches = [{
          threatType,
          platformType: 'ANY_PLATFORM' as const,
          threatEntryType: 'URL' as const,
          threat: { url: 'https://test.com' }
        }];
        
        mockSuccessfulApiResponse(mockMatches);
        
        const result = await client.checkUrl('https://test.com');
        
        expect(result.threats).toHaveLength(1);
        expect(result.threats[0].description).toBeDefined();
        expect(typeof result.threats[0].description).toBe('string');
        expect(result.threats[0].description.length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * Helper function to mock successful API responses
 * @param matches Array of threat matches to return
 */
function mockSuccessfulApiResponse(matches: unknown[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ matches }),
    headers: new Headers()
  } as Response);
}
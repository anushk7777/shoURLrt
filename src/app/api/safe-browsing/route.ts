/**
 * Safe Browsing API Route
 * 
 * This Next.js API route provides a secure server-side endpoint for checking URLs
 * against Google's Safe Browsing API. It ensures the API key is never exposed
 * to the client-side and implements proper error handling and validation.
 * 
 * Endpoints:
 * - POST /api/safe-browsing - Check one or more URLs for threats
 * 
 * Security Features:
 * - Server-side only API key usage
 * - Input validation and sanitization
 * - Rate limiting protection
 * - Comprehensive error handling
 * - Request/response logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSafeBrowsingClient, SafeBrowsingError } from '../../../lib/safeBrowsingClient';
import { ThreatDetectionResult } from '../../../types/safeBrowsing';

/**
 * Request body interface for the Safe Browsing API endpoint
 */
interface SafeBrowsingApiRequest {
  /** Single URL or array of URLs to check for threats */
  urls: string | string[];
  /** Optional client identifier for logging purposes */
  clientId?: string;
}

/**
 * Response interface for the Safe Browsing API endpoint
 */
interface SafeBrowsingApiResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Array of threat detection results */
  results?: ThreatDetectionResult[];
  /** Error message if request failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: string;
  /** Additional metadata about the request */
  metadata?: {
    /** Number of URLs checked */
    urlsChecked: number;
    /** Timestamp of the check */
    checkedAt: string;
    /** Processing time in milliseconds */
    processingTimeMs: number;
  };
}

/**
 * POST handler for Safe Browsing API endpoint
 * 
 * Accepts URLs to check and returns threat detection results
 * 
 * @param request Next.js request object
 * @returns JSON response with threat detection results
 */
export async function POST(request: NextRequest): Promise<NextResponse<SafeBrowsingApiResponse>> {
  const startTime = Date.now();
  
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request);
    const urls = normalizeUrls(body.urls);
    
    // Log incoming request (without sensitive data)
    console.log('Safe Browsing API Request:', {
      urlCount: urls.length,
      clientId: body.clientId || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: getClientIp(request)
    });
    
    // Validate URLs
    validateUrls(urls);
    
    // Get Safe Browsing client and check URLs
    const client = getSafeBrowsingClient();
    const results = await client.checkUrls(urls);
    
    const processingTime = Date.now() - startTime;
    
    // Log successful response
    console.log('Safe Browsing API Success:', {
      urlsChecked: urls.length,
      threatsFound: results.filter(r => !r.isSafe).length,
      processingTimeMs: processingTime
    });
    
    // Return successful response
    return NextResponse.json<SafeBrowsingApiResponse>({
      success: true,
      results,
      metadata: {
        urlsChecked: urls.length,
        checkedAt: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    }, { status: 200 });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log error details
    console.error('Safe Browsing API Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error instanceof SafeBrowsingError ? error.code : 'UNKNOWN_ERROR',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });
    
    // Handle different types of errors
    if (error instanceof SafeBrowsingError) {
      return handleSafeBrowsingError(error, processingTime);
    }
    
    // Handle unexpected errors
    return NextResponse.json<SafeBrowsingApiResponse>({
      success: false,
      error: 'Internal server error occurred while checking URLs',
      errorCode: 'INTERNAL_ERROR',
      metadata: {
        urlsChecked: 0,
        checkedAt: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    }, { status: 500 });
  }
}

/**
 * GET handler - returns API information and health status
 * 
 * @param request Next.js request object
 * @returns JSON response with API information
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Check if API is properly configured
    const client = getSafeBrowsingClient();
    const rateLimitInfo = client.getRateLimitInfo();
    const circuitBreakerInfo = client.getCircuitBreakerInfo();
    
    return NextResponse.json({
      service: 'Safe Browsing API',
      version: '1.0.0',
      status: 'healthy',
      endpoints: {
        'POST /api/safe-browsing': 'Check URLs for threats'
      },
      limits: {
        maxUrlsPerRequest: 500,
        rateLimitRemaining: rateLimitInfo.remaining,
        circuitBreakerState: circuitBreakerInfo.state
      },
      documentation: {
        requestFormat: {
          urls: 'string | string[] - URL(s) to check',
          clientId: 'string (optional) - Client identifier'
        },
        responseFormat: {
          success: 'boolean - Request success status',
          results: 'ThreatDetectionResult[] - Threat detection results',
          error: 'string (optional) - Error message',
          errorCode: 'string (optional) - Error code'
        }
      }
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      service: 'Safe Browsing API',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Configuration error'
    }, { status: 503 });
  }
}

/**
 * Parse and validate the request body
 * 
 * @param request Next.js request object
 * @returns Parsed request body
 */
async function parseRequestBody(request: NextRequest): Promise<SafeBrowsingApiRequest> {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      throw new SafeBrowsingError('Request body must be a JSON object', 'INVALID_REQUEST_BODY');
    }
    
    if (!body.urls) {
      throw new SafeBrowsingError('URLs are required in request body', 'MISSING_URLS');
    }
    
    return body as SafeBrowsingApiRequest;
    
  } catch (error) {
    if (error instanceof SafeBrowsingError) {
      throw error;
    }
    
    throw new SafeBrowsingError('Invalid JSON in request body', 'INVALID_JSON');
  }
}

/**
 * Normalize URLs input to always be an array
 * 
 * @param urls Single URL string or array of URLs
 * @returns Array of URL strings
 */
function normalizeUrls(urls: string | string[]): string[] {
  if (typeof urls === 'string') {
    return [urls];
  }
  
  if (Array.isArray(urls)) {
    return urls;
  }
  
  throw new SafeBrowsingError('URLs must be a string or array of strings', 'INVALID_URLS_FORMAT');
}

/**
 * Validate the URLs array
 * 
 * @param urls Array of URLs to validate
 */
function validateUrls(urls: string[]): void {
  if (urls.length === 0) {
    throw new SafeBrowsingError('At least one URL is required', 'NO_URLS_PROVIDED');
  }
  
  if (urls.length > 500) {
    throw new SafeBrowsingError('Maximum 500 URLs allowed per request', 'TOO_MANY_URLS');
  }
  
  // Check for non-string values
  const invalidUrls = urls.filter(url => typeof url !== 'string' || url.trim() === '');
  if (invalidUrls.length > 0) {
    throw new SafeBrowsingError('All URLs must be non-empty strings', 'INVALID_URL_FORMAT');
  }
}

/**
 * Handle SafeBrowsingError instances with appropriate HTTP status codes
 * 
 * @param error SafeBrowsingError instance
 * @param processingTime Processing time in milliseconds
 * @returns NextResponse with appropriate error details
 */
function handleSafeBrowsingError(
  error: SafeBrowsingError,
  processingTime: number
): NextResponse<SafeBrowsingApiResponse> {
  // Map error codes to HTTP status codes
  const statusCodeMap: Record<string, number> = {
    'INVALID_REQUEST_BODY': 400,
    'MISSING_URLS': 400,
    'INVALID_JSON': 400,
    'INVALID_URLS_FORMAT': 400,
    'NO_URLS_PROVIDED': 400,
    'TOO_MANY_URLS': 400,
    'INVALID_URL_FORMAT': 400,
    'INVALID_INPUT': 400,
    'INVALID_URL': 400,
    'MISSING_API_KEY': 500,
    'MISSING_CLIENT_ID': 500,
    'MISSING_CLIENT_VERSION': 500,
    'API_ERROR': 502,
    'API_REQUEST_FAILED': 502,
    'RATE_LIMIT_EXCEEDED': 429,
    'CIRCUIT_BREAKER_OPEN': 503
  };
  
  const statusCode = statusCodeMap[error.code] || 500;
  
  return NextResponse.json<SafeBrowsingApiResponse>({
    success: false,
    error: error.message,
    errorCode: error.code,
    metadata: {
      urlsChecked: 0,
      checkedAt: new Date().toISOString(),
      processingTimeMs: processingTime
    }
  }, { status: statusCode });
}

/**
 * Extract client IP address from request headers
 * 
 * @param request Next.js request object
 * @returns Client IP address or 'unknown'
 */
function getClientIp(request: NextRequest): string {
  // Check various headers for client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

/**
 * OPTIONS handler for CORS preflight requests
 * 
 * @param request Next.js request object
 * @returns CORS headers response
 */
export async function OPTIONS(_request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
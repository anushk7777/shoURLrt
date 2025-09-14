/**
 * URL Shortening API Endpoint
 * 
 * This endpoint handles the creation of shortened URLs server-side,
 * where the Supabase service role key is available for database operations.
 * 
 * POST /api/shorten
 * - Accepts a long URL in the request body
 * - Generates a unique short code using the generation service
 * - Stores the mapping in the database
 * - Returns the shortened URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUniqueShortCode } from '@/lib/shortCodeGenerator';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Request body interface for URL shortening
 */
interface ShortenRequest {
  url: string;
}

/**
 * Response interface for successful URL shortening
 */
interface ShortenResponse {
  success: boolean;
  shortUrl?: string;
  shortCode?: string;
  error?: string;
}

/**
 * URL validation utility function
 * Validates if the input string is a properly formatted URL
 * @param url - The URL string to validate
 * @returns boolean indicating if URL is valid
 */
function isValidUrl(url: string): boolean {
  if (!url.trim()) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Basic security validation for URLs
 * Checks for potentially malicious patterns and self-referencing URLs
 * @param url - The URL string to validate
 * @param requestOrigin - The origin of the current request to prevent loops
 * @returns boolean indicating if URL passes security checks
 */
function isSecureUrl(url: string, requestOrigin: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Prevent redirect loops by checking if URL points back to our domain
    if (urlObj.origin === requestOrigin) {
      return false;
    }
    
    // Basic checks for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Simple in-memory rate limiting
 * Tracks requests per IP address with a sliding window
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Check if request should be rate limited
 * @param clientIP - The client IP address
 * @returns boolean indicating if request should be blocked
 */
function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit for this IP
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  clientData.count++;
  return false;
}

/**
 * Get client IP address from request headers
 * @param request - The NextRequest object
 * @returns string representing the client IP
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP (considering proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default IP for development
  return '127.0.0.1';
}

/**
 * POST handler for URL shortening
 * 
 * @param request - The incoming request with URL to shorten
 * @returns JSON response with shortened URL or error
 */
export async function POST(request: NextRequest): Promise<NextResponse<ShortenResponse>> {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: ShortenRequest = await request.json();
    const { url } = body;

    // Validate input
    if (!url || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid URL starting with http:// or https://' },
        { status: 400 }
      );
    }

    // Security validation
    const requestOrigin = request.headers.get('origin') || request.nextUrl.origin;
    if (!isSecureUrl(url, requestOrigin)) {
      return NextResponse.json(
        { success: false, error: 'URL failed security validation. Suspicious or self-referencing URLs are not allowed.' },
        { status: 400 }
      );
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available. Check SUPABASE_SERVICE_ROLE_KEY environment variable.');
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Generate a unique short code
    const codeResult = await generateUniqueShortCode({ length: 6 });
    
    if (!codeResult.success || !codeResult.shortCode) {
      console.error('Failed to generate short code:', codeResult.error);
      return NextResponse.json(
        { success: false, error: codeResult.error || 'Failed to generate unique short code' },
        { status: 500 }
      );
    }

    const shortCode = codeResult.shortCode;

    // Store the URL mapping in Supabase
    const { error: insertError } = await supabaseAdmin
      .from('links')
      .insert([{ short_code: shortCode, long_url: url }]);

    if (insertError) {
      console.error('Database insertion error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to store URL mapping' },
        { status: 500 }
      );
    }

    // Use the request origin to generate URLs that work in both development and production
    // This ensures the shortened URLs point to the same domain as the application
    const baseUrl = request.nextUrl.origin;
    const shortUrl = `${baseUrl}/${shortCode}`;

    console.log(`Successfully created short URL: ${shortUrl} for ${url}`);

    return NextResponse.json({
      success: true,
      shortUrl,
      shortCode
    });

  } catch (error) {
    console.error('Error in shorten API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns API information
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'URL Shortening API',
    endpoint: 'POST /api/shorten',
    usage: 'Send a POST request with { "url": "https://example.com" }'
  });
}
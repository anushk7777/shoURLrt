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
 * POST handler for URL shortening
 * 
 * @param request - The incoming request with URL to shorten
 * @returns JSON response with shortened URL or error
 */
export async function POST(request: NextRequest): Promise<NextResponse<ShortenResponse>> {
  try {
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
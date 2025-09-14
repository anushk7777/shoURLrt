/**
 * Short URL Redirect Route Handler
 * 
 * This API route handles redirecting short URLs to their original long URLs.
 * It queries the database using the short code and performs a 307 temporary redirect.
 * 
 * @param request - The incoming request object
 * @param params - Route parameters containing the shortId
 * @returns NextResponse with redirect or error
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ shortId: string }> }) {
  try {
    // Await the params promise in Next.js 15+
    const { shortId } = await params;
    
    // Validate short code format
    if (!shortId || typeof shortId !== 'string' || shortId.length < 4 || shortId.length > 8) {
      return NextResponse.json({ error: 'Invalid short code format' }, { status: 400 });
    }
    
    // Ensure supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available - missing service role key');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    
    // Query the database for the short URL using admin client for better reliability
    const { data, error } = await supabaseAdmin
      .from('links')
      .select('long_url, click_count')
      .eq('short_code', shortId)
      .single();

    // Handle database errors
    if (error) {
      console.error('Database error fetching short URL:', error);
      
      // If record not found, return 404
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
      }
      
      // Other database errors
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // If no URL mapping found (shouldn't happen with single() but double-check)
    if (!data || !data.long_url) {
      return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
    }

    // Validate the long URL before redirecting
    try {
      new URL(data.long_url);
    } catch {
      console.error('Invalid URL in database:', data.long_url);
      return NextResponse.json({ error: 'Invalid destination URL' }, { status: 500 });
    }

    // Increment click count atomically using SQL (don't wait for it to complete)
    // This ensures the redirect happens immediately without delay and prevents race conditions
    (async () => {
      try {
        const { error: updateError } = await supabaseAdmin
          .rpc('increment_click_count', { short_code_param: shortId });

        if (updateError) {
          console.error('Failed to increment click count for', shortId, ':', updateError);
        }
      } catch (error) {
        console.error('Unexpected error incrementing click count for', shortId, ':', error);
      }
    })();

    // Redirect to the long URL with 307 (temporary redirect)
    return NextResponse.redirect(data.long_url, 307);
  } catch (error) {
    console.error('Unexpected error in redirect route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
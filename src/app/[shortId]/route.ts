import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ shortId: string }> }) {
  try {
    // Await the params promise in Next.js 15+
    const { shortId } = await params;
    
    // Query the database for the short URL
    const { data, error } = await supabase
      .from('url_mappings')
      .select('long_url')
      .eq('short_id', shortId)
      .single();

    if (error) throw error;

    // If no URL mapping found, return 404
    if (!data) {
      return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
    }

    // Redirect to the long URL
    return NextResponse.redirect(data.long_url, 307);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
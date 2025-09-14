import { NextRequest } from 'next/server';
import { GET } from '@/app/[shortId]/route';
import { supabase } from '@/lib/supabase';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url) => ({
    url,
    method: 'GET',
  })),
  NextResponse: {
    redirect: jest.fn().mockImplementation((url, status) => ({
      status,
      headers: new Headers({ Location: url }),
    })),
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status,
      json: async () => data,
    })),
  },
}));

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

describe('URL Redirection API', () => {
  const mockRequest = new NextRequest('http://localhost:3000/abc123');
  const mockParams = { params: Promise.resolve({ shortId: 'abc123' }) };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to the long URL when short URL exists', async () => {
    const mockData = { long_url: 'https://example.com' };
    const mockSupabaseResponse = {
      data: mockData,
      error: null,
    };

    // Mock the Supabase response
    const mockSingle = jest.fn().mockResolvedValue(mockSupabaseResponse);
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const response = await GET(mockRequest, mockParams);

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toBe(mockData.long_url);
  });

  it('should return 404 when short URL does not exist', async () => {
    const mockSupabaseResponse = {
      data: null,
      error: null,
    };

    // Mock the Supabase response
    const mockSingle = jest.fn().mockResolvedValue(mockSupabaseResponse);
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const response = await GET(mockRequest, mockParams);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Short URL not found');
  });

  it('should return 500 when database error occurs', async () => {
    const mockSupabaseResponse = {
      data: null,
      error: new Error('Database error'),
    };

    // Mock the Supabase response
    const mockSingle = jest.fn().mockResolvedValue(mockSupabaseResponse);
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const response = await GET(mockRequest, mockParams);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal Server Error');
  });
});
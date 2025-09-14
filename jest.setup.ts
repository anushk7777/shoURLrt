import '@testing-library/jest-dom';

// Mock the Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));
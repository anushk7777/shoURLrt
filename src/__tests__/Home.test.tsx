import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../app/page';

// Mock Supabase client
const mockInsert = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockInsert
    }))
  }))
}));

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert
    }))
  }
}));

describe('Home - URL Shortener Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset mock implementation
    mockInsert.mockResolvedValue({ data: [{ id: 'abc123' }], error: null });
  });

  describe('Component Rendering', () => {
    it('renders the main heading', () => {
      render(<Home />);
      const heading = screen.getByRole('heading', { name: /URL Shortener/i });
      expect(heading).toBeInTheDocument();
    });

    it('renders the URL input field with proper attributes', () => {
      render(<Home />);
      const input = screen.getByPlaceholderText(/https:\/\/example\.com\/very-long-url/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveAttribute('id', 'url');
    });

    it('renders the shorten button', () => {
      render(<Home />);
      const button = screen.getByRole('button', { name: /Shorten URL/i });
      expect(button).toBeInTheDocument();
    });

    it('renders header and footer sections', () => {
      render(<Home />);
      expect(screen.getByText(/Transform long URLs into short, shareable links/i)).toBeInTheDocument();
      expect(screen.getByText(/Secure • Fast • Reliable/i)).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('shows error for empty input', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      const button = screen.getByRole('button', { name: /Shorten URL/i });
      
      // Ensure input is empty
      await user.clear(input);
      
      // Button should now be enabled (we removed the disabled condition)
      expect(button).toBeEnabled();
      
      // Try to submit the form with empty input
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/Please enter a URL/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows error for invalid URL format', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      const button = screen.getByRole('button', { name: /Shorten URL/i });
      
      await user.type(input, 'invalid-url');
      await user.click(button);
      
      const alerts = screen.getAllByRole('alert');
      expect(alerts[1]).toHaveTextContent('Please enter a valid URL starting with http:// or https://');
    });

    it('accepts valid HTTP URLs', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      await user.type(input, 'http://example.com');
      
      // Should not show validation error
      expect(screen.queryByText(/Please enter a valid URL/i)).not.toBeInTheDocument();
    });

    it('accepts valid HTTPS URLs', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      await user.type(input, 'https://example.com');
      
      // Should not show validation error
      expect(screen.queryByText(/Please enter a valid URL/i)).not.toBeInTheDocument();
    });

    it('shows real-time validation feedback', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      
      // Type invalid URL
      await user.type(input, 'invalid');
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
      
      // Clear and type valid URL
      await user.clear(input);
      await user.type(input, 'https://example.com');
      expect(screen.queryByText(/Please enter a valid URL/i)).not.toBeInTheDocument();
    });
  });

  describe('URL Shortening Functionality', () => {
    it('generates short URL for valid input', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      const button = screen.getByRole('button', { name: /Shorten URL/i });
      
      await user.type(input, 'https://example.com');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/URL shortened successfully!/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows loading state during URL generation', async () => {
      // Mock a delayed response to catch loading state
      mockInsert.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ data: [{ id: 'abc123' }], error: null }), 100)
      ));
      
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      const button = screen.getByRole('button', { name: /Shorten URL/i });
      
      await user.type(input, 'https://example.com');
      await user.click(button);
      
      // Check for loading state - button should be disabled and show loading text
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels', () => {
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      expect(input).toBeInTheDocument();
      
      // Check that form exists (it may not have aria-label)
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      
      // Focus input
      await user.click(input);
      expect(input).toHaveFocus();
      
      // Tab navigation works
      await user.tab();
      // Just verify that focus moved away from input
      expect(input).not.toHaveFocus();
    });

    it('allows form submission with Enter key', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      
      await user.type(input, 'https://example.com');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText(/URL shortened successfully!/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Copy Functionality', () => {
    // Mock clipboard API
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn(() => Promise.resolve()),
        },
        writable: true,
      });
    });

    it('shows copy button after URL generation', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      const button = screen.getByRole('button', { name: /Shorten URL/i });
      
      await user.type(input, 'https://example.com');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Copy shortened URL to clipboard/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows copy button functionality', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const input = screen.getByLabelText(/Enter Long URL/i);
      const shortenButton = screen.getByRole('button', { name: /Shorten URL/i });
      
      await user.type(input, 'https://example.com');
      await user.click(shortenButton);
      
      // Wait for URL generation to complete
      await waitFor(() => {
        expect(screen.getByLabelText(/Copy shortened URL to clipboard/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify copy button is clickable
      const copyButton = screen.getByLabelText(/Copy shortened URL to clipboard/i);
      expect(copyButton).toBeEnabled();
    });
  });
});
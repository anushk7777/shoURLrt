import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /URL Shortener/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the URL input field', () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/enter long url/i);
    expect(input).toBeInTheDocument();
  });

  it('renders the shorten button', () => {
    render(<Home />);
    const button = screen.getByRole('button', { name: /create short url/i });
    expect(button).toBeInTheDocument();
  });
});
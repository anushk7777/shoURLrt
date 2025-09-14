'use client';

import { useState, useCallback } from 'react';
// Note: We no longer import server-side modules here since we're using the API endpoint
// import { supabase } from '@/lib/supabase';
// import { generateUniqueShortCode } from '@/lib/shortCodeGenerator';

/**
 * URL validation utility function
 * Validates if the input string is a properly formatted URL
 * @param url - The URL string to validate
 * @returns boolean indicating if URL is valid
 */
const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Copy text to clipboard utility function
 * @param text - The text to copy to clipboard
 * @returns Promise<boolean> indicating success
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
};

/**
 * Main URL Shortener Component
 * Provides a simple interface for users to submit long URLs and receive shortened versions
 */
export default function Home() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Validates the URL input in real-time
   * @param inputUrl - The URL to validate
   */
  const validateUrl = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) {
      setValidationError('');
      return;
    }
    
    if (!isValidUrl(inputUrl)) {
      setValidationError('Please enter a valid URL starting with http:// or https://');
    } else {
      setValidationError('');
    }
  }, []);

  /**
   * Handles URL input changes with validation
   * @param e - Input change event
   */
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    validateUrl(newUrl);
    setError('');
    setCopySuccess(false);
  };

  /**
   * Handles copy to clipboard functionality
   */
  const handleCopyToClipboard = async () => {
    if (!shortUrl) return;
    
    const success = await copyToClipboard(shortUrl);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  /**
   * Generates a shortened URL from the provided long URL
   * Uses the server-side API endpoint to handle URL shortening
   * where the service role key is available for database operations
   */
  const generateShortUrl = async () => {
    // Reset previous states
    setError('');
    setCopySuccess(false);
    
    // Validate input
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      setIsLoading(true);

      // Call the server-side API endpoint for URL shortening
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create short URL');
      }

      // Set the shortened URL from the API response
      setShortUrl(result.shortUrl);
      console.log(`Successfully created short URL: ${result.shortUrl}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create short URL. Please try again.';
      setError(errorMessage);
      console.error('Error creating short URL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles form submission
   * @param e - Form submit event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateShortUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md mx-auto">
        {/* Header Section */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔗 URL Shortener
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Transform long URLs into short, shareable links
          </p>
        </header>

        {/* Main Form Card */}
        <main>
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* URL Input Section */}
              <div>
                <label 
                  htmlFor="url" 
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Enter Long URL
                </label>
                <div className="relative">
                  <input
                    id="url"
                    name="url"
                    type="url"
                    required
                    placeholder="https://example.com/very-long-url"
                    aria-describedby={validationError ? 'url-error' : 'url-help'}
                    aria-invalid={validationError ? 'true' : 'false'}
                    className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm transition-colors duration-200 ${
                      validationError 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                    } dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white`}
                    value={url}
                    onChange={handleUrlChange}
                  />
                  {/* Input validation icon */}
                  {url && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {validationError ? (
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Help text */}
                <p id="url-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter a valid URL starting with http:// or https://
                </p>
                
                {/* Validation error message */}
                {validationError && (
                  <p id="url-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {validationError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 dark:bg-blue-500 dark:hover:bg-blue-400"
                  aria-describedby="button-help"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Shorten URL'
                  )}
                </button>
                <p id="button-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click to generate your shortened URL
                </p>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/50 p-4 border border-red-200 dark:border-red-800" role="alert">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">{error}</span>
                </div>
              </div>
            )}

            {/* Success Result */}
            {shortUrl && (
              <div className="mt-6 rounded-lg bg-green-50 dark:bg-green-900/50 p-4 border border-green-200 dark:border-green-800">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">URL shortened successfully!</span>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-mono text-sm break-all underline transition-colors duration-200"
                        data-testid="shortened-url"
                        aria-label={`Shortened URL: ${shortUrl}`}
                      >
                        {shortUrl}
                      </a>
                      
                      <button
                        onClick={handleCopyToClipboard}
                        className="ml-2 flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors duration-200"
                        aria-label="Copy shortened URL to clipboard"
                        title="Copy to clipboard"
                      >
                        {copySuccess ? (
                          <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {copySuccess && (
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400" role="status">
                        ✓ Copied to clipboard!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure • Fast • Reliable
          </p>
        </footer>
      </div>
    </div>
  );
}

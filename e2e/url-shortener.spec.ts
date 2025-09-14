import { test, expect } from '@playwright/test';

test.describe('URL Shortener', () => {
  test('should shorten a URL', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Check if the main elements are visible
    await expect(page.getByRole('heading', { name: /URL Shortener/i })).toBeVisible();
    await expect(page.locator('input[placeholder="Enter long URL"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /create short url/i })).toBeVisible();

    // Fill in the URL
    await page.locator('input[placeholder="Enter long URL"]').fill('https://example.com');

    // Click the shorten button
    await page.getByRole('button', { name: /create short url/i }).click();

    // Wait for the shortened URL to appear
    const shortenedUrl = await page.getByTestId('shortened-url');
    await expect(shortenedUrl).toBeVisible();
    
    // Verify the shortened URL format
    const url = await shortenedUrl.textContent();
    expect(url).toMatch(/^http:\/\/localhost:3000\/[a-zA-Z0-9]+$/);
  });
});
# API Specification

The API will consist of two primary endpoints.

POST /api/links

Request Body: { "longUrl": "https://example.com/..." }

Behavior:

Validates the longUrl.

Checks the URL with the Google Safe Browsing API (with caching).

If unsafe, returns a 400 Bad Request with an error message.

If safe, generates a unique short code, saves the mapping to the links table.

Returns a 201 Created with the full short URL: { "shortUrl": "https://your-domain.com/abc123" }.

GET /{short_code}

Behavior:

Handled by Next.js Middleware or a dynamic route.

Looks up the short_code in the links table.

If found, atomically increments the click_count and issues an HTTP 301 redirect to the long_url.

If not found, returns an HTTP 404 Not Found page.

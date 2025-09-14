# Core Architectural Decisions

Security & Caching Strategy
The Google Safe Browsing API is the core external dependency. To stay within the free tier and ensure low latency, a caching layer is critical.

Implementation: An in-memory cache (e.g., a Map object with a TTL) will be implemented within the serverless function environment.

Consideration: This cache is ephemeral and will reset on cold starts. For post-MVP scale, a persistent cache like Vercel KV or Supabase Redis could be considered.

TTL: A Time-to-Live of 24 hours will be set for API results.

Error, Edge Case, and Abuse Handling
Error Handling: The system will handle malformed short_code requests by serving a 404 page. It will detect potential redirect loops (where a long URL points back to the shortener's domain) and reject them. A fallback behavior will be implemented for Google Safe Browsing API downtime, potentially by allowing shortening with a "not yet verified" status.

Rate Limiting: The POST /api/links endpoint will be rate-limited by IP address to prevent abuse.

Logging & Monitoring
Minimal, structured logging will be implemented for API requests, redirects, and Safe Browsing API results using Vercel's native logging. This will be used for debugging and monitoring traffic patterns against free-tier quotas.

Scalability Considerations
Short Code Collisions: The MVP's uniqueness check (generate and check DB) is sufficient for low volume. Post-MVP, a more advanced algorithm may be needed.

Analytics Expansion: The current schema is minimal. Adding predictive analytics will require expanding the schema to include submission metadata.

Security Principles
Secrets Management: The Google Safe Browsing API key will be stored as a server-side environment variable in Vercel and never exposed to the client.

Transport Security: HTTPS will be enforced across the entire application by Vercel. Basic security headers (e.g., Content Security Policy) will be configured for the frontend.

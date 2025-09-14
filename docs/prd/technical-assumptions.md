# Technical Assumptions

Repository Structure: Monorepo.

Service Architecture: Serverless.

Testing Requirements: Full Testing Pyramid.

Additional Technical Assumptions:

The stack is Next.js with TypeScript, Tailwind CSS, Vercel, and Supabase (PostgreSQL).

A caching layer with a 24-hour Time-to-Live (TTL) will be implemented for Google Safe Browsing API results.

The click counter increment operation must be atomic.

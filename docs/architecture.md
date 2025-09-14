Fullstack Architecture: Intelligent URL Shortener (v1.1)

## Introduction

This document outlines the complete fullstack architecture for the "Intelligent URL Shortener" MVP. The primary goal is to define a robust, scalable, and pragmatic technical blueprint that can be built and operated with zero initial cost. It translates the requirements from the Project Brief and PRD into an actionable plan for development.

Change Log
Date Version Description Author
2025-09-14 1.1 Added final production-readiness considerations for error handling, security, and scalability. Winston (Architect)
2025-09-14 1.0 Initial Architecture Draft Winston (Architect)

Export to Sheets

## High Level Architecture

Technical Summary
The system is a serverless web application built as a monorepo using Next.js. It will be hosted on Vercel, leveraging its global edge network for the frontend and its serverless functions for the backend API. All data will be persisted in a PostgreSQL database managed by Supabase. This "Vercel + Supabase" stack is explicitly chosen for its generous free tiers, which are sufficient to handle the MVP's expected load without incurring costs.

High Level Architecture Diagram
Code snippet

graph TD
subgraph User
Browser
end
subgraph Platform (Free Tiers)
Vercel[Vercel Edge Network]
ServerlessFunc[Next.js API Route<br/>(Serverless Function)]
Supabase[Supabase<br/>(PostgreSQL DB)]
end
subgraph External APIs (Free Tiers)
GoogleSafeBrowsing[Google Safe Browsing API]
end

    Browser -- 1. Submits Long URL --> ServerlessFunc;
    ServerlessFunc -- 2. Checks URL --> GoogleSafeBrowsing;
    GoogleSafeBrowsing -- 3. Returns Verdict --> ServerlessFunc;
    ServerlessFunc -- 4. Stores Safe Link --> Supabase;
    ServerlessFunc -- 5. Returns Short URL --> Browser;
    Browser -- 6. Visits Short URL --> Vercel;
    Vercel -- 7. Redirects --> Browser;

Tech Stack
Category Technology Version Purpose
Frontend Framework Next.js ~14.1.0 Core framework for UI and API.
Language TypeScript ~5.3.3 Type safety for the entire application.
Styling Tailwind CSS ~3.4.1 Utility-first CSS for rapid UI development.
Database Supabase (Postgres) ~15.x Primary data store for link mappings.
CI/CD & Hosting Vercel N/A Platform for deployment and serverless functions.
Testing Jest, Playwright ~29.x Unit, integration, and E2E testing.

Export to Sheets

## Data Models & Schema

A single table is required for the MVP to store the link mappings.

links Table Schema
SQL

CREATE TABLE public.links (
short_code TEXT PRIMARY KEY,
long_url TEXT NOT NULL,
click_count BIGINT DEFAULT 0 NOT NULL,
created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookups on the primary key
CREATE INDEX idx_links_short_code ON public.links(short_code);

## API Specification

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

## Core Architectural Decisions

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

## Project Structure

Plaintext

/
├── app/
│ ├── (api)/ # Backend API Routes
│ │ └── links/
│ │ └── route.ts # Handles POST /api/links
│ ├── [short_code]/ # Dynamic route for redirection
│ │ └── page.tsx
│ ├── layout.tsx
│ └── page.tsx # Main UI for the link shortener
├── lib/
│ ├── db.ts # Supabase client and database functions
│ ├── safe-browsing.ts # Client for Google Safe Browsing API with caching
│ └── utils.ts # Short code generation logic
├── .env.example
├── package.json
└── README.md

## Testing Strategy

Unit Tests: Will cover the short code generation logic and the Safe Browsing API client.

Integration Tests: Will test the POST /api/links endpoint to ensure it correctly interacts with the database and caching layer.

E2E Tests: A Playwright test will simulate the full user journey: submitting a valid URL, getting a short link, and verifying the redirect works.

# Epic List

### Epic 1: Foundation & Core Shortening

Goal: Establish the project's technical foundation and implement the basic URL shortening, storage, and redirection flow.

### Epic 2: Security Integration

Goal: Integrate the Google Safe Browsing API to block malicious links and provide clear, trustworthy feedback to the user.

Epic 3: Basic Analytics & Launch Readiness

Goal: Implement the public click-tracking feature and prepare the application for a public launch.

Epic 4 (Post-MVP): Predictive Click Analytics

Goal: Integrate an AI/ML model to predict the engagement likelihood of a shortened link.

Epic 1: Foundation & Core Shortening
Epic Goal: To establish the project's technical foundation and implement the basic URL shortening, storage, and redirection flow. By the end of this epic, a user can successfully shorten a URL and be redirected to the original link.

Story 1.1: Project Initialization
As a developer, I want a configured monorepo with CI/CD, so that I have a stable foundation for development.
Acceptance Criteria:

A Next.js project is initialized in a monorepo with TypeScript and Tailwind CSS.

A Supabase project is created.

A CI/CD pipeline is set up to deploy to Vercel on pushes to main.

Story 1.2: Database Schema for Links
As a developer, I want a database table to store link mappings, so that shortened links can be persisted.
Acceptance Criteria:

A links table is created in Supabase.

The table includes columns for short_code (primary key), long_url, and created_at.

Story 1.3: Short Code Generation Service
As a developer, I want a service that generates a unique short code, so that each link has a unique identifier.
Acceptance Criteria:

A service is created that generates a short (e.g., 6-8 character) alphanumeric string.

The service checks the database to ensure the generated code is not already in use.

Story 1.4: Link Submission UI
As a user, I want a simple web page with an input field and a button, so that I can submit a long URL to be shortened.
Acceptance Criteria:

The main page displays a single input field and a "Shorten" button.

Basic client-side validation ensures the input is not empty.

Story 1.5: Link Creation API Endpoint
As a developer, I want an API endpoint that handles the link creation logic, so that the frontend can submit URLs for shortening.
Acceptance Criteria:

A POST /api/v1/links endpoint is created.

The endpoint accepts a longUrl in the request body.

It uses the generation service to create a short code and saves the mapping to the database.

It returns the full short URL in the response.

Story 1.6: Redirection Service
As a user, I want to be redirected to the original long URL when I visit a short link, so that the shortened link is functional.
Acceptance Criteria:

The application can handle requests to /{short_code}.

It looks up the short_code in the database.

If found, it issues an HTTP 301 redirect to the long_url.

If not found, it returns an HTTP 404 Not Found error.

Epic 2: Security Integration
Epic Goal: To integrate the Google Safe Browsing API to block malicious links and provide clear, trustworthy feedback to the user, fulfilling the core security promise of the product.

Story 2.1: Safe Browsing API Client
As a developer, I want a secure client to communicate with the Google Safe Browsing API, so that I can check URLs for threats.
Acceptance Criteria:

A backend service is created to act as a client for the Google Safe Browsing API.

The API key is securely managed as a server-side environment variable.

The service can take a URL as input and correctly format the request to the API.

Story 2.2: Implement API Result Caching
As a developer, I want to cache results from the Safe Browsing API, so that we can reduce latency and stay within the free tier.
Acceptance Criteria:

A caching layer (e.g., in-memory or Redis) is implemented for the API client.

Safe Browsing API results for a given URL are cached for a defined TTL (24 hours).

Subsequent requests for the same URL within the TTL period are served from the cache.

Story 2.3: Integrate Security Check into Link Creation
As a user, I want any URL I submit to be automatically checked for safety, so that I can be confident I am not sharing harmful content.
Acceptance Criteria:

The POST /api/v1/links endpoint is updated to call the Safe Browsing API client before generating a short code.

If the API returns a "safe" verdict, the workflow proceeds as normal.

If the API returns an "unsafe" verdict, the link is not created, and an error is returned.

Story 2.4: Unsafe Link UI Feedback
As a user, I want to be clearly notified if my link is rejected for being unsafe, so that I understand why it was blocked.
Acceptance Criteria:

When the API returns an "unsafe" error, the frontend displays a clear, non-alarming warning message.

The message explains that the link was flagged by a security check and cannot be shortened.

Epic 3: Basic Analytics & Launch Readiness
Epic Goal: To implement the public click-tracking feature and add the final polish and operational readiness needed for a public launch.

Story 3.1: Add Click Counter to Schema
As a developer, I want to add a click counter to the database schema, so that we can track link popularity.
Acceptance Criteria:

The links table is updated with a click_count column, defaulting to 0.

Story 3.2: Increment Click Count on Redirect
As a developer, I want the click counter to be incremented every time a link is accessed, so that tracking is accurate.
Acceptance Criteria:

The redirection service is updated to perform an atomic increment of the click_count for the corresponding short code.

The increment operation is performed asynchronously to avoid delaying the redirect.

Story 3.3: Public Statistics Page
As a user, I want to view the total click count for any short link I've created, so that I can see its engagement.
Acceptance Criteria:

The application handles requests to /{short_code}+/stats.

This page retrieves and displays the long_url and the total click_count for the given short code.

If the short code does not exist, a 404 error is displayed.

Story 3.4: Implement API Rate Limiting
As a platform owner, I want to protect the link creation API from abuse, so that the service remains stable for all users.
Acceptance Criteria:

A rate limit is applied to the POST /api/v1/links endpoint.

The limit is configured per IP address (e.g., 10 requests per minute).

Requests exceeding the limit receive an HTTP 429 Too Many Requests response.

Story 3.5: Final Polish & Launch
As a user, I want the application to have a clean, finished look and feel, so that it appears trustworthy and professional.
Acceptance Criteria:

A final review of the UI is conducted, ensuring consistent styling and a simple, intuitive layout.

The application has a clear title, a simple footer, and a link to the open-source repository.

Production environment variables are configured and the application is ready for public traffic.

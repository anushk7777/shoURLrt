# High Level Architecture

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

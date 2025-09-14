# Project Structure

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

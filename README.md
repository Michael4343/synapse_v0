# Synapse - Personalized Professional Feed

An AI-powered application that creates personalized professional feeds by analyzing user-provided URLs and curating relevant publications, patents, funding opportunities, and science news using Perplexity's deep research API.

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Perplexity Deep Research API
- **Deployment**: Vercel (recommended)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the database migrations in the Supabase SQL Editor:
   - Execute `supabase/migrations/001_initial_schema.sql`
   - Execute `supabase/migrations/002_profile_trigger.sql`

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture Overview

The application follows a two-pass AI architecture:

1. **Pass 1**: Analyzes user-submitted URLs to generate a professional profile narrative
2. **Pass 2**: Uses the profile to find relevant content across four categories:
   - Academic publications
   - Patents
   - Funding opportunities  
   - Science news

## Database Schema

- `profiles` - User profiles with generated narrative text
- `submitted_urls` - URLs provided by users for analysis
- `feed_items` - Generated feed content with metadata

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utilities and helpers
├── utils/supabase/   # Supabase client configurations
├── types/            # TypeScript type definitions
└── middleware.ts     # Auth middleware

supabase/
├── migrations/       # Database schema migrations
└── config.toml       # Local Supabase configuration
```

## Development Phases

- [x] **Phase 1**: Foundation Setup - Next.js + Supabase + Auth
- [ ] **Phase 2**: AI Integration - Perplexity API + Edge Functions
- [ ] **Phase 3**: User Interface - Feed display + Management
- [ ] **Phase 4**: Polish & Deploy - Error handling + Production

## Contributing

This project follows the development principles outlined in `CLAUDE.md`:
- Start simple, iterate thoughtfully
- Focus on working solutions over perfect architecture
- Document decisions and maintain code quality

## License

MIT
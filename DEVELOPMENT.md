# Synapse - Development Setup Guide

This guide helps you set up the Synapse app for local development.

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

3. **Run the development server:**
```bash
npm run dev
```

## Detailed Setup

### Prerequisites

- Node.js 18 or later
- npm or yarn package manager
- A Supabase account (free tier works for development)
- A Perplexity API account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd synapse
npm install
```

### 2. Supabase Development Setup

#### Option A: Use Supabase Cloud (Recommended for beginners)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and keys
3. In the SQL Editor, run the migrations:
   - Execute `supabase/migrations/001_initial_schema.sql`
   - Execute `supabase/migrations/002_profile_trigger.sql`

#### Option B: Local Supabase (Advanced)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Start local Supabase:
```bash
supabase start
```

3. Run migrations:
```bash
supabase db reset
```

### 3. Environment Variables

Create `.env.local` with these values:

```env
# Supabase (get from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Perplexity AI (get from perplexity.ai API settings)
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Deploy Edge Functions (Development)

If using Supabase cloud:

```bash
# Login and link your project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy generate-profile
supabase functions deploy generate-feed

# Set secrets
supabase secrets set PERPLEXITY_API_KEY=your_api_key
```

### 5. Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Development Workflow

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth-protected routes
│   ├── login/          # Authentication
│   ├── dashboard/      # Main app
│   └── onboarding/     # User setup
├── components/         # Reusable components  
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
└── utils/              # Utilities and helpers
```

### Key Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

### Database Development

#### Viewing Data
- Use Supabase Dashboard > Table Editor
- Or connect with your favorite PostgreSQL client

#### Making Schema Changes
1. Create new migration file in `supabase/migrations/`
2. Test locally first
3. Apply to development database
4. Deploy to production when ready

#### Example Migration
```sql
-- supabase/migrations/003_add_user_preferences.sql
ALTER TABLE public.profiles 
ADD COLUMN preferences JSONB DEFAULT '{}';
```

### Testing Edge Functions Locally

```bash
# Serve functions locally
supabase functions serve

# Test generate-profile
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-profile' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"userId": "test-user-id"}'
```

## Common Development Tasks

### Adding a New Feed Item Type

1. **Update Database Schema:**
```sql
-- Add to allowed item types (optional constraint)
ALTER TABLE feed_items ADD CONSTRAINT valid_item_types 
CHECK (item_type IN ('publication', 'patent', 'funding_opportunity', 'trending_science_news', 'your_new_type'));
```

2. **Update TypeScript Types:**
```typescript
// src/types/database.ts
export type FeedItemType = 
  | 'publication' 
  | 'patent' 
  | 'funding_opportunity' 
  | 'trending_science_news'
  | 'your_new_type'
```

3. **Update Edge Function Schema:**
```typescript
// supabase/functions/generate-feed/index.ts
// Add new type to JSON schema
```

4. **Update UI Components:**
```typescript
// src/components/FeedItem.tsx
// Add new badge color and metadata rendering
```

### Adding New API Endpoints

Create a new Edge Function:

```bash
supabase functions new your-function-name
```

### Debugging Common Issues

#### "Invalid JWT" Errors
- Check that environment variables are set correctly
- Verify the user is authenticated
- Ensure RLS policies allow the operation

#### Perplexity API Errors
- Check API key is valid and has credits
- Verify the request format matches API documentation
- Monitor rate limits

#### Build Errors
- Run `npm run type-check` to find TypeScript issues
- Check that all imports are correct
- Verify environment variables are available

## Code Style and Standards

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Prefer type inference where possible

### React
- Use functional components with hooks
- Implement proper error boundaries
- Follow Next.js patterns for data fetching

### Database
- Always use RLS policies
- Create indexes for frequently queried columns
- Use transactions for multi-step operations

### API Integration
- Handle all error cases
- Implement proper retry logic
- Log errors for debugging

## Performance Considerations

### Local Development
- Use `console.time()` to measure function performance
- Monitor bundle size with `npm run analyze`
- Check for memory leaks in long-running processes

### Database Queries
- Use `EXPLAIN ANALYZE` to optimize queries
- Avoid N+1 query problems
- Index foreign keys and frequently searched columns

### Edge Functions
- Minimize cold start time
- Cache responses when appropriate
- Handle timeouts gracefully

## Contributing

1. **Create Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes:**
- Follow existing code patterns
- Add tests for new functionality
- Update documentation

3. **Test Thoroughly:**
- Test all user flows
- Verify database migrations
- Check Edge Function deployment

4. **Create Pull Request:**
- Describe changes clearly
- Include any breaking changes
- Reference related issues

## Helpful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)

## Getting Help

If you run into issues:

1. Check the console for error messages
2. Review the Supabase logs
3. Verify environment variables are set
4. Check database permissions and RLS policies
5. Test API endpoints independently

For architecture questions, refer to `architecture.md` for detailed system design documentation.
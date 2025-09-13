# CLAUDE.md - Project Development Guide

This file provides guidance for Claude when working with code in this repository.

## 🎯 Core Philosophy: Simple, Working, Maintainable

### Development Principles
1. **Start Simple** - Build the simplest working solution first
2. **Validate Early** - Get user feedback before over-engineering
3. **Iterate Thoughtfully** - Add complexity only when needed
4. **Document Clearly** - Make handoffs and maintenance easier

## Planning & Execution

### Before Starting
- Write a brief implementation plan to `.claude/tasks/TASK_NAME.md`
- Define the MVP scope clearly
- Document assumptions and approach
- Update the plan as you work

### Task Strategy
- Focus on getting core functionality working first
- Make incremental improvements
- Test changes before marking complete
- Document decisions for future reference

## Code Standards

### Quality Guidelines
- **Clarity** - Write readable, self-documenting code
- **Consistency** - Match existing patterns in the codebase
- **Simplicity** - Avoid premature optimization
- **Completeness** - Ensure changes work end-to-end

### Progressive Development
```
v0.1 → Basic working prototype
v0.2 → Handle main use cases
v0.3 → Add error handling
v1.0 → Production-ready
```

### When to Add Complexity
✅ Code is repeated 3+ times → Extract to function/component
✅ Prop drilling exceeds 3 levels → Consider state management
✅ Performance issues are measured → Optimize
✅ Multiple developers need clear interfaces → Add abstractions

## Frontend Development

### Tech Stack
- **Framework**: React/Next.js 15 with TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State**: useState/Context for simple, Zustand for complex
- **Icons**: Lucide or Heroicons
- **Language**: Australian English (en-AU) for all user-facing text

### Directory Structure
```
/synapse/
├── README.md                    # Project overview and setup instructions
├── CLAUDE.md                   # Project development guide (this file)
├── architecture.md             # Detailed architecture documentation
├── DEPLOYMENT.md               # Cloud deployment instructions
├── DEVELOPMENT.md              # Development workflow guide
├── package.json                # Project dependencies and scripts
├── next.config.js              # Next.js configuration (WSL optimised)
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── .env.local.example          # Environment variables template
├── /src                        # Main application code
│   ├── /app                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout component
│   │   ├── page.tsx            # Home page with auth redirect
│   │   ├── globals.css         # Global styles
│   │   ├── /login              # Authentication pages
│   │   │   ├── page.tsx        # Login/signup form with tabbed interface
│   │   │   └── actions.ts      # Server actions for auth
│   │   ├── /dashboard          # Main dashboard
│   │   │   └── page.tsx        # Feed display with categorised items
│   │   ├── /onboarding         # User onboarding flow
│   │   │   ├── page.tsx        # URL submission form
│   │   │   ├── actions.ts      # Server actions for URL processing
│   │   │   └── /processing     # Profile generation status
│   │   │       └── page.tsx    # Real-time progress display
│   │   └── /logout             # Logout endpoint
│   │       └── route.ts        # Logout server action
│   ├── /components             # Reusable React components
│   │   ├── ErrorBoundary.tsx   # Error handling component
│   │   ├── Loading.tsx         # Loading states component
│   │   ├── RefreshFeedButton.tsx  # Feed regeneration button
│   │   └── FeedItem.tsx        # Individual feed item display
│   ├── /hooks                  # Custom React hooks
│   │   └── useProfile.ts       # Profile/feed generation hooks
│   ├── /types                  # TypeScript type definitions
│   │   └── database.ts         # Supabase database types
│   ├── /utils/supabase         # Supabase client configurations
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # SSR middleware helper
│   └── middleware.ts           # Next.js auth middleware
├── /supabase                   # Cloud Supabase configuration
│   ├── config.toml             # Supabase project settings
│   ├── /migrations             # Database schema migrations
│   │   ├── 001_initial_schema.sql       # Core tables and RLS
│   │   ├── 002_profile_trigger.sql      # Auto-profile creation
│   │   └── 003_add_keywords_profile_type.sql # Extended profile data
│   └── /functions              # Supabase Edge Functions (cloud)
│       ├── /generate-profile   # Pass 1: Profile generation
│       │   └── index.ts        # Perplexity + Firecrawl integration
│       └── /generate-feed      # Pass 2: Feed curation
│           └── index.ts        # Structured JSON feed generation
├── /scripts                    # Development utilities
├── /debug                      # Debug files (gitignored)
│   └── /edge-functions         # Function debugging tools
├── /docs                       # Project documentation
│   ├── development-history.md  # Historical development changes
│   └── profile-generation-complete-guide.md # Profile generation docs
└── /.claude                   # Development documentation
    └── /tasks                 # Implementation progress tracking
```

## Development Workflow

### Common Commands
```bash
npm run dev:wsl  # WSL-optimised development server (recommended)
npm run dev:fast # Turbopack optimised development server
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Check code quality
npm run typecheck # TypeScript validation
```

### Progress Communication
1. Clarify the task requirements
2. Outline the approach
3. Implement incrementally
4. Summarise what was completed

## Current Application Status

### Key Features Implemented
- ✅ **Authentication System**: Tabbed signin/signup with proper UX
- ✅ **Database Schema**: Profiles, submitted URLs, and feed items with RLS
- ✅ **Two-Pass AI Architecture**: Profile generation → Feed curation
- ✅ **Perplexity Integration**: Deep research API with structured outputs
- ✅ **Real-time Processing**: Live progress updates during onboarding
- ✅ **Categorised Feed Display**: Publications, patents, funding, news
- ✅ **Responsive UI**: Tailwind CSS with modern design patterns
- ✅ **Australian English**: Consistent spelling throughout UI
- ✅ **Performance Optimised**: WSL-specific development optimisations

### Current Status
- ✅ **Phase 1**: Foundation (Next.js 15 + TypeScript + Tailwind CSS)
- ✅ **Phase 2**: Core Features (Auth + Database + API integration)
- ✅ **Phase 3**: User Experience (Performance + UX improvements)
- 🚧 **Phase 4**: Production deployment and error handling

### Environment Variables Required
```bash
# Supabase (Always Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# API Keys (Perplexity minimum required)
PERPLEXITY_API_KEY=your-perplexity-api-key-here

# Optional Enhanced Features
FIRECRAWL_API_KEY=your-firecrawl-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

## Testing & Verification

### MVP Checklist
- [x] Core feature works as intended
- [x] No breaking errors
- [x] Basic user flow is complete
- [x] Authentication working properly
- [x] Profile generation functional
- [x] Feed display operational

### Production Checklist
- [ ] End-to-end testing complete
- [ ] Error boundaries implemented
- [ ] Performance optimised
- [ ] Security review completed
- [ ] Deployment configuration verified

## Best Practices

### Start With
- Working code over perfect architecture
- Inline styles before component libraries
- Local state before state management
- Manual testing before automation

### Evolve To
- Reusable components when patterns emerge
- Proper error boundaries when stable
- Optimised performance when measured
- Comprehensive tests when validated

### Avoid
- Over-engineering before validation
- Abstractions for single-use cases
- Premature performance optimisation
- Complex architecture without clear need

## Security & Deployment

### Key Considerations
- Keep sensitive data in environment variables
- Validate user inputs
- Use HTTPS in production
- Follow security best practices
- Row Level Security (RLS) enabled on all tables

### Documentation
- README with setup instructions
- API documentation if applicable
- Architecture decisions when relevant
- Deployment instructions

## Remember
**Good code ships and works.** Start simple, iterate based on real needs, and maintain code quality without over-engineering. The best solution is often the simplest one that solves the problem.

---

## Quick Reference

### Development Server
- **Primary**: `npm run dev:wsl` (optimised for WSL - 87s → 23s startup)
- **Alternative**: `npm run dev:fast` (Turbopack optimised)
- **Current Port**: http://localhost:3001

### Key Files to Know
- **Authentication**: `src/app/login/` (tabbed interface with UX improvements)
- **Main Dashboard**: `src/app/dashboard/page.tsx`
- **Profile Generation**: `supabase/functions/generate-profile/index.ts` (simplified architecture)
- **Feed Generation**: `supabase/functions/generate-feed/index.ts`

### Recent Status
- **Development Performance**: Significantly improved (74% faster startup)
- **Authentication UX**: Redesigned with tabbed interface
- **Profile Generation**: Simplified from complex multi-API to single Perplexity call
- **Landing Page**: Fixed layout shifting issues
- **Text Standards**: Australian English consistently applied

For detailed historical information and technical implementation details, see `/docs/development-history.md`

---

*Always update CLAUDE.md at the end of each step with new directory structure and create documentation in `/docs/` for detailed changes.*
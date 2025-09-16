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
├── .env.local                  # Environment variables (includes PostHog keys)
├── /src                        # Main application code
│   ├── /app                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with PostHog provider
│   │   ├── page.tsx            # Home page with auth tracking
│   │   ├── globals.css         # Global styles
│   │   ├── /login              # Authentication pages
│   │   │   ├── page.tsx        # Login/signup form with tracking
│   │   │   └── actions.ts      # Server actions for auth
│   │   ├── /dashboard          # Main dashboard
│   │   │   ├── page.tsx        # Feed display with categorised items
│   │   │   └── DashboardClient.tsx  # Client-side tracking component
│   │   ├── /onboarding         # User onboarding flow
│   │   │   ├── page.tsx        # URL submission form with tracking
│   │   │   ├── actions.ts      # Server actions for URL processing
│   │   │   └── /processing     # Profile generation status
│   │   │       └── page.tsx    # Real-time progress with tracking
│   │   └── /logout             # Logout endpoint
│   │       └── route.ts        # Logout server action
│   ├── /providers              # React context providers
│   │   └── PostHogProvider.tsx # PostHog analytics provider
│   ├── /components             # Reusable React components
│   │   ├── ErrorBoundary.tsx   # Error handling component
│   │   ├── Loading.tsx         # Loading states component
│   │   ├── RefreshFeedButton.tsx  # Feed regeneration with settings and tracking
│   │   ├── FeedSettingsModal.tsx  # Feed preferences modal with keywords and categories
│   │   └── FeedItem.tsx        # Individual feed item with interaction tracking
│   ├── /hooks                  # Custom React hooks
│   │   ├── useProfile.ts       # Profile/feed generation hooks
│   │   └── usePostHogTracking.ts # Comprehensive tracking hook
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
│   │   ├── 003_add_keywords_profile_type.sql # Extended profile data
│   │   └── 004_add_feed_preferences.sql # Feed customization preferences
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
│   ├── profile-generation-complete-guide.md # Profile generation docs
│   └── posthog-integration.md  # PostHog analytics documentation
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
- ✅ **Authentication System**: Tabbed signin/signup with proper UX and tracking
- ✅ **Password Reset System**: Complete forgot password flow with email links
- ✅ **Database Schema**: Profiles, submitted URLs, and feed items with RLS
- ✅ **Two-Pass AI Architecture**: Profile generation → Feed curation
- ✅ **Perplexity Integration**: Deep research API with structured outputs
- ✅ **Real-time Processing**: Live progress updates during onboarding
- ✅ **Categorised Feed Display**: Publications, patents, funding, news
- ✅ **Feed Preferences System**: User-customizable feed settings with keyword search and category toggles
- ✅ **Responsive UI**: Tailwind CSS with modern design patterns
- ✅ **Australian English**: Consistent spelling throughout UI
- ✅ **Performance Optimised**: WSL-specific development optimisations
- ✅ **PostHog Analytics**: Comprehensive user tracking and session recording

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

# PostHog Analytics (Required for tracking)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-api-key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

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

## 🔬 Enhanced Feed Discovery System - September 15, 2025

### Major Research Discovery Enhancement
Successfully redesigned feed generation from basic content aggregation to strategic research discovery tool, eliminating researcher's own work and focusing on breakthrough content.

#### Problems Solved:
- ❌ **Showing researcher's own work** - Defeating discovery purpose
- ❌ **Outdated content mixing** - No time filtering or recency focus
- ❌ **Generic search results** - Lack of strategic value and quality filtering
- ❌ **Poor relevance ranking** - All content treated equally

#### Solution Implemented:
- ✅ **Smart exclusion filtering** - Automatically detects and excludes researcher's publications/patents
- ✅ **Time-bounded discovery** - 18-month window for publications, 6 months for field intelligence
- ✅ **Quality-focused curation** - High-impact journals, breakthrough methodologies, strategic funding
- ✅ **Enhanced categorisation** - Four discovery-focused categories with impact/urgency indicators

#### New Discovery Categories:
1. **Breakthrough Publications** 🔥 - Revolutionary papers with novel methodologies
2. **Emerging Technologies** ⚡ - Early-stage innovations with application potential
3. **Strategic Funding** 💎 - High-value opportunities matching researcher capabilities
4. **Field Intelligence** 📊 - Major developments affecting research landscape

#### Technical Implementation:
- **Intelligent Profile Analysis**: Extracts researcher name/institution for exclusion
- **Enhanced Prompt Engineering**: Discovery-focused AI instructions with quality filters
- **Rich Metadata Processing**: Impact scoring, relevance analysis, strategic value assessment
- **Visual Quality Indicators**: 🔥⭐💡 (impact) and 🚨⏰📅 (urgency) scoring

#### User Experience Enhancements:
- **Quality Indicators**: Visual impact and urgency scoring for quick assessment
- **Contextual Information**: Why content matters specifically for this researcher
- **Enhanced Metadata Display**: Detailed analysis including fit analysis, competitive advantage
- **Strategic Categorisation**: Focus on actionable research intelligence

#### Files Modified:
1. **`supabase/functions/generate-feed/index.ts`**: Complete prompt redesign with exclusion logic (62-181 lines enhanced)
2. **`src/components/FeedItem.tsx`**: Enhanced UI with quality indicators and rich metadata display
3. **`docs/enhanced-feed-discovery-system.md`**: Comprehensive documentation of new discovery approach

#### Impact Achieved:
- **Discovery Value**: Eliminates researcher's own work, focuses on novel breakthroughs
- **Quality Curation**: High-impact content only with strategic relevance
- **Actionable Intelligence**: Clear next steps and opportunity identification
- **Enhanced UX**: Visual quality indicators and contextual explanations

---

## 📊 PostHog Analytics Integration - September 15, 2025

### Comprehensive User Tracking Implementation
Successfully integrated PostHog analytics with full session recording and comprehensive event tracking across the entire Synapse user journey.

#### Analytics Features Implemented:
- ✅ **Full Session Recording**: Complete user interaction capture for prototype insights
- ✅ **Authentication Tracking**: Signup/login success/failure rates with user identification
- ✅ **Onboarding Analytics**: URL submission patterns and profile generation performance
- ✅ **Feed Interaction Tracking**: Item clicks, category engagement, and refresh patterns
- ✅ **Error Monitoring**: Comprehensive error tracking with contextual information
- ✅ **Performance Metrics**: Generation duration tracking for AI operations

#### Technical Implementation:
- **PostHog Provider**: Centralised context with 2025 configuration defaults
- **Custom Tracking Hook**: Type-safe tracking methods for all user interactions
- **Strategic Event Schema**: Research-focused event properties and naming conventions
- **Privacy-Focused Configuration**: Prototype-ready with full data capture

#### Event Categories Tracked:
1. **Authentication Flow**: Complete signup/login journey with method tracking
2. **Onboarding Process**: URL submission, profile generation, and completion metrics
3. **Feed Interactions**: Item clicks, category views, and refresh behaviours
4. **Research Discovery**: Content engagement and breakthrough identification
5. **Performance Monitoring**: API response times and generation durations

#### Files Added/Modified:
1. **New**: `src/providers/PostHogProvider.tsx` - Analytics context provider
2. **New**: `src/hooks/usePostHogTracking.ts` - Comprehensive tracking interface
3. **New**: `src/app/dashboard/DashboardClient.tsx` - Dashboard tracking component
4. **New**: `docs/posthog-integration.md` - Complete integration documentation
5. **Modified**: Multiple components with tracking integration
6. **Updated**: Environment configuration with PostHog variables

#### Impact Achieved:
- **User Journey Visibility**: Complete visibility into research discovery patterns
- **Performance Insights**: Real-time monitoring of AI generation operations
- **Prototype Analytics**: Maximum data collection for early product insights
- **Error Tracking**: Comprehensive error monitoring with contextual debugging

---

## 🔐 Password Reset System - September 16, 2025

### Complete Forgot Password Implementation
Successfully implemented comprehensive password reset functionality with email-based reset links, providing users with a secure way to recover their accounts.

#### Features Implemented:
- ✅ **Forgot Password Link**: Integrated into Sign In form with intuitive "Forgot password?" link
- ✅ **Email Reset Flow**: Secure password reset using Supabase's `resetPasswordForEmail` API
- ✅ **Dedicated Reset Page**: Clean password update interface at `/reset-password`
- ✅ **Session Validation**: Automatic verification of reset link validity
- ✅ **Password Confirmation**: Matching password fields with client-side validation
- ✅ **User-friendly Messages**: Clear feedback for success, error, and rate limiting scenarios
- ✅ **PostHog Tracking**: Complete analytics for password reset funnel

#### Technical Implementation:

**1. Server Actions (`src/app/login/actions.ts`)**
- **`resetPassword`**: Handles forgot password requests with email validation and rate limiting
- **`updatePassword`**: Processes new password updates with session verification
- Enhanced error handling with user-friendly messaging
- Proper redirects with success/error parameters

**2. Reset Password Page (`src/app/reset-password/page.tsx`)**
- Session validation to ensure valid reset link
- Password confirmation with client-side matching
- Loading states and error handling
- Consistent UI design with main authentication flow
- PostHog tracking integration

**3. Enhanced Login Page (`src/app/page.tsx`)**
- Added 'forgot' state to existing tabbed interface
- "Forgot password?" link in Sign In form
- Back navigation from forgot password to sign in
- Conditional form rendering based on active state
- Unified form submission handling

**4. PostHog Analytics (`src/hooks/usePostHogTracking.ts`)**
- **`trackPasswordResetRequested`**: Tracks forgot password requests with email domain
- **`trackPasswordResetSubmitted`**: Tracks password update attempts
- **`trackPasswordResetCompleted`**: Tracks successful password resets
- Comprehensive error tracking throughout the flow

#### User Experience Features:
- **Intuitive Navigation**: "Forgot password?" link appears contextually in Sign In form
- **Clear Instructions**: Step-by-step guidance through the reset process
- **Session Security**: Automatic validation of reset tokens and expiration
- **Error Handling**: Graceful handling of expired links, invalid emails, and rate limits
- **Consistent Design**: Matches existing authentication UI patterns

#### Security Considerations:
- **Email Validation**: Only sends reset emails to valid registered accounts
- **Rate Limiting**: Prevents abuse with appropriate error messaging
- **Secure Redirects**: Uses NEXT_PUBLIC_SITE_URL for email redirect links
- **Session Expiry**: Automatic handling of expired reset tokens
- **Password Requirements**: Enforces minimum 6-character passwords

#### Files Added/Modified:
1. **Enhanced**: `src/app/login/actions.ts` - Added `resetPassword` and `updatePassword` server actions
2. **New**: `src/app/reset-password/page.tsx` - Complete password reset page
3. **Modified**: `src/app/page.tsx` - Added forgot password state and form handling
4. **Enhanced**: `src/hooks/usePostHogTracking.ts` - Password reset analytics methods

#### Impact Achieved:
- **Complete Recovery Flow**: Users can now recover forgotten passwords seamlessly
- **Security Compliance**: Follows best practices for password reset flows
- **User Experience**: Intuitive interface with clear feedback and guidance
- **Analytics Coverage**: Full funnel tracking for password reset operations
- **Error Resilience**: Graceful handling of all error scenarios

#### Password Reset Flow Fix - September 16, 2025:
- **Issue**: Reset links were logging users in but redirecting to dashboard instead of password reset form
- **Root Cause**: Main page automatically redirected all authenticated users to dashboard, conflicting with password reset flow
- **Solution**:
  - Added password reset flow detection in main page using `type=recovery` URL parameter
  - Enhanced reset password page to properly handle Supabase session tokens from email links
  - Fixed redirect logic to route password reset users to `/reset-password` instead of `/dashboard`
- **Result**: Password reset links now properly show the password update form instead of logging users in

#### Password Reset Flow Fix v2 - September 16, 2025:
- **Issue**: Users still being logged in instead of seeing password reset form after initial fix
- **Root Cause**: Password reset links might redirect to home page first with tokens instead of directly to reset page
- **Enhanced Solution**:
  - Added token detection (`access_token` + `refresh_token`) in main page to identify reset flow
  - Enhanced redirect logic to preserve all query parameters when routing to reset page
  - Added `?from=email` parameter to reset redirectTo URL for better tracking
  - Improved error messaging on reset page based on entry method
  - Added development-only debug logging to troubleshoot the flow
- **Result**: Now detects password reset flow regardless of which page users land on first

#### Hydration Error Fix - September 16, 2025:
- **Issue**: Console errors about hydration mismatches due to server/client rendering differences
- **Root Cause**: Components using `window` object during SSR causing client/server HTML mismatch
- **Solution**:
  - Added `suppressHydrationWarning={true}` to root HTML element for VS Code extension styles
  - Added client-side checks (`typeof window !== 'undefined'`) before accessing window object
  - Created `getCurrentUrl()` helper in PostHog tracking to safely handle URLs
  - Added `isClient` state in PageviewTracker to prevent SSR execution
- **Result**: Eliminated hydration warnings and improved SSR/client consistency

---

## 🛠️ Feed Preferences System - September 15, 2025

### New User Customization Feature
Successfully implemented comprehensive feed preferences system allowing users to customize their research feed with keyword search and category filtering.

#### Features Implemented:
- ✅ **Keyword Search**: Additional search terms to refine feed content beyond user profile
- ✅ **Category Toggles**: Enable/disable specific content types (Publications, Patents, Funding, News)
- ✅ **Persistent Settings**: User preferences saved to database and auto-loaded on refresh
- ✅ **Settings Modal**: Clean UI with gear icon trigger and intuitive form interface
- ✅ **Smart Integration**: Keywords seamlessly integrated into AI prompt generation

#### Technical Implementation:
1. **Database Schema**: Added `feed_preferences` JSONB column to profiles table
2. **React Components**: Created `FeedSettingsModal` with keyword input and category checkboxes
3. **Enhanced Refresh Button**: Updated with settings gear icon and modal integration
4. **Hook Modifications**: Extended `useProfile` to accept preferences parameter
5. **Edge Function Updates**: Modified AI prompt generation to incorporate user keywords and category filtering

#### User Experience:
- **Settings Access**: Gear icon next to refresh button for easy discovery
- **Real-time Persistence**: Settings automatically saved and applied to all future feed refreshes
- **Keyword Enhancement**: User keywords combined with profile analysis for better content discovery
- **Category Control**: Fine-grained control over content types displayed in feed

#### Files Added/Modified:
1. **New**: `supabase/migrations/004_add_feed_preferences.sql` - Database schema extension
2. **New**: `src/components/FeedSettingsModal.tsx` - Settings interface component
3. **Modified**: `src/components/RefreshFeedButton.tsx` - Added settings integration
4. **Modified**: `src/hooks/useProfile.ts` - Added preferences parameter support
5. **Modified**: `supabase/functions/generate-feed/index.ts` - Enhanced AI prompt with preferences

#### Impact Achieved:
- **User Control**: Full customization over feed content and discovery keywords
- **Enhanced Discovery**: Keyword search extends beyond profile for broader research discovery
- **Performance**: Only requested categories are processed, improving generation speed
- **Persistence**: Settings saved permanently for consistent user experience

---

## 📚 Sidebar Feed History System - September 15, 2025

### Complete Historical Feed Management Implementation
Successfully implemented comprehensive sidebar with historical feed management, allowing users to save, browse, and switch between all previous feed generations and keyword searches.

#### Features Implemented:
- ✅ **Collapsible Sidebar**: Responsive sidebar with feed session history
- ✅ **Session Management**: Every refresh/keyword search creates a saved session
- ✅ **Feed Switching**: Click any historical session to view its content
- ✅ **Smart Titles**: Auto-generated descriptive titles with timestamps
- ✅ **Session Types**: Visual indicators for refresh vs keyword search sessions
- ✅ **Delete Functionality**: Remove old sessions with confirmation
- ✅ **Current Feed Indicator**: Clear distinction between current and historical feeds
- ✅ **Auto-cleanup**: Automatic removal of old sessions (keeps last 20)

#### Database Implementation:
1. **New Table**: `feed_sessions` - Stores session metadata and preferences
2. **Updated Schema**: Added `session_id` foreign key to `feed_items` table
3. **RLS Policies**: Comprehensive row-level security for sessions
4. **Auto-cleanup Trigger**: Maintains reasonable session history limit
5. **Migration**: `005_add_feed_sessions.sql` with complete schema updates

#### Frontend Components:
1. **FeedSidebar**: Main sidebar component with session list and controls
2. **FeedHistoryItem**: Individual session item with click/delete actions
3. **Updated Dashboard**: Split layout with sidebar integration
4. **Enhanced DashboardClient**: Session switching and feed loading logic

#### Technical Features:
- **Session Creation**: Every feed generation creates titled session record
- **Lazy Loading**: Historical feed items loaded only when needed
- **State Management**: Active session tracking with proper data switching
- **Error Handling**: Graceful handling of missing/corrupted sessions
- **Mobile Responsive**: Collapsible sidebar for mobile devices

#### User Experience:
- **Visual Indicators**: Active session highlighting and type icons
- **Smart Navigation**: Current feed vs historical feed clear distinction
- **Intuitive Controls**: Collapse/expand sidebar, delete with confirmation
- **Persistent History**: Sessions survive browser restarts and page refreshes
- **Quick Access**: One-click switching between any historical feed

#### PostHog Analytics Integration:
- **Session Tracking**: Complete analytics for session creation, switching, deletion
- **User Behavior**: Sidebar collapse/expand and navigation patterns
- **Error Monitoring**: Failed session operations tracked
- **Usage Metrics**: Historical feed engagement and access patterns

#### Files Added/Modified:
1. **New**: `supabase/migrations/005_add_feed_sessions.sql` - Database schema
2. **New**: `src/components/FeedSidebar.tsx` - Main sidebar component
3. **New**: `src/components/FeedHistoryItem.tsx` - Session item component
4. **Modified**: `src/types/database.ts` - Added FeedSession type definitions
5. **Modified**: `src/app/dashboard/DashboardClient.tsx` - Sidebar integration
6. **Modified**: `src/hooks/useProfile.ts` - Session creation on feed generation
7. **Modified**: `supabase/functions/generate-feed/index.ts` - Session ID linking

#### Impact Achieved:
- **Complete History**: Never lose previous feed generations
- **Enhanced UX**: Intuitive historical navigation with visual feedback
- **Data Preservation**: All feed content preserved with proper relationships
- **Performance**: Efficient lazy loading prevents data bloat
- **Analytics**: Comprehensive tracking for prototype insights

---

## 🔧 Unified Keyword Search System - September 16, 2025

### Major Feed Generation Architecture Improvement
Successfully unified keyword search and profile-based feed generation into a single, cohesive system that properly replaces the current feed instead of adding separate search results.

#### Problems Solved:
- ❌ **Separate search results display** - Keyword search showed results in separate section below main feed
- ❌ **No feed replacement** - Previous feed remained while search results were appended
- ❌ **Duplicate edge functions** - Separate `keyword-search` and `generate-feed` functions
- ❌ **No session integration** - Keyword search didn't integrate with feed history system

#### Solution Implemented:
- ✅ **Unified edge function** - Single `generate-feed` function handles both profile-based and keyword-only searches
- ✅ **Proper feed replacement** - Keyword search now creates new current feed that replaces existing one
- ✅ **Session integration** - All searches (keyword and profile) create proper session records in history
- ✅ **Clean UI flow** - Keyword search triggers page refresh showing new current feed, no separate sections

#### Technical Implementation:

**1. Enhanced Edge Function (`supabase/functions/generate-feed/index.ts`)**
- Added `searchType` and `keywordOnlySearch` parameters to handle different search modes
- Dual prompt system: profile-based vs pure keyword search prompts
- Unified response format and database insertion logic
- Maintains all existing functionality while adding keyword-only search capability

**2. Simplified Hook Logic (`src/hooks/useProfile.ts`)**
- Modified `keywordSearch` to use unified `generate-feed` function
- Removed dependency on separate `keyword-search` edge function
- Consistent error handling and session creation across all search types

**3. Clean Dashboard Integration (`src/app/dashboard/DashboardClient.tsx`)**
- Removed separate search results state and display logic
- Keyword search now triggers page refresh to show new current feed
- Eliminated `SearchResultsSection` component dependency
- Unified feed display logic for all search types

**4. Removed Redundant Components**
- Deleted `supabase/functions/keyword-search/` edge function
- Removed `src/components/SearchResultsSection.tsx` component
- Cleaned up imports and unused state variables

#### User Experience Improvement:
- **Intuitive Flow**: Keyword search creates new current feed, previous feed saved to history automatically
- **Consistent Interface**: All feed operations (refresh, keyword search, preferences) work identically
- **Historical Navigation**: Keyword search sessions appear in sidebar with proper titles
- **Clean UI**: No more separate search result sections cluttering the interface

#### Files Modified:
1. **Enhanced**: `supabase/functions/generate-feed/index.ts` - Unified search handling
2. **Simplified**: `src/hooks/useProfile.ts` - Unified function calls
3. **Cleaned**: `src/app/dashboard/DashboardClient.tsx` - Removed separate display logic
4. **Removed**: `supabase/functions/keyword-search/` and `src/components/SearchResultsSection.tsx`

#### Impact Achieved:
- **Unified Architecture**: Single consistent system for all feed generation types
- **Better UX**: Keyword search properly replaces feed as users expect
- **Cleaner Codebase**: Eliminated redundant components and complex state management
- **Session Integration**: All search operations properly tracked in feed history

---

*Always update CLAUDE.md at the end of each step with new directory structure and create documentation in `/docs/` for detailed changes. DO NOT SETUP A SERVER I HAVE ON RUNNING*
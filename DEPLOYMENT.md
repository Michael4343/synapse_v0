# Synapse - Deployment Guide

This guide walks you through deploying the Synapse app to production using Supabase and Vercel.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Vercel account
- A Perplexity API account

## 1. Supabase Setup

### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `synapse-production`
   - Database Password: Generate a secure password
   - Region: Choose closest to your users

### Set Up Database Schema

1. In the Supabase dashboard, go to the SQL Editor
2. Run the following migrations in order:

**Migration 1: Core Schema**
```sql
-- Paste the contents of supabase/migrations/001_initial_schema.sql
```

**Migration 2: Profile Trigger**
```sql
-- Paste the contents of supabase/migrations/002_profile_trigger.sql
```

### Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login and link to your project:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

3. Deploy the functions:
```bash
supabase functions deploy generate-profile
supabase functions deploy generate-feed
```

### Configure Authentication

1. In the Supabase dashboard, go to Authentication > Settings
2. Set Site URL to your production domain: `https://your-app.vercel.app`
3. Add redirect URLs for auth flows

## 2. Get API Keys

### Supabase Keys
In your Supabase project dashboard:
- Go to Settings > API
- Copy the Project URL and anon (public) key
- Copy the service_role (secret) key

### Perplexity API Key
1. Go to [perplexity.ai](https://perplexity.ai)
2. Sign in and navigate to API settings
3. Create a new API key
4. Copy the key for use in environment variables

## 3. Vercel Deployment

### Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Select the synapse project

### Configure Environment Variables

In the Vercel project settings, add these environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Perplexity AI
PERPLEXITY_API_KEY=your_perplexity_api_key

# App Configuration
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-app.vercel.app`

## 4. Post-Deployment Setup

### Test the Application

1. Visit your deployed app
2. Sign up for a new account
3. Complete the onboarding flow with test URLs
4. Verify that profile generation and feed curation work

### Configure Supabase Edge Function Secrets

The Edge Functions need the Perplexity API key:

```bash
supabase secrets set PERPLEXITY_API_KEY=your_perplexity_api_key
```

### Update Supabase Auth Settings

1. In Supabase dashboard, go to Authentication > Settings
2. Update the Site URL to match your Vercel domain
3. Add any additional redirect URLs if needed

## 5. Cost Management

### Perplexity API Usage
- Monitor usage in the Perplexity dashboard
- Consider implementing rate limiting for production
- The sonar-deep-research model has multiple cost factors

### Supabase Usage
- Monitor database usage and API calls
- Set up billing alerts in the Supabase dashboard
- Consider upgrading to Pro plan for production workloads

## 6. Monitoring and Maintenance

### Logs
- Vercel: Check function logs in the Vercel dashboard
- Supabase: Monitor Edge Function logs in the Supabase dashboard
- Database: Use the Supabase logs explorer

### Error Tracking
Consider adding error tracking services like:
- Sentry for error monitoring
- LogRocket for user session replay
- Vercel Analytics for performance monitoring

## 7. Scaling Considerations

### Database Optimization
- Add indexes for frequently queried columns
- Consider connection pooling for high traffic
- Monitor query performance

### API Rate Limiting
```sql
-- Example rate limiting table
CREATE TABLE api_usage (
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,
  requests_count INTEGER DEFAULT 0,
  reset_time TIMESTAMPTZ,
  PRIMARY KEY (user_id, endpoint)
);
```

### Caching Strategy
- Cache user profiles for 24 hours
- Cache feed items for 6 hours
- Use Next.js ISR for static content

## Troubleshooting

### Common Issues

**Edge Functions Not Working**
- Ensure environment variables are set in Supabase
- Check function logs for errors
- Verify CORS headers are set correctly

**Authentication Issues**
- Verify Site URL matches exactly
- Check redirect URLs include protocol (https://)
- Ensure environment variables are set correctly

**Database Connection Issues**
- Check RLS policies are enabled
- Verify user permissions
- Monitor connection pool usage

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Perplexity API Documentation](https://docs.perplexity.ai)

## Security Checklist

- [ ] All environment variables use secure values
- [ ] RLS policies are enabled on all tables
- [ ] API keys are stored as secrets, not in code
- [ ] HTTPS is enabled for all domains
- [ ] CORS is configured properly
- [ ] Rate limiting is implemented
- [ ] Error messages don't expose sensitive information
- [ ] Database backups are enabled
- [ ] Monitoring and alerting are set up

## Performance Optimization

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Lazy load components where possible
3. **Database Indexing**: Add indexes for query optimization
4. **CDN**: Leverage Vercel's global CDN
5. **Caching**: Implement appropriate caching strategies
6. **Bundle Analysis**: Monitor bundle size and optimize imports

Your Synapse app should now be fully deployed and ready for production use!
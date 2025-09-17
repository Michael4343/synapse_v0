/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking and linting during development
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  
  // Experimental features
  experimental: {
    // Only use package imports optimization (compatible with Turbopack)
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr', 'posthog-js'],
  },

  // Turbopack-specific optimizations with WSL improvements (stable features only)
  turbopack: {
    // Faster module resolution for WSL
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Development-specific optimizations for WSL
  ...(process.env.NODE_ENV === 'development' && {
    // Faster webpack configuration for WSL
    webpack: (config, { dev }) => {
      if (dev) {
        // WSL-specific file watching optimizations
        config.watchOptions = {
          poll: 1000, // Enable polling for WSL
          aggregateTimeout: 300,
          ignored: ['**/node_modules', '**/.git', '**/.next'],
        };
        
        // Reduce memory usage
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
        
        // Faster module resolution
        config.resolve.symlinks = false;
        config.resolve.cacheWithContext = false;
      }
      return config;
    },
    
    // Disable image optimization for faster builds
    images: {
      unoptimized: true,
    },
  }),
  
  // Production-only settings
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),

  // Set environment variables for build process
  env: {
    // Provide placeholder values during build if not set
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    // PostHog environment variables for client-side access
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    // NEXT_PUBLIC_SITE_URL will be dynamically determined from request headers
  },
}

module.exports = nextConfig
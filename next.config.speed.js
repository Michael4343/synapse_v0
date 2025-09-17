/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ultra-minimal configuration for maximum speed

  // Disable all checks and optimizations
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Minimal experimental features
  experimental: {
    // Only essential optimizations
    optimizePackageImports: ['@supabase/supabase-js'],
  },

  // Disable image optimization
  images: {
    unoptimized: true,
  },

  // WSL2-optimized webpack configuration (not Turbopack)
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable all optimizations for speed
      config.optimization.minimize = false
      config.optimization.splitChunks = false
      config.optimization.removeAvailableModules = false
      config.optimization.removeEmptyChunks = false

      // Fast file watching for WSL2
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 200,
        ignored: ['**/node_modules', '**/.next', '**/.git'],
      }

      // Minimal module resolution
      config.resolve.symlinks = false
      config.resolve.cacheWithContext = false

      // Skip source maps for speed
      config.devtool = false
    }
    return config
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  },
}

module.exports = nextConfig
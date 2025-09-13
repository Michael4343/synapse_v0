/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ultra-lightweight development configuration
  
  // Disable all optimizations for fastest compilation
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Minimal experimental features
  experimental: {
    // Only essential features
  },
  
  // Webpack optimizations for development speed
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable all optimizations
      config.optimization.minimize = false
      config.optimization.splitChunks = false
      config.optimization.removeAvailableModules = false
      config.optimization.removeEmptyChunks = false
      config.optimization.sideEffects = false
      
      // Fast refresh only for changed files
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 500,
        ignored: ['**/node_modules', '**/.next'],
      }
      
      // Reduce module resolution overhead
      config.resolve.symlinks = false
      config.resolve.cacheWithContext = false
    }
    return config
  },
  
  // Development-only settings
  ...(process.env.NODE_ENV === 'development' && {
    // Disable image optimization for faster builds
    images: {
      unoptimized: true,
    },
  }),
}

module.exports = nextConfig
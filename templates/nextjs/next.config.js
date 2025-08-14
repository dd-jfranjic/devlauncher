/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    // Add experimental features here
  },
  
  // Configure image domains if using next/image
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'host.docker.internal'
    ],
  },

  // API configuration
  async rewrites() {
    return [
      // Add API rewrites if needed
    ];
  },

  // Environment variables
  env: {
    // Add custom environment variables here
  },

  // Output configuration for different deployment targets
  output: 'standalone',

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack config
    return config;
  },
};

module.exports = nextConfig;
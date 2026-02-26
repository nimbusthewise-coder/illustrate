import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Transpile packages from the monorepo
  transpilePackages: ['@illustrate.md/core'],
  
  // Configure webpack to handle Node.js modules
  webpack: (config, { isServer }) => {
    // Externalize Node.js-only modules for client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        readline: false,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;

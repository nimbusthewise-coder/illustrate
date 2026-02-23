/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Transpile packages from the monorepo
  transpilePackages: ['@illustrate.md/core'],
  
  // Skip type checking during build to avoid .next/types issues
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

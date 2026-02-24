import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Transpile packages from the monorepo
  transpilePackages: [],
};

export default nextConfig;

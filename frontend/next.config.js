/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kitvas/shared'],
  // Next.js 16 uses Turbopack by default for faster builds
  // Turbopack provides 2-5x faster production builds and up to 10x faster Fast Refresh
}

module.exports = nextConfig

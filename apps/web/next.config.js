/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@physiolens/shared-types'],
  output: 'standalone',
};

module.exports = nextConfig;

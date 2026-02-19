/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@rom/shared-types'],
    output: 'standalone',
};

module.exports = nextConfig;

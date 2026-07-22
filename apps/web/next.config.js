/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@oprepo/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;

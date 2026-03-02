/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  async rewrites() {
    return [
      {
        source: '/:path*.php',
        destination: '/render/:path*'
      }
    ];
  },
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;

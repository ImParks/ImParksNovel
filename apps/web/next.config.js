/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
    ],
  },
};

module.exports = nextConfig;

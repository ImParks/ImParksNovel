/** @type {import('next').NextConfig} */

/**
 * Sentry 에러 트래킹 설정 (선택사항)
 *
 * 설치 필요:
 * npm install @sentry/nextjs
 *
 * 활성화 방법:
 * 1. withSentryConfig 임포트
 *    const { withSentryConfig } = require('@sentry/nextjs');
 *
 * 2. nextConfig를 withSentryConfig로 래핑
 *    module.exports = withSentryConfig(nextConfig, {
 *      org: 'your-sentry-org',
 *      project: 'your-sentry-project',
 *      authToken: process.env.SENTRY_AUTH_TOKEN,
 *    });
 *
 * 3. .env 파일에 NEXT_PUBLIC_SENTRY_DSN 설정
 */

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

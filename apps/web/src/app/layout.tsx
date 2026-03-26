import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers';

export const metadata: Metadata = {
  title: '바이브코딩 - 소설 연재 플랫폼',
  description: '당신의 이야기를 연재하세요. 바이브코딩은 작가와 독자를 잇는 소설 연재 플랫폼입니다.',
  keywords: ['소설', '연재', '웹소설', '플랫폼', '바이브코딩'],
  authors: [{ name: '바이브코딩' }],
  openGraph: {
    title: '바이브코딩 - 소설 연재 플랫폼',
    description: '당신의 이야기를 연재하세요.',
    type: 'website',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '인증 - 바이브코딩',
  description: '바이브코딩 로그인 및 회원가입',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

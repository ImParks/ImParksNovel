'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useAuthStore } from '@/stores/auth.store';
import { gql } from '@/lib/graphql-client';
import { SIGN_IN_MUTATION } from '@/lib/graphql-queries';

interface SignInResponse {
  signIn: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      nickname: string;
      role: 'READER' | 'AUTHOR' | 'ADMIN';
    };
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await gql<SignInResponse>(SIGN_IN_MUTATION, {
        input: { email, password },
      });

      if (response.signIn) {
        login(response.signIn.user, response.signIn.accessToken);
        router.push('/');
      }
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-block font-bold text-2xl text-primary-500">
          바이브코딩
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">로그인</h1>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Input
          label="이메일"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />

        <Input
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />

        <div className="text-right">
          <Link
            href="#"
            className="text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">
            또는
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full"
          disabled={isLoading}
        >
          Google로 계속하기
        </Button>
        <Button
          type="button"
          style={{ backgroundColor: '#FEE500' }}
          className="w-full text-gray-900 hover:opacity-90"
          size="md"
          disabled={isLoading}
        >
          Kakao로 계속하기
        </Button>
        <Button
          type="button"
          style={{ backgroundColor: '#00C73C' }}
          className="w-full text-white hover:opacity-90"
          size="md"
          disabled={isLoading}
        >
          Naver로 계속하기
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-primary-500 hover:text-primary-600">
          회원가입
        </Link>
      </div>
    </div>
  );
}

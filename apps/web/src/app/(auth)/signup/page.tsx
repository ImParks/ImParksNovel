'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useAuthStore } from '@/stores/auth.store';
import { gql } from '@/lib/graphql-client';
import { SIGN_UP_MUTATION } from '@/lib/graphql-queries';

interface SignUpResponse {
  signUp: {
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

interface FormErrors {
  email?: string;
  nickname?: string;
  password?: string;
  passwordConfirm?: string;
  terms?: string;
  privacy?: string;
}

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '유효한 이메일을 입력해주세요';
    }

    if (!nickname) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (nickname.length < 2 || nickname.length > 20) {
      newErrors.nickname = '닉네임은 2자 이상 20자 이하여야 합니다';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (!agreeTerms) {
      newErrors.terms = '이용약관에 동의해주세요';
    }

    if (!agreePrivacy) {
      newErrors.privacy = '개인정보처리방침에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await gql<SignUpResponse>(SIGN_UP_MUTATION, {
        input: {
          email,
          nickname,
          password,
        },
      });

      if (response.signUp) {
        login(response.signUp.user, response.signUp.accessToken);
        router.push('/');
      }
    } catch (err) {
      setServerError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Signup error:', err);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">회원가입</h1>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-700 dark:text-red-300">{serverError}</p>
          </div>
        )}

        <Input
          label="이메일"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isLoading}
          required
        />

        <Input
          label="닉네임"
          type="text"
          placeholder="2~20자 사이로 입력해주세요"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          error={errors.nickname}
          hint="2~20자 사이로 설정 가능합니다"
          disabled={isLoading}
          required
        />

        <Input
          label="비밀번호"
          type="password"
          placeholder="8자 이상의 비밀번호를 입력해주세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="8자 이상의 문자, 숫자, 특수문자를 포함해주세요"
          disabled={isLoading}
          required
        />

        <Input
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={errors.passwordConfirm}
          disabled={isLoading}
          required
        />

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <Link href="#" className="underline hover:no-underline">
                이용약관
              </Link>
              에 동의합니다 (필수)
            </span>
          </label>

          {errors.terms && (
            <p role="alert" className="text-xs text-red-500 dark:text-red-400">
              {errors.terms}
            </p>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <Link href="#" className="underline hover:no-underline">
                개인정보처리방침
              </Link>
              에 동의합니다 (필수)
            </span>
          </label>

          {errors.privacy && (
            <p role="alert" className="text-xs text-red-500 dark:text-red-400">
              {errors.privacy}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? '회원가입 중...' : '회원가입'}
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

      {/* Social Signup */}
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
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-primary-500 hover:text-primary-600">
          로그인
        </Link>
      </div>
    </div>
  );
}

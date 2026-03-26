'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { gql } from '@/lib/graphql-client';
import { SIGN_IN_MUTATION, SIGN_UP_MUTATION } from '@/lib/graphql-queries';

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

/**
 * 로그인 폼 상태 및 제출 로직
 */
export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  async function handleSubmit() {
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

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading,
    handleSubmit,
  };
}

/**
 * 회원가입 폼 상태 및 제출 로직
 */
export function useSignUpForm() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

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

  async function handleSubmit() {
    setServerError('');

    if (!validate()) {
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

  return {
    email,
    setEmail,
    nickname,
    setNickname,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    agreeTerms,
    setAgreeTerms,
    agreePrivacy,
    setAgreePrivacy,
    errors,
    serverError,
    isLoading,
    handleSubmit,
  };
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 닉네임 검증 (2~20자)
 */
export function validateNickname(nickname: string): boolean {
  return nickname.length >= 2 && nickname.length <= 20;
}

/**
 * 비밀번호 검증 (8자 이상)
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * 비밀번호 일치 검증
 */
export function validatePasswordMatch(password: string, passwordConfirm: string): boolean {
  return password === passwordConfirm;
}

/**
 * 전체 회원가입 폼 검증
 */
export function validateSignUpForm(data: {
  email: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = '이메일을 입력해주세요';
  } else if (!validateEmail(data.email)) {
    errors.email = '유효한 이메일을 입력해주세요';
  }

  if (!data.nickname) {
    errors.nickname = '닉네임을 입력해주세요';
  } else if (!validateNickname(data.nickname)) {
    errors.nickname = '닉네임은 2자 이상 20자 이하여야 합니다';
  }

  if (!data.password) {
    errors.password = '비밀번호를 입력해주세요';
  } else if (!validatePassword(data.password)) {
    errors.password = '비밀번호는 8자 이상이어야 합니다';
  }

  if (!data.passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인을 입력해주세요';
  } else if (!validatePasswordMatch(data.password, data.passwordConfirm)) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다';
  }

  if (!data.agreeTerms) {
    errors.terms = '이용약관에 동의해주세요';
  }

  if (!data.agreePrivacy) {
    errors.privacy = '개인정보처리방침에 동의해주세요';
  }

  return errors;
}

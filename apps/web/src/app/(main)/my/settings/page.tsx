'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Input, Textarea, Toggle, Avatar } from '@/components/atoms';
import Link from 'next/link';
import { gql } from '@/lib/graphql-client';
import { getCurrentUserProfile, getNotificationSettings } from '@/lib/mock/my-page-data';

interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  role: string;
  status: string;
  isAdultVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [profile, setProfile] = useState(() => getCurrentUserProfile());
  const [notificationSettings, setNotificationSettings] = useState(() =>
    getNotificationSettings()
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 프로필 조회
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await gql<{ me: UserProfile }>(
          `query Me {
            me {
              id
              email
              nickname
              profileImageUrl
              bio
              role
              status
              isAdultVerified
              lastLoginAt
              createdAt
            }
          }`
        );

        setProfile({
          id: data.me.id,
          email: data.me.email,
          nickname: data.me.nickname,
          avatarUrl: data.me.profileImageUrl || undefined,
          bio: data.me.bio || undefined,
          isAuthor: data.me.role === 'AUTHOR',
          authorName: undefined,
          authorBio: undefined,
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('프로필을 불러오는데 실패했습니다.');
        // Fallback to mock data
        setProfile(getCurrentUserProfile());
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated]);

  // 로그인 필수
  if (!isAuthenticated || !user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            설정 페이지에 접근하려면 로그인해주세요.
          </p>
          <Button asChild variant="primary">
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </main>
    );
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await gql<{ updateProfile: UserProfile }>(
        `mutation UpdateProfile($input: UpdateProfileInput!) {
          updateProfile(input: $input) {
            id
            nickname
            profileImageUrl
            bio
          }
        }`,
        {
          input: {
            nickname: profile.nickname,
            profileImageUrl: profile.avatarUrl,
            bio: profile.bio,
          },
        }
      );

      // Zustand store 업데이트
      updateUser({
        nickname: data.updateProfile.nickname,
        avatarUrl: data.updateProfile.profileImageUrl || undefined,
      });

      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('프로필 업데이트에 실패했습니다.');
      alert('프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다');
      return;
    }

    if (newPassword.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 백엔드에서 비밀번호 변경은 토큰 기반 재설정만 제공하므로,
      // 프론트엔드에서 현재 비밀번호 확인 후 재설정 요청을 해야 함
      // 여기서는 간단히 requestPasswordReset + resetPassword 플로우를 사용

      // Step 1: 이메일로 비밀번호 재설정 요청
      await gql<{ requestPasswordReset: boolean }>(
        `mutation RequestPasswordReset($email: String!) {
          requestPasswordReset(email: $email)
        }`,
        { email: user?.email }
      );

      alert('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to change password:', err);
      setError('비밀번호 변경에 실패했습니다.');
      alert('비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    console.log('이메일 변경:', newEmail);
    setShowEmailForm(false);
  };

  const handleWithdraw = () => {
    console.log('계정 탈퇴');
    setShowDeleteConfirm(false);
  };

  return (
    <main className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          계정 설정
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          프로필, 보안, 알림 설정을 관리할 수 있습니다.
        </p>
      </div>

      {/* 좌측 메뉴 + 우측 콘텐츠 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 좌측 메뉴 */}
        <div className="md:col-span-1">
          <nav className="space-y-2 sticky top-6">
            {[
              { id: 'profile', label: '프로필 수정' },
              { id: 'password', label: '비밀번호 변경' },
              { id: 'email', label: '이메일 변경' },
              { id: 'notifications', label: '알림 설정' },
              { id: 'danger', label: '위험 영역' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={[
                  'w-full text-left px-4 py-2 rounded-lg transition-colors',
                  activeSection === section.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 우측 콘텐츠 */}
        <div className="md:col-span-3 space-y-6">
          {/* 프로필 수정 */}
          {activeSection === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                프로필 수정
              </h2>

              {loading && (
                <div className="text-center py-4">
                  <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* 프로필 이미지 */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                  프로필 이미지
                </label>
                <div className="flex items-center gap-4">
                  <Avatar
                    src={profile.avatarUrl}
                    alt={profile.nickname}
                    size="lg"
                    fallback={profile.nickname.slice(0, 2).toUpperCase()}
                  />
                  <div>
                    <Button variant="secondary" size="sm" disabled>
                      이미지 업로드
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      (S3 연동 후 사용 가능)
                    </p>
                  </div>
                </div>
              </div>

              {/* 닉네임 */}
              <Input
                label="닉네임"
                value={profile.nickname}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              />

              {/* 소개글 */}
              <Textarea
                label="소개글"
                placeholder="자신을 소개해보세요"
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />

              {/* 작가 프로필 (작가인 경우) */}
              {profile.isAuthor && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    작가 프로필
                  </h3>

                  <Input
                    label="작가명"
                    value={profile.authorName || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, authorName: e.target.value })
                    }
                  />

                  <Textarea
                    label="작가 소개"
                    placeholder="작가 소개를 작성해보세요"
                    value={profile.authorBio || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, authorBio: e.target.value })
                    }
                  />
                </div>
              )}

              {/* 저장 버튼 */}
              <div className="flex gap-2 pt-4">
                <Button variant="primary" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}

          {/* 비밀번호 변경 */}
          {activeSection === 'password' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                비밀번호 변경
              </h2>

              {!showPasswordForm ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowPasswordForm(true)}
                >
                  비밀번호 변경
                </Button>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="현재 비밀번호"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />

                  <Input
                    label="새 비밀번호"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <Input
                    label="비밀번호 확인"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button variant="primary" onClick={handleChangePassword}>
                      변경
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowPasswordForm(false)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 이메일 변경 */}
          {activeSection === 'email' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                이메일 변경
              </h2>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  현재 이메일: <strong>{user.email}</strong>
                </p>
              </div>

              {!showEmailForm ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowEmailForm(true)}
                >
                  이메일 변경
                </Button>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="새 이메일"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    변경하면 인증 메일이 발송됩니다.
                  </p>

                  <div className="flex gap-2 pt-4">
                    <Button variant="primary" onClick={handleChangeEmail}>
                      변경
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowEmailForm(false)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 알림 설정 */}
          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                알림 설정
              </h2>

              <div className="space-y-4">
                <Toggle
                  label="새 회차 알림"
                  checked={notificationSettings.newEpisodeNotification}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      newEpisodeNotification: e.target.checked,
                    })
                  }
                />

                <Toggle
                  label="댓글 알림"
                  checked={notificationSettings.commentNotification}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      commentNotification: e.target.checked,
                    })
                  }
                />

                <Toggle
                  label="후원 알림"
                  checked={notificationSettings.supportNotification}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      supportNotification: e.target.checked,
                    })
                  }
                />

                <Toggle
                  label="프로모션 및 이벤트 알림"
                  checked={notificationSettings.promotionNotification}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      promotionNotification: e.target.checked,
                    })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="primary"
                  onClick={() => console.log('알림 설정 저장:', notificationSettings)}
                >
                  저장
                </Button>
              </div>
            </div>
          )}

          {/* 위험 영역 */}
          {activeSection === 'danger' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-200 dark:border-red-800 space-y-6">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                위험 영역
              </h2>

              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  이 섹션의 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
                </p>
              </div>

              {/* 계정 탈퇴 */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  계정 탈퇴
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  계정을 탈퇴하면 모든 데이터가 삭제됩니다.
                </p>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  계정 탈퇴
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 계정 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
                계정 탈퇴
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>

              <div className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>모든 개인정보가 삭제됩니다</li>
                  <li>작가의 경우 소설이 공개되지 않습니다</li>
                  <li>보유한 코인이 환불되지 않습니다</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleWithdraw}
                >
                  탈퇴하기
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="ml-auto"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

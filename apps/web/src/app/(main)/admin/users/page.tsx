'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Badge, Input, Select, Spinner } from '@/components/atoms';
import Link from 'next/link';
import { getUsers, User } from '@/lib/mock/admin-data';
// API 호출 구조 준비 (향후 API 지원 시)
// import { gql } from '@/lib/graphql-client';
// import { USERS_QUERY } from '@/lib/graphql-queries';

export default function UsersPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sanctionDropdown, setSanctionDropdown] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 사용자 데이터 조회 (향후 API 연동 예정)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // TODO: API 가능해지면 주석 제거
        // const result = await gql<{
        //   users: {
        //     edges: Array<{ node: User }>;
        //     totalCount: number;
        //   };
        // }>(USERS_QUERY, { first: 100 });
        // 현재는 mock 데이터 사용
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Admin 권한 체크
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          권한이 없습니다
        </h1>
        <Button asChild variant="primary" className="mt-4">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  let users = getUsers();

  // 검색
  if (searchQuery) {
    users = users.filter(
      (u) =>
        u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // 필터링
  if (roleFilter) {
    users = users.filter((u) => u.role === roleFilter);
  }
  if (statusFilter) {
    users = users.filter((u) => u.status === statusFilter);
  }

  const handleSanction = (type: string) => {
    if (selectedUser) {
      console.log(`User ${selectedUser.id} sanctioned with: ${type}`);
      setSelectedUser(null);
      setSanctionDropdown('');
    }
  };

  const getRoleBadgeVariant = (role: string): 'info' | 'success' | 'warning' | 'default' => {
    if (role === 'ADMIN') return 'warning';
    if (role === 'AUTHOR') return 'success';
    return 'default';
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'active') return 'success';
    if (status === 'suspended') return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          사용자 관리
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          플랫폼의 사용자를 관리하고 제재할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <Input
          label="검색"
          placeholder="닉네임 또는 이메일로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="역할"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="READER">Reader</option>
            <option value="AUTHOR">Author</option>
            <option value="ADMIN">Admin</option>
          </Select>

          <Select
            label="상태"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="active">활성</option>
            <option value="suspended">정지</option>
            <option value="withdrawn">탈퇴</option>
          </Select>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  닉네임
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  이메일
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  역할
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  상태
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  가입일
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  소설 수
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {u.nickname}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusBadgeVariant(u.status)} size="sm">
                      {u.status === 'active'
                        ? '활성'
                        : u.status === 'suspended'
                        ? '정지'
                        : '탈퇴'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {u.joinedAt}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {u.novelCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(u)}
                      >
                        상세보기
                      </Button>
                      {u.status === 'active' && (
                        <select
                          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value=""
                          onChange={(e) => {
                            setSanctionDropdown(e.target.value);
                            setSelectedUser(u);
                          }}
                        >
                          <option value="">제재...</option>
                          <option value="warning">경고</option>
                          <option value="1day">정지 1일</option>
                          <option value="7day">정지 7일</option>
                          <option value="30day">정지 30일</option>
                          <option value="permanent">영구정지</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedUser && !sanctionDropdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                사용자 상세 정보
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    닉네임
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedUser.nickname}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    이메일
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    역할
                  </label>
                  <div className="mt-1">
                    <Badge variant={getRoleBadgeVariant(selectedUser.role)} size="sm">
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    상태
                  </label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedUser.status)} size="sm">
                      {selectedUser.status === 'active'
                        ? '활성'
                        : selectedUser.status === 'suspended'
                        ? '정지'
                        : '탈퇴'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    가입일
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedUser.joinedAt}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    소설 수
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedUser.novelCount}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedUser(null)}
                  className="ml-auto"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 제재 확인 모달 */}
      {selectedUser && sanctionDropdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                제재 확인
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                사용자 <strong>{selectedUser.nickname}</strong>를 제재하시겠습니까?
              </p>

              <p className="text-sm bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 p-3 rounded">
                제재 유형:
                {sanctionDropdown === 'warning' && ' 경고'}
                {sanctionDropdown === '1day' && ' 1일 정지'}
                {sanctionDropdown === '7day' && ' 7일 정지'}
                {sanctionDropdown === '30day' && ' 30일 정지'}
                {sanctionDropdown === 'permanent' && ' 영구 정지'}
              </p>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleSanction(sanctionDropdown)}
                >
                  확인
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setSelectedUser(null);
                    setSanctionDropdown('');
                  }}
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

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Badge, Input, Select, Textarea, Toggle, Spinner } from '@/components/atoms';
import Link from 'next/link';
import { getNotices, type Notice } from '@/lib/mock/admin-data';
import { gql } from '@/lib/graphql-client';
import { PUBLISHED_NOTICES_QUERY } from '@/lib/graphql-queries';

// Notice 타입은 @/lib/mock/admin-data에서 import

export default function NoticesPage() {
  const { user } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isPinned, setIsPinned] = useState(false);
  const [notices, setNotices] = useState(getNotices());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 발행된 공지사항 조회
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        interface ApiNotice {
          id: string; title: string; content: string; category: string;
          isPinned: boolean; publishedAt?: string; createdAt: string;
        }
        const result = await gql<{
          publishedNotices: {
            edges: Array<{ node: ApiNotice }>;
            totalCount: number;
          };
        }>(PUBLISHED_NOTICES_QUERY, { first: 50 });

        if (result.publishedNotices?.edges) {
          const formattedNotices: Notice[] = result.publishedNotices.edges.map((e) => ({
            id: e.node.id,
            title: e.node.title,
            content: e.node.content,
            category: e.node.category as Notice['category'],
            isPinned: e.node.isPinned,
            status: 'published' as const,
            createdAt: new Date(e.node.publishedAt || e.node.createdAt).toLocaleDateString(
              'ko-KR'
            ),
          }));
          setNotices(formattedNotices);
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error);
        // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
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

  const handleCreateNotice = async (action: 'draft' | 'publish') => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: API 연동 시 CREATE_NOTICE_MUTATION 사용
      // const result = await gql(CREATE_NOTICE_MUTATION, { ... });
      console.log('공지사항 생성:', {
        title,
        content,
        category,
        isPinned,
        action,
      });
      alert(`공지사항이 ${action === 'publish' ? '발행' : '저장'}되었습니다.`);
      // 폼 초기화
      setTitle('');
      setContent('');
      setCategory('general');
      setIsPinned(false);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create notice:', error);
      alert('공지사항 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadgeVariant = (cat: string): 'default' | 'info' | 'success' | 'warning' | 'error' => {
    if (cat === 'maintenance') return 'warning';
    if (cat === 'update') return 'info';
    if (cat === 'service') return 'success';
    return 'default';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            공지사항 관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            플랫폼 공지사항을 작성하고 관리할 수 있습니다.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? '취소' : '새 공지 작성'}
        </Button>
      </div>

      {/* 작성 폼 */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            새로운 공지사항
          </h2>

          <Input
            label="제목"
            placeholder="공지사항 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="내용"
            placeholder="공지사항 내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="카테고리"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">일반</option>
              <option value="service">서비스</option>
              <option value="maintenance">점검</option>
              <option value="update">업데이트</option>
            </Select>

            <div className="flex items-end">
              <Toggle
                label="고정 여부"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => handleCreateNotice('draft')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" /> 저장 중...
                </>
              ) : (
                '저장 (미발행)'
              )}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleCreateNotice('publish')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" /> 발행 중...
                </>
              ) : (
                '발행'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsCreating(false)}
              className="ml-auto"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 공지사항 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  제목
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  상태
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  고정
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  작성일
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {notice.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {notice.content}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getCategoryBadgeVariant(notice.category)} size="sm">
                      {notice.category === 'general'
                        ? '일반'
                        : notice.category === 'service'
                        ? '서비스'
                        : notice.category === 'maintenance'
                        ? '점검'
                        : '업데이트'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={notice.status === 'published' ? 'success' : 'default'}
                      size="sm"
                    >
                      {notice.status === 'published' ? '발행' : '미발행'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {notice.isPinned ? '고정' : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {notice.createdAt}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        수정
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

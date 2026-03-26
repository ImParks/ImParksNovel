'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Badge, Spinner } from '@/components/atoms';
import { MOCK_NOVELS } from '@/lib/mock-data';
import { gql } from '@/lib/graphql-client';
import { MY_NOVELS_QUERY } from '@/lib/graphql-queries';
import { useAuthStore } from '@/stores/auth.store';

type StatusFilter = 'ALL' | 'ONGOING' | 'COMPLETED';

const MY_NOVELS_MOCK = MOCK_NOVELS.slice(0, 8);

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default function AuthorNovelsPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [novels, setNovels] = useState(MY_NOVELS_MOCK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 상태별 소설 조회
        const status =
          statusFilter === 'ALL' ? undefined : (statusFilter as 'ONGOING' | 'COMPLETED');
        const result = await gql<{
          myNovels: {
            edges: Array<{ node: (typeof MY_NOVELS_MOCK)[0] }>;
            totalCount: number;
          };
        }>(MY_NOVELS_QUERY, { status, first: 20 });

        if (result.myNovels?.edges) {
          setNovels(result.myNovels.edges.map((e) => e.node));
        }
      } catch (error) {
        console.error('Failed to fetch novels:', error);
        // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchNovels();
  }, [user, statusFilter]);

  const filteredNovels =
    statusFilter === 'ALL'
      ? novels
      : novels.filter((n) => n.status === statusFilter);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: '전체' },
    { value: 'ONGOING', label: '연재중' },
    { value: 'COMPLETED', label: '완결' },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          내 소설 목록
        </h1>
        <Link href="/author/novels/new">
          <Button variant="primary" size="md">
            + 새 소설 시작
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              statusFilter === opt.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Novel Cards */}
      {filteredNovels.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">작품이 없습니다</p>
          <p className="text-sm">새 소설을 시작해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNovels.map((novel) => (
            <div
              key={novel.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* Cover */}
                <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                  표지
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {novel.title}
                    </h3>
                    <Badge
                      variant={novel.status === 'ONGOING' ? 'success' : 'default'}
                      size="sm"
                    >
                      {novel.status === 'ONGOING' ? '연재중' : '완결'}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {novel.genreName}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>{novel.totalEpisodes}화</span>
                    <span>조회 {formatNumber(novel.totalViews)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Link href={`/author/novels/${novel.id}/episodes/new`}>
                      <Button variant="primary" size="sm">
                        새 회차 작성
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      관리
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Badge, Spinner } from '@/components/atoms';
import { MOCK_NOVELS } from '@/lib/mock-data';
import { gql } from '@/lib/graphql-client';
import { AUTHOR_DASHBOARD_QUERY, MY_NOVELS_QUERY } from '@/lib/graphql-queries';
import { useAuthStore } from '@/stores/auth.store';

// Mock author stats (fallback)
const MOCK_STATS = {
  totalRevenue: 12450000,
  monthlyRevenue: 1850000,
  totalViews: 4820000,
  monthlyViews: 520000,
  totalSupportAmount: 3200000,
  subscriberCount: 15200,
};

// Author's novels (first 5 as mock)
const MY_NOVELS_MOCK = MOCK_NOVELS.slice(0, 5);

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(num: number): string {
  return num.toLocaleString('ko-KR') + '원';
}

export default function AuthorDashboardPage() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<typeof MOCK_STATS>(MOCK_STATS);
  const [novels, setNovels] = useState(MY_NOVELS_MOCK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 인증 확인
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 대시보드 데이터 조회
        const dashboardResult = await gql<{ authorDashboard: typeof MOCK_STATS }>(
          AUTHOR_DASHBOARD_QUERY
        );
        setDashboardData(dashboardResult.authorDashboard);

        // 내 소설 조회 (최대 5개)
        const novelsResult = await gql<{
          myNovels: {
            edges: Array<{ node: (typeof MY_NOVELS_MOCK)[0] }>;
            totalCount: number;
          };
        }>(MY_NOVELS_QUERY, { first: 5 });

        if (novelsResult.myNovels?.edges) {
          setNovels(novelsResult.myNovels.edges.map((e) => e.node));
        }
      } catch (error) {
        console.error('Failed to fetch author dashboard:', error);
        // Fallback to mock data is already set
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const stats = [
    {
      label: '총 수익',
      value: formatCurrency(dashboardData.totalRevenue),
      icon: '💰',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: '이번달 수익',
      value: formatCurrency(dashboardData.monthlyRevenue),
      icon: '📈',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: '총 조회수',
      value: formatNumber(dashboardData.totalViews),
      icon: '👁',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: '구독자',
      value: formatNumber(dashboardData.subscriberCount),
      icon: '👥',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950',
    },
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            작가 대시보드
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            창작 활동을 한눈에 확인하세요
          </p>
        </div>
        <Link href="/author/novels/new">
          <Button variant="primary" size="md">
            + 새 소설 시작
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-xl p-5 border border-gray-100 dark:border-gray-800`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </span>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* My Novels */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            내 소설
          </h2>
          <Link
            href="/author/novels"
            className="text-sm text-primary-500 hover:text-primary-600"
          >
            전체보기 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map((novel) => (
            <div
              key={novel.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                {/* Cover placeholder */}
                <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                  표지
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {novel.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={novel.status === 'ONGOING' ? 'success' : 'default'}
                      size="sm"
                    >
                      {novel.status === 'ONGOING' ? '연재중' : '완결'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {novel.totalEpisodes}화
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    조회수 {formatNumber(novel.totalViews)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

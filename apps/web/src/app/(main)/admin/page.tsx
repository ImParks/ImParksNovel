'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Badge, Spinner } from '@/components/atoms';
import Link from 'next/link';
import { getReports, type Report } from '@/lib/mock/admin-data';
import { gql } from '@/lib/graphql-client';
import { ADMIN_DASHBOARD_QUERY, REPORTS_QUERY } from '@/lib/graphql-queries';

interface AdminDashboardData {
  pendingReports: number;
  todayNewUsers: number;
  todayNewNovels: number;
  todayRevenue: number;
  activeUsers: number;
}

// Report 타입은 @/lib/mock/admin-data에서 import

const MOCK_ADMIN_STATS: AdminDashboardData = {
  pendingReports: 12,
  todayNewUsers: 45,
  todayNewNovels: 8,
  todayRevenue: 3500000,
  activeUsers: 2340,
};

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminDashboardData>(MOCK_ADMIN_STATS);
  const [recentReports, setRecentReports] = useState(getReports(5));
  const [loading, setLoading] = useState(true);

  // Admin 권한 체크
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            권한이 없습니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
          <Button asChild variant="primary">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 관리자 대시보드 데이터 조회
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // 대시보드 통계 조회
        const dashboardResult = await gql<{ adminDashboard: AdminDashboardData }>(
          ADMIN_DASHBOARD_QUERY
        );
        if (dashboardResult.adminDashboard) {
          setStats(dashboardResult.adminDashboard);
        }

        // 신고 데이터 조회
        interface ApiReport {
          id: string; reporterId: string; targetType: string; targetId: string;
          reason: string; status: string; createdAt: string;
        }
        const reportsResult = await gql<{
          reports: {
            edges: Array<{ node: ApiReport }>;
            totalCount: number;
          };
        }>(REPORTS_QUERY, { first: 5 });

        if (reportsResult.reports?.edges) {
          const formattedReports = reportsResult.reports.edges.map((e) => {
            const report = e.node;
            return {
              id: report.id,
              targetTitle: `${report.targetType} #${report.targetId}`,
              targetType: report.targetType as Report['targetType'],
              targetContent: '',
              reason: report.reason,
              reportedBy: report.reporterId || 'unknown',
              status: report.status.toLowerCase() as Report['status'],
              createdAt: report.createdAt,
            } satisfies Report;
          });
          setRecentReports(formattedReports);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          관리자 대시보드
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          플랫폼 주요 지표를 한눈에 확인할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 대기 신고 수 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            대기 신고 수
          </div>
          <div className="text-3xl font-bold text-red-500">{stats.pendingReports}</div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            처리 필요
          </p>
        </div>

        {/* 오늘 신규 가입 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            오늘 신규 가입
          </div>
          <div className="text-3xl font-bold text-green-500">{stats.todayNewUsers}</div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            사람
          </p>
        </div>

        {/* 오늘 신규 소설 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            오늘 신규 소설
          </div>
          <div className="text-3xl font-bold text-blue-500">{stats.todayNewNovels}</div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            편
          </p>
        </div>

        {/* 오늘 매출 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            오늘 매출
          </div>
          <div className="text-3xl font-bold text-purple-500">
            {(stats.todayRevenue / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            원
          </p>
        </div>

        {/* 활성 사용자 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            활성 사용자
          </div>
          <div className="text-3xl font-bold text-orange-500">{stats.activeUsers}</div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            명
          </p>
        </div>
      </div>

      {/* 최근 신고 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            최근 신고
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/reports">전체보기</Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  대상
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  사유
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  상태
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  날짜
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {report.targetTitle}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {report.targetType}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        report.status === 'pending'
                          ? 'warning'
                          : report.status === 'resolved'
                          ? 'success'
                          : 'error'
                      }
                      size="sm"
                    >
                      {report.status === 'pending'
                        ? '대기'
                        : report.status === 'resolved'
                        ? '처리완료'
                        : '기각'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최근 가입 사용자 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            최근 가입 사용자
          </h2>
        </div>

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
                  가입일
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                {
                  id: 'new_user_1',
                  nickname: '새로운_사용자1',
                  email: 'newuser1@example.com',
                  joinedAt: '2026-03-22',
                },
                {
                  id: 'new_user_2',
                  nickname: '새로운_사용자2',
                  email: 'newuser2@example.com',
                  joinedAt: '2026-03-21',
                },
                {
                  id: 'new_user_3',
                  nickname: '새로운_사용자3',
                  email: 'newuser3@example.com',
                  joinedAt: '2026-03-21',
                },
                {
                  id: 'new_user_4',
                  nickname: '새로운_사용자4',
                  email: 'newuser4@example.com',
                  joinedAt: '2026-03-20',
                },
                {
                  id: 'new_user_5',
                  nickname: '새로운_사용자5',
                  email: 'newuser5@example.com',
                  joinedAt: '2026-03-20',
                },
              ].map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {user.nickname}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {user.joinedAt}
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

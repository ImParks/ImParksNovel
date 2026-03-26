'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Badge, Select, Spinner } from '@/components/atoms';
import { Textarea } from '@/components/atoms';
import Link from 'next/link';
import { getReports, Report } from '@/lib/mock/admin-data';
import { gql } from '@/lib/graphql-client';
import { REPORTS_QUERY } from '@/lib/graphql-queries';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [reports, setReports] = useState(getReports());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 신고 데이터 조회
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const result = await gql<{
          reports: {
            edges: Array<{ node: any }>;
            totalCount: number;
          };
        }>(REPORTS_QUERY, { first: 100 });

        if (result.reports?.edges) {
          const formattedReports = result.reports.edges.map((e) => {
            const report = e.node;
            return {
              id: report.id,
              targetType: report.targetType.toLowerCase(),
              targetTitle: `${report.targetType} #${report.targetId}`,
              targetContent: report.reason,
              reason: report.reason,
              reportedBy: `User #${report.reporterId}`,
              status: report.status.toLowerCase(),
              createdAt: report.createdAt,
            };
          });
          setReports(formattedReports);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
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

  let filteredReports = reports;

  // 필터링
  if (statusFilter) {
    filteredReports = filteredReports.filter((r) => r.status === statusFilter);
  }
  if (typeFilter) {
    filteredReports = filteredReports.filter((r) => r.targetType === typeFilter);
  }

  const handleResolve = async (resolution: 'hidden' | 'deleted' | 'warning') => {
    if (selectedReport) {
      setIsSubmitting(true);
      try {
        // TODO: API 연동 시 RESOLVE_REPORT_MUTATION 사용
        console.log(`Report ${selectedReport.id} resolved with: ${resolution}`, adminNotes);
        alert('신고가 처리되었습니다.');
        setSelectedReport(null);
        setAdminNotes('');
      } catch (error) {
        console.error('Failed to resolve report:', error);
        alert('신고 처리에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReject = async () => {
    if (selectedReport) {
      setIsSubmitting(true);
      try {
        // TODO: API 연동 시 REJECT_REPORT_MUTATION 사용
        console.log(`Report ${selectedReport.id} rejected`, adminNotes);
        alert('신고가 기각되었습니다.');
        setSelectedReport(null);
        setAdminNotes('');
      } catch (error) {
        console.error('Failed to reject report:', error);
        alert('신고 기각에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    }
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
          신고 관리
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          사용자 신고 내역을 확인하고 처리할 수 있습니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="상태"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="pending">대기</option>
            <option value="resolved">처리완료</option>
            <option value="rejected">기각</option>
          </Select>

          <Select
            label="대상 유형"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="novel">소설</option>
            <option value="episode">회차</option>
            <option value="comment">댓글</option>
            <option value="user">사용자</option>
          </Select>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  신고ID
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  대상 유형
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  제목/내용
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  사유
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  신고자
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
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {report.id}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info" size="sm">
                      {report.targetType === 'novel'
                        ? '소설'
                        : report.targetType === 'episode'
                        ? '회차'
                        : report.targetType === 'comment'
                        ? '댓글'
                        : '사용자'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                        {report.targetTitle}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {report.targetContent}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {report.reportedBy}
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
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            신고 내역이 없습니다.
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                신고 상세
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* 기본 정보 */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  신고ID
                </label>
                <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-400">
                  {selectedReport.id}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    대상 유형
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedReport.targetType}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    신고자
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedReport.reportedBy}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  대상 제목
                </label>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedReport.targetTitle}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  대상 내용
                </label>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  {selectedReport.targetContent}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  신고 사유
                </label>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedReport.reason}
                </p>
              </div>

              {/* 관리자 메모 */}
              <Textarea
                label="관리자 메모"
                placeholder="처리 내용이나 추가 정보를 입력하세요"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />

              {/* 처리 버튼 */}
              {selectedReport.status === 'pending' && (
                <div className="space-y-3 pt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      처리
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <select
                        data-resolution-select
                        className="flex-1 min-w-[120px] px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        defaultValue="hidden"
                      >
                        <option value="hidden">콘텐츠 숨김</option>
                        <option value="deleted">삭제</option>
                        <option value="warning">경고</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      onClick={() => {
                        const select = document.querySelector(
                          '[data-resolution-select]'
                        ) as HTMLSelectElement;
                        if (select) {
                          handleResolve(select.value as 'hidden' | 'deleted' | 'warning');
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" /> 처리 중...
                        </>
                      ) : (
                        '해결'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '기각 중...' : '기각'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setSelectedReport(null)}
                      className="ml-auto"
                      disabled={isSubmitting}
                    >
                      닫기
                    </Button>
                  </div>
                </div>
              )}

              {selectedReport.status !== 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setSelectedReport(null)}
                    className="ml-auto"
                  >
                    닫기
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/atoms';
import { NovelCard } from '@/components/molecules';
import Link from 'next/link';
import { gql } from '@/lib/graphql-client';
import {
  getRecentlyRead,
  getBookmarked,
  getFavorites,
  getPurchased,
} from '@/lib/mock/my-page-data';

type TabType = 'recent' | 'bookmarks' | 'favorites' | 'purchased';

interface RecentRead {
  id: string;
  novelId: string;
  lastEpisodeId: string;
  lastEpisodeNumber: number;
  lastReadAt: string;
}

export default function MyPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [loading, setLoading] = useState(true);
  const [, setRecentReads] = useState<RecentRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 탭별 데이터 fetch
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === 'recent') {
          const data = await gql<{ recentReads: { edges: Array<{ node: RecentRead }>, totalCount: number } }>(
            `query RecentReads($first: Int) {
              recentReads(first: $first) {
                edges {
                  node {
                    id
                    novelId
                    lastEpisodeId
                    lastEpisodeNumber
                    lastReadAt
                  }
                }
                totalCount
              }
            }`,
            { first: 20 }
          );
          setRecentReads(data.recentReads.edges.map(edge => edge.node));
        } else if (activeTab === 'bookmarks') {
          // Fetch bookmarks from API
          await gql<{ myBookmarks: { edges: Array<{ node: any }>, totalCount: number } }>(
            `query MyBookmarks($first: Int) {
              myBookmarks(first: $first) {
                edges {
                  node {
                    id
                    novelId
                    createdAt
                  }
                }
                totalCount
              }
            }`,
            { first: 20 }
          );
        } else if (activeTab === 'favorites') {
          // Fetch favorites from API
          await gql<{ myFavorites: { edges: Array<{ node: any }>, totalCount: number } }>(
            `query MyFavorites($first: Int) {
              myFavorites(first: $first) {
                edges {
                  node {
                    id
                    novelId
                    createdAt
                  }
                }
                totalCount
              }
            }`,
            { first: 20 }
          );
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('데이터를 불러오는데 실패했습니다.');
        setRecentReads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, activeTab]);

  // 로그인 필수
  if (!isAuthenticated || !user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            마이페이지에 접근하려면 로그인해주세요.
          </p>
          <Button asChild variant="primary">
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </main>
    );
  }

  // 탭별 데이터 (API 실패 시 mock 데이터 사용)
  const tabData = {
    recent: getRecentlyRead(),
    bookmarks: getBookmarked(),
    favorites: getFavorites(),
    purchased: getPurchased(),
  };

  // TODO: API 데이터를 실제 NovelCard 형식으로 매핑 필요
  const currentData = error ? tabData[activeTab] : tabData[activeTab];

  const tabLabels = {
    recent: '최근 읽은',
    bookmarks: '북마크',
    favorites: '즐겨찾기',
    purchased: '구매한 작품',
  };

  return (
    <main className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          내 서재
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          저장한 소설과 읽는 중인 작품을 확인할 수 있습니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabType)}
            className={[
              'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === key
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
          </div>
        ) : currentData.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentData.map((novel) => (
              <div key={novel.id} className="relative">
                <NovelCard
                  id={novel.id}
                  title={novel.title}
                  authorName={novel.authorName}
                  coverImageUrl={novel.coverImageUrl}
                  genreName={novel.genreName}
                  totalEpisodes={novel.totalEpisodes}
                  totalViews={0}
                  status={novel.status}
                />

                {/* 최근 읽은 - 읽은 회차 정보 및 읽기 진행률 */}
                {activeTab === 'recent' && novel.lastReadEpisode && (
                  <div className="absolute bottom-4 left-2 right-2">
                    <div className="bg-black/70 text-white text-xs rounded p-2 mb-1">
                      {novel.lastReadEpisode}화까지 읽음
                    </div>
                    {novel.totalEpisodes > 0 && (
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full"
                          style={{
                            width: `${(parseInt(String(novel.lastReadEpisode)) / novel.totalEpisodes) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 북마크 - 새 회차 알림 배지 */}
                {activeTab === 'bookmarks' && novel.newEpisodesCount && novel.newEpisodesCount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {novel.newEpisodesCount > 99 ? '99+' : novel.newEpisodesCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              아직 {tabLabels[activeTab]}한 소설이 없습니다.
            </p>
            <Button asChild variant="primary">
              <Link href="/search">소설 찾아보기</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

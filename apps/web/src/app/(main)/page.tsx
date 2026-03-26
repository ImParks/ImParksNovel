'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NovelGrid, RankingList } from '@/components/organisms';
import { Button } from '@/components/atoms';
import { MOCK_NOVELS, MOCK_TRENDING, MOCK_NEW_RELEASES, GENRES, filterByGenre } from '@/lib/mock-data';
import { gql } from '@/lib/graphql-client';
import type { NovelCardProps } from '@/components/molecules';
// RankingList entries 타입은 RankingListProps에서 추론

// GraphQL 쿼리 정의
const TRENDING_QUERY = `query TrendingNovels($limit: Int) {
  trendingNovels(limit: $limit) {
    id title synopsis coverImageUrl authorName genreName tags status totalEpisodes totalViews totalLikes
  }
}`;

const NEW_RELEASES_QUERY = `query NewReleases($limit: Int) {
  newReleases(limit: $limit) {
    id title synopsis coverImageUrl authorName genreName tags status totalEpisodes totalViews totalLikes
  }
}`;

const GENRES_QUERY = `query Genres {
  genres { id name slug description sortOrder isActive }
}`;

interface NovelSummary {
  id: string;
  title: string;
  synopsis?: string;
  coverImageUrl?: string;
  authorName: string;
  genreName: string;
  tags: string[];
  status: string;
  totalEpisodes: number;
  totalViews: number;
  totalLikes: number;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export default function HomePage() {
  const [selectedGenre, setSelectedGenre] = useState('판타지');
  const [trendingNovels, setTrendingNovels] = useState<Array<{ rank: number; rankChange?: number; novel: NovelCardProps }>>(MOCK_TRENDING.slice(0, 10));
  const [newReleases, setNewReleases] = useState<NovelCardProps[]>(MOCK_NEW_RELEASES);
  const [genres, setGenres] = useState(GENRES);
  const [isLoading, setIsLoading] = useState(true);

  // API 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // 트렌딩 소설 로드
        try {
          const trendingData = await gql<{ trendingNovels: NovelSummary[] }>(
            TRENDING_QUERY,
            { limit: 10 }
          );

          if (trendingData.trendingNovels && trendingData.trendingNovels.length > 0) {
            const mapped = trendingData.trendingNovels.map((novel, index) => ({
              rank: index + 1,
              previousRank: index + 1,
              rankChange: 0,
              novel: {
                id: novel.id,
                title: novel.title,
                authorName: novel.authorName,
                coverImageUrl: novel.coverImageUrl,
                genreName: novel.genreName,
                tags: novel.tags,
                totalEpisodes: novel.totalEpisodes,
                totalViews: novel.totalViews,
                status: novel.status,
              },
              score: novel.totalViews,
            }));
            setTrendingNovels(mapped);
          }
        } catch (error) {
          console.warn('트렌딩 데이터 로드 실패, mock 데이터 사용:', error);
        }

        // 신작 추천 로드
        try {
          const newReleasesData = await gql<{ newReleases: NovelSummary[] }>(
            NEW_RELEASES_QUERY,
            { limit: 8 }
          );

          if (newReleasesData.newReleases && newReleasesData.newReleases.length > 0) {
            setNewReleases(newReleasesData.newReleases);
          }
        } catch (error) {
          console.warn('신작 데이터 로드 실패, mock 데이터 사용:', error);
        }

        // 장르 목록 로드
        try {
          const genresData = await gql<{ genres: Genre[] }>(GENRES_QUERY);

          if (genresData.genres && genresData.genres.length > 0) {
            const activeGenres = genresData.genres
              .filter(g => g.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            setGenres(activeGenres);
          }
        } catch (error) {
          console.warn('장르 데이터 로드 실패, mock 데이터 사용:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-800 dark:via-purple-800 dark:to-pink-800">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-full">
                Beta Service
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              당신의 이야기,
              <br />
              세상과 함께 나누세요
            </h1>

            <p className="text-lg sm:text-xl text-white/90 mb-10 leading-relaxed">
              작가와 독자가 함께 만들어가는 새로운 연재 경험
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="소설 제목, 작가명으로 검색하세요"
                  className="w-full px-6 py-4 pr-32 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const query = e.currentTarget.value;
                      if (query.trim()) {
                        window.location.href = `/search?q=${encodeURIComponent(query)}`;
                      }
                    }
                  }}
                />
                <Button
                  variant="primary"
                  className="absolute right-2 top-2 rounded-full"
                  onClick={() => {
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value)}`;
                    }
                  }}
                >
                  검색
                </Button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold shadow-lg"
                asChild
              >
                <Link href="/search">작품 둘러보기</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white border-white/30 hover:bg-white/10 backdrop-blur-sm"
                asChild
              >
                <Link href="/ranking">인기 랭킹</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">
            <div className="animate-pulse">데이터 로딩 중...</div>
          </div>
        ) : (
          <>
            <RankingList
              entries={trendingNovels}
              title="🔥 실시간 인기 소설"
            />
            <div className="mt-6 text-center">
              <Button variant="ghost" asChild>
                <Link href="/ranking">전체 랭킹 보기</Link>
              </Button>
            </div>
          </>
        )}
      </section>

      {/* New Releases Section */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500">
              <div className="animate-pulse">데이터 로딩 중...</div>
            </div>
          ) : (
            <NovelGrid
              novels={newReleases}
              title="✨ 신작 추천"
              moreLink="/search"
            />
          )}
        </div>
      </section>

      {/* Genre Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📚 장르별 소설</h2>

          {/* Genre Tabs */}
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.name)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  selectedGenre === genre.name
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {genre.name}
              </button>
            ))}
          </div>

          {/* Genre Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filterByGenre(selectedGenre, MOCK_NOVELS)
              .slice(0, 10)
              .map((novel) => (
                <div key={novel.id}>
                  <Link href={`/novel/${novel.id}`}>
                    <div className="group cursor-pointer flex flex-col gap-2 h-full">
                      <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                        <div className={`aspect-[3/4] bg-gradient-to-br ${
                          selectedGenre === '판타지' ? 'from-purple-400 to-pink-400' :
                          selectedGenre === '로맨스' ? 'from-pink-300 to-red-400' :
                          selectedGenre === '무협' ? 'from-orange-400 to-yellow-400' :
                          selectedGenre === '현대' ? 'from-blue-400 to-cyan-400' :
                          selectedGenre === 'SF' ? 'from-cyan-400 to-blue-500' :
                          selectedGenre === '미스터리' ? 'from-gray-500 to-gray-700' :
                          selectedGenre === '공포' ? 'from-red-600 to-purple-700' :
                          'from-indigo-400 to-purple-400'
                        } flex items-center justify-center relative`}>
                          <div className="text-white text-center p-4">
                            <div className="text-5xl font-bold mb-2 opacity-80">
                              {novel.title.charAt(0)}
                            </div>
                            <div className="text-xs opacity-60">{novel.genreName}</div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm line-clamp-1 text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                        {novel.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{novel.authorName}</p>
                    </div>
                  </Link>
                </div>
              ))}
          </div>

          <div className="text-center">
            <Button variant="ghost" asChild>
              <Link href={`/search?genre=${selectedGenre}`}>
                {selectedGenre} 작품 더보기
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

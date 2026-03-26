'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input, Button } from '@/components/atoms';
import { NovelGrid } from '@/components/organisms';
import { MOCK_NOVELS, GENRES, searchNovels, filterByStatus, sortNovels, type SortType } from '@/lib/mock-data';
import { gql } from '@/lib/graphql-client';
import type { NovelCardProps } from '@/components/molecules';

// GraphQL 쿼리 정의
const SEARCH_NOVELS_QUERY = `query SearchNovels($query: String, $genreId: ID, $status: NovelStatus, $sortBy: NovelSortField, $sortOrder: SortOrder, $limit: Int, $offset: Int) {
  searchNovels(query: $query, genreId: $genreId, status: $status, sortBy: $sortBy, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
    id title coverImageUrl authorName genreName tags status totalEpisodes totalViews totalLikes
  }
}`;

interface NovelSummary {
  id: string;
  title: string;
  coverImageUrl?: string;
  authorName: string;
  genreName: string;
  tags: string[];
  status: string;
  totalEpisodes: number;
  totalViews: number;
  totalLikes: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [sortType, setSortType] = useState<SortType>('popular');
  const [results, setResults] = useState<NovelCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // sortType을 API 파라미터로 매핑
  const mapSortType = (sort: SortType): { sortBy: string; sortOrder: string } => {
    switch (sort) {
      case 'popular':
        return { sortBy: 'LIKES', sortOrder: 'DESC' };
      case 'views':
        return { sortBy: 'VIEWS', sortOrder: 'DESC' };
      case 'latest':
        return { sortBy: 'CREATED_AT', sortOrder: 'DESC' };
      default:
        return { sortBy: 'LIKES', sortOrder: 'DESC' };
    }
  };

  // Update results when filters change
  useEffect(() => {
    const searchAPI = async () => {
      setIsLoading(true);

      try {
        const genre = selectedGenre ? GENRES.find(g => g.name === selectedGenre) : undefined;
        const { sortBy, sortOrder } = mapSortType(sortType);

        const variables: {
          query?: string;
          genreId?: string;
          status?: string;
          sortBy: string;
          sortOrder: string;
          limit?: number;
        } = {
          sortBy,
          sortOrder,
          limit: 100,
        };

        if (searchQuery.trim()) {
          variables.query = searchQuery;
        }

        if (genre) {
          variables.genreId = genre.id;
        }

        if (selectedStatus !== 'ALL') {
          variables.status = selectedStatus;
        }

        const data = await gql<{ searchNovels: NovelSummary[] }>(
          SEARCH_NOVELS_QUERY,
          variables
        );

        if (data.searchNovels) {
          setResults(data.searchNovels);
        }
      } catch (error) {
        console.warn('검색 API 실패, mock 데이터 사용:', error);
        // API 실패 시 mock 데이터 사용
        let filtered = searchNovels(searchQuery, MOCK_NOVELS);

        if (selectedGenre) {
          filtered = filtered.filter((novel) => novel.genreName === selectedGenre);
        }

        filtered = filterByStatus(selectedStatus, filtered);
        filtered = sortNovels(filtered, sortType);

        setResults(filtered);
      } finally {
        setIsLoading(false);
      }
    };

    searchAPI();
  }, [searchQuery, selectedGenre, selectedStatus, sortType]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch((e.target as HTMLInputElement).value);
    }
  };

  const popularSearches = ['판타지', '로맨스', '무협', '현대'];

  return (
    <div className="min-h-screen">
      {/* 검색 입력 섹션 */}
      <div className="mb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">소설 검색</h1>
          <p className="text-gray-600 dark:text-gray-400">당신이 원하는 소설을 찾아보세요</p>
        </div>

        <Input
          placeholder="소설이나 작가명을 검색하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-lg h-12 px-4"
          autoFocus
        />
      </div>

      {/* 로딩 중 */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="animate-pulse text-lg">검색 중...</div>
        </div>
      ) : results.length === 0 && searchQuery ? (
        <div className="text-center py-20">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            검색 결과가 없습니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            다른 검색어로 시도해보세요
          </p>

          {/* 인기 검색어 */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              인기 검색어
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularSearches.map((term) => (
                <Button
                  key={term}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSearch(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 필터 바 */}
          <div className="mb-8 space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* 장르 필터 */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  장르
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">전체 장르</option>
                  {GENRES.map((genre) => (
                    <option key={genre.id} value={genre.name}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 상태 필터 */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  연재 상태
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | 'ONGOING' | 'COMPLETED')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="ALL">전체</option>
                  <option value="ONGOING">연재중</option>
                  <option value="COMPLETED">완결</option>
                </select>
              </div>

              {/* 정렬 */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  정렬
                </label>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="popular">인기순</option>
                  <option value="views">조회순</option>
                  <option value="latest">최신순</option>
                </select>
              </div>
            </div>
          </div>

          {/* 검색 결과 정보 */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 <strong className="text-gray-900 dark:text-white">{results.length}</strong>개의
              소설을 찾았습니다
            </p>
          </div>

          {/* 그리드 */}
          <NovelGrid novels={results} title="" />
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">검색 로딩중...</div>}>
      <SearchContent />
    </Suspense>
  );
}

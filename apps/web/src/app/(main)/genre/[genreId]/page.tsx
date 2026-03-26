'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms';
import { NovelGrid } from '@/components/organisms';
import {
  MOCK_NOVELS,
  GENRES,
  filterByGenre,
  filterByStatus,
  sortNovels,
  type SortType,
} from '@/lib/mock-data';
import { gql } from '@/lib/graphql-client';
import type { NovelCardProps } from '@/components/molecules';

// GraphQL 쿼리 정의
const NOVELS_BY_GENRE_QUERY = `query NovelsByGenre($genreId: ID!, $status: NovelStatus, $sortBy: NovelSortField, $sortOrder: SortOrder, $limit: Int, $offset: Int) {
  novelsByGenre(genreId: $genreId, status: $status, sortBy: $sortBy, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
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

interface GenrePageProps {
  params: {
    genreId: string;
  };
}

export default function GenrePage({ params }: GenrePageProps) {
  const { genreId } = params;

  const genre = GENRES.find((g) => g.id === genreId);

  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [sortType, setSortType] = useState<SortType>('latest');
  const [displayCount, setDisplayCount] = useState(12);
  const [filteredNovels, setFilteredNovels] = useState<NovelCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        return { sortBy: 'CREATED_AT', sortOrder: 'DESC' };
    }
  };

  // API로부터 장르별 소설 로드
  useEffect(() => {
    if (!genre) {
      setIsLoading(false);
      return;
    }

    const loadNovels = async () => {
      setIsLoading(true);

      try {
        const { sortBy, sortOrder } = mapSortType(sortType);

        const variables: {
          genreId: string;
          status?: string;
          sortBy: string;
          sortOrder: string;
          limit?: number;
        } = {
          genreId,
          sortBy,
          sortOrder,
          limit: 100,
        };

        if (selectedStatus !== 'ALL') {
          variables.status = selectedStatus;
        }

        const data = await gql<{ novelsByGenre: NovelSummary[] }>(
          NOVELS_BY_GENRE_QUERY,
          variables
        );

        if (data.novelsByGenre) {
          setFilteredNovels(data.novelsByGenre);
        }
      } catch (error) {
        console.warn('장르 소설 로드 실패, mock 데이터 사용:', error);
        // API 실패 시 mock 데이터 사용
        let filtered = filterByGenre(genre.name, MOCK_NOVELS);
        filtered = filterByStatus(selectedStatus, filtered);
        filtered = sortNovels(filtered, sortType);
        setFilteredNovels(filtered);
      } finally {
        setIsLoading(false);
      }
    };

    loadNovels();
  }, [genre, genreId, selectedStatus, sortType]);

  const displayedNovels = useMemo(() => {
    return filteredNovels.slice(0, displayCount);
  }, [filteredNovels, displayCount]);

  if (!genre) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          존재하지 않는 장르입니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          유효한 장르를 선택해주세요
        </p>
        <Link href="/">
          <Button variant="primary">홈으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 장르 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {genre.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          총 {filteredNovels.length}개의 소설
        </p>
      </div>

      {/* 장르 탭 네비게이션 */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-min">
          {GENRES.map((g) => (
            <Link
              key={g.id}
              href={`/genre/${g.id}`}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                g.id === genreId
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 필터 바 */}
      <div className="mb-8 space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 연재 상태 필터 */}
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
              <option value="latest">최신순</option>
              <option value="views">조회순</option>
              <option value="popular">인기순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 소설 그리드 */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="animate-pulse text-lg">소설 로딩 중...</div>
        </div>
      ) : filteredNovels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            해당하는 소설이 없습니다
          </p>
        </div>
      ) : (
        <>
          <NovelGrid novels={displayedNovels} title="" />

          {/* 더보기 버튼 */}
          {displayCount < filteredNovels.length && (
            <div className="flex justify-center mt-12">
              <Button
                variant="secondary"
                onClick={() => setDisplayCount((prev) => prev + 12)}
              >
                더보기
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

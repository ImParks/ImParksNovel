'use client';

import { useState, useEffect } from 'react';
import { RankingList } from '@/components/organisms';
import {
  GENRES,
  generateRanking,
  type RankingType,
  type RankingPeriod,
} from '@/lib/mock-data';
import { gql } from '@/lib/graphql-client';
import type { NovelCardProps } from '@/components/molecules';

// GraphQL 쿼리 정의
const RANKING_QUERY = `query Ranking($type: RankingType!, $period: RankingPeriod!, $genreId: ID, $limit: Int) {
  ranking(type: $type, period: $period, genreId: $genreId, limit: $limit) {
    type period
    entries {
      rank previousRank rankChange
      novel { id title coverImageUrl authorName genreName totalViews status }
      score
    }
  }
}`;

interface RankingAPIResponse {
  ranking: {
    type: string;
    period: string;
    entries: Array<{
      rank: number;
      previousRank: number;
      rankChange: number;
      novel: {
        id: string;
        title: string;
        coverImageUrl?: string;
        authorName: string;
        genreName: string;
        totalViews: number;
        status: string;
      };
      score: number;
    }>;
  };
}

export default function RankingPage() {
  const [rankingType, setRankingType] = useState<RankingType>('overall');
  const [period, setPeriod] = useState<RankingPeriod>('weekly');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [rankingEntries, setRankingEntries] = useState<Array<{ rank: number; rankChange?: number; novel: NovelCardProps }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // RankingType을 API RankingType으로 매핑
  const mapRankingType = (type: RankingType): string => {
    switch (type) {
      case 'overall':
        return 'GENRE'; // genreId 없이 전체
      case 'trending':
        return 'REALTIME';
      case 'new':
        return 'NEW_RELEASE';
      case 'completed':
        return 'COMPLETED';
      default:
        return 'GENRE';
    }
  };

  // API로부터 랭킹 데이터 로드
  useEffect(() => {
    const loadRanking = async () => {
      setIsLoading(true);

      try {
        const apiType = mapRankingType(rankingType);
        const variables: {
          type: string;
          period: string;
          genreId?: string;
          limit?: number;
        } = {
          type: apiType,
          period: period.toUpperCase(),
          limit: 50,
        };

        // 장르 필터가 있을 때만 genreId 추가
        if (selectedGenre && rankingType === 'overall') {
          const genre = GENRES.find(g => g.name === selectedGenre);
          if (genre) {
            variables.genreId = genre.id;
          }
        }

        const data = await gql<RankingAPIResponse>(RANKING_QUERY, variables);

        if (data.ranking && data.ranking.entries) {
          const mapped = data.ranking.entries.map((e) => ({
            rank: e.rank,
            rankChange: e.rankChange,
            novel: {
              ...e.novel,
              tags: [] as string[],
              totalEpisodes: 0,
              totalViews: e.novel.totalViews || 0,
            },
          }));
          setRankingEntries(mapped);
        }
      } catch (error) {
        console.warn('랭킹 데이터 로드 실패, mock 데이터 사용:', error);
        // API 실패 시 mock 데이터 사용
        const mockData = generateRanking(rankingType, selectedGenre || undefined);
        setRankingEntries(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    loadRanking();
  }, [rankingType, period, selectedGenre]);

  const getRankingTitle = () => {
    switch (rankingType) {
      case 'overall':
        return '전체 랭킹';
      case 'trending':
        return '실시간 인기';
      case 'new':
        return '신작';
      case 'completed':
        return '완결';
      default:
        return '랭킹';
    }
  };

  return (
    <div className="min-h-screen">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          소설 랭킹
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          인기 소설을 실시간으로 확인하세요
        </p>
      </div>

      {/* 랭킹 타입 탭 */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-min">
          {(['overall', 'trending', 'new', 'completed'] as const).map((type) => {
            const labels: Record<RankingType, string> = {
              overall: '전체',
              byGenre: '장르별',
              trending: '실시간 인기',
              new: '신작',
              completed: '완결',
            };
            return (
              <button
                key={type}
                onClick={() => {
                  setRankingType(type);
                  setSelectedGenre('');
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  rankingType === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="mb-8 space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 기간 선택 (추후 활용) */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              기간
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as RankingPeriod)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="daily">일간</option>
              <option value="weekly">주간</option>
              <option value="monthly">월간</option>
              <option value="all">전체</option>
            </select>
          </div>

          {/* 장르 필터 (completed 제외) */}
          {rankingType !== 'completed' && rankingType !== 'new' && rankingType !== 'trending' && (
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
          )}
        </div>
      </div>

      {/* 랭킹 리스트 */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="animate-pulse text-lg">랭킹 데이터 로딩 중...</div>
        </div>
      ) : (
        <RankingList entries={rankingEntries.slice(0, 50)} title={getRankingTitle()} />
      )}

      {/* 100위까지 더보기 (선택적) */}
      {rankingEntries.length > 50 && (
        <div className="flex justify-center mt-12">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            총 {rankingEntries.length}개 소설의 랭킹을 확인할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}

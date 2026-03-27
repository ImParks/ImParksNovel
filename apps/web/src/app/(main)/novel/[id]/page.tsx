'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Badge } from '@/components/atoms';
import { NovelGrid } from '@/components/organisms';
import { gql } from '@/lib/graphql-client';
import {
  MOCK_NOVEL_DETAILS,
  getRelatedNovels,
} from '@/lib/mock-data';

interface NovelPageProps {
  params: {
    id: string;
  };
}

// GraphQL Types
interface NovelDetailData {
  novelDetail: {
    novel: {
      id: string;
      authorId: string;
      title: string;
      synopsis: string;
      coverImageUrl: string;
      genreId: string;
      tags: string[];
      status: string;
      isAdultOnly: boolean;
      totalEpisodes: number;
      totalViews: number;
      totalLikes: number;
      totalBookmarks: number;
      totalFavorites: number;
      totalSupports: number;
      createdAt: string;
    };
    recentEpisodes: Array<{
      id: string;
      episodeNumber: number;
      title: string;
      isFree: boolean;
      price: number;
      viewCount: number;
      likeCount: number;
      publishedAt: string;
    }>;
    similarNovels: Array<{
      novel: {
        id: string;
        title: string;
        coverImageUrl: string;
        authorName: string;
        genreName: string;
      };
    }>;
  };
}

interface EpisodesData {
  episodes: {
    edges: Array<{
      node: {
        id: string;
        novelId: string;
        episodeNumber: number;
        title: string;
        wordCount: number;
        status: string;
        isFree: boolean;
        price: number;
        viewCount: number;
        likeCount: number;
        commentCount: number;
        publishedAt: string;
      };
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

interface AuthorProfileData {
  authorProfile: {
    id: string;
    userId: string;
    authorName: string;
    authorBio: string | null;
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${Math.floor(num / 100000) / 10}만`;
  }
  if (num >= 10000) {
    return `${Math.floor(num / 10000)}만`;
  }
  if (num >= 1000) {
    return `${Math.floor(num / 1000)}천`;
  }
  return num.toString();
}

export default function NovelDetailPage({ params }: NovelPageProps) {
  const { id } = params;
  const [expandedSynopsis, setExpandedSynopsis] = useState(false);
  const [episodeFilter, setEpisodeFilter] = useState<'all' | 'free' | 'paid'>('all');

  // API 상태 관리
  const [loading, setLoading] = useState(true);
  const [novelData, setNovelData] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [, _setAuthorProfile] = useState<any>(null);
  const [similarNovels, setSimilarNovels] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [hasMoreEpisodes, setHasMoreEpisodes] = useState(false);
  const [episodeCursor, setEpisodeCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fallback mock 데이터
  const mockNovelData = MOCK_NOVEL_DETAILS[id];
  // novelCard는 fallback에서 mockNovelData와 함께 사용

  useEffect(() => {
    async function fetchNovelData() {
      setLoading(true);
      try {
        // 1. Novel Detail 쿼리
        const novelDetailResult = await gql<NovelDetailData>(`
          query NovelDetail($id: ID!) {
            novelDetail(id: $id) {
              novel {
                id authorId title synopsis coverImageUrl genreId tags status isAdultOnly
                totalEpisodes totalViews totalLikes totalBookmarks totalFavorites totalSupports
                createdAt
              }
              recentEpisodes {
                id episodeNumber title isFree price viewCount likeCount publishedAt
              }
              similarNovels {
                novel { id title coverImageUrl authorName genreName }
              }
            }
          }
        `, { id });

        const novel = novelDetailResult.novelDetail.novel;

        // 2. Episodes 쿼리 (페이지네이션)
        const episodesResult = await gql<EpisodesData>(`
          query Episodes($novelId: ID!, $first: Int) {
            episodes(novelId: $novelId, first: $first) {
              edges {
                node {
                  id novelId episodeNumber title wordCount status isFree price
                  viewCount likeCount commentCount publishedAt
                }
              }
              pageInfo { hasNextPage endCursor }
              totalCount
            }
          }
        `, { novelId: id, first: 20 });

        // 3. Author Profile 쿼리
        const authorResult = await gql<AuthorProfileData>(`
          query AuthorProfile($userId: ID!) {
            authorProfile(userId: $userId) {
              id userId authorName authorBio
            }
          }
        `, { userId: novel.authorId });

        // 4. Check bookmark/like status (if authenticated)
        try {
          const bookmarkResult = await gql<{ isBookmarked: boolean }>(`
            query IsBookmarked($novelId: ID!) {
              isBookmarked(novelId: $novelId)
            }
          `, { novelId: id });
          setIsBookmarked(bookmarkResult.isBookmarked);

          const likeResult = await gql<{ isLiked: boolean }>(`
            query IsLiked($targetType: LikeTargetType!, $targetId: ID!) {
              isLiked(targetType: $targetType, targetId: $targetId)
            }
          `, { targetType: 'NOVEL', targetId: id });
          setIsLiked(likeResult.isLiked);
        } catch (err) {
          // User not authenticated, ignore
        }

        // 데이터 변환 및 설정
        setNovelData({
          ...novel,
          authorName: authorResult.authorProfile.authorName,
          genreName: novel.genreId, // TODO: genreId를 genreName으로 변환 필요
          author: {
            name: authorResult.authorProfile.authorName,
            totalWorks: 1, // TODO: API에서 작가의 총 작품 수 가져오기
          },
        });

        setEpisodes(episodesResult.episodes.edges.map(edge => ({
          id: edge.node.id,
          number: edge.node.episodeNumber,
          title: edge.node.title,
          isFree: edge.node.isFree,
          price: edge.node.price,
          viewCount: edge.node.viewCount,
          publishedAt: new Date(edge.node.publishedAt).toLocaleDateString('ko-KR'),
        })));

        setHasMoreEpisodes(episodesResult.episodes.pageInfo.hasNextPage);
        setEpisodeCursor(episodesResult.episodes.pageInfo.endCursor);

        setSimilarNovels(novelDetailResult.novelDetail.similarNovels.map(item => ({
          id: item.novel.id,
          title: item.novel.title,
          coverImageUrl: item.novel.coverImageUrl,
          authorName: item.novel.authorName,
          genreName: item.novel.genreName,
        })));

        _setAuthorProfile(authorResult.authorProfile);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch novel data:', error);
        // Fallback to mock data
        setNovelData(mockNovelData);
        setEpisodes(mockNovelData?.episodes || []);
        setSimilarNovels(getRelatedNovels(id, 5));
        setLoading(false);
      }
    }

    fetchNovelData();
  }, [id, mockNovelData]);

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!novelData) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          소설을 찾을 수 없습니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          존재하지 않는 소설입니다
        </p>
        <Link href="/">
          <Button variant="primary">홈으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const filteredEpisodes = episodes.filter((ep) => {
    if (episodeFilter === 'free') return ep.isFree;
    if (episodeFilter === 'paid') return !ep.isFree;
    return true;
  });

  const handleLoadMoreEpisodes = async () => {
    if (!hasMoreEpisodes || loadingMore || !episodeCursor) return;

    setLoadingMore(true);
    try {
      const episodesResult = await gql<EpisodesData>(`
        query Episodes($novelId: ID!, $first: Int, $after: String) {
          episodes(novelId: $novelId, first: $first, after: $after) {
            edges {
              node {
                id novelId episodeNumber title wordCount status isFree price
                viewCount likeCount commentCount publishedAt
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }
      `, { novelId: id, first: 20, after: episodeCursor });

      const newEpisodes = episodesResult.episodes.edges.map(edge => ({
        id: edge.node.id,
        number: edge.node.episodeNumber,
        title: edge.node.title,
        isFree: edge.node.isFree,
        price: edge.node.price,
        viewCount: edge.node.viewCount,
        publishedAt: new Date(edge.node.publishedAt).toLocaleDateString('ko-KR'),
      }));

      setEpisodes(prev => [...prev, ...newEpisodes]);
      setHasMoreEpisodes(episodesResult.episodes.pageInfo.hasNextPage);
      setEpisodeCursor(episodesResult.episodes.pageInfo.endCursor);
    } catch (error) {
      console.error('Failed to load more episodes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const result = await gql<{ toggleBookmark: { isBookmarked: boolean } }>(`
        mutation ToggleBookmark($novelId: ID!) {
          toggleBookmark(novelId: $novelId) {
            isBookmarked
          }
        }
      `, { novelId: id });

      setIsBookmarked(result.toggleBookmark.isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      alert('북마크 설정에 실패했습니다. 로그인이 필요합니다.');
    }
  };

  const handleToggleLike = async () => {
    try {
      const result = await gql<{ toggleLike: { isLiked: boolean } }>(`
        mutation ToggleLike($targetType: LikeTargetType!, $targetId: ID!) {
          toggleLike(targetType: $targetType, targetId: $targetId) {
            isLiked
          }
        }
      `, { targetType: 'NOVEL', targetId: id });

      setIsLiked(result.toggleLike.isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      alert('좋아요 설정에 실패했습니다. 로그인이 필요합니다.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* 상단 정보 영역 */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 좌: 커버 이미지 */}
        <div className="md:col-span-1">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg overflow-hidden sticky top-8">
            {novelData.coverImageUrl && (
              <img
                src={novelData.coverImageUrl}
                alt={novelData.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/10" />
          </div>
        </div>

        {/* 우: 기본 정보 */}
        <div className="md:col-span-2">
          {/* 제목, 작가 */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {novelData.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              작가: {novelData.authorName}
            </p>

            {/* 장르 및 태그 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="info">{novelData.genreName}</Badge>
              {novelData.tags.map((tag: string) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* 상태 */}
            <div>
              {novelData.status === 'COMPLETED' && (
                <Badge variant="success">완결</Badge>
              )}
              {novelData.status === 'ONGOING' && (
                <Badge variant="warning">연재중</Badge>
              )}
              {novelData.status === 'HIATUS' && (
                <Badge variant="info">휴재</Badge>
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">조회수</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(novelData.totalViews)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">추천수</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(novelData.totalLikes)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">북마크</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(novelData.totalBookmarks)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 화</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {novelData.totalEpisodes}화
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/novel/${id}/episode/${episodes[0]?.id || '1'}`} className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                첫 화 보기
              </Button>
            </Link>
            <Button
              variant={isBookmarked ? "primary" : "secondary"}
              size="lg"
              onClick={handleToggleBookmark}
            >
              {isBookmarked ? '북마크됨' : '북마크'}
            </Button>
            <Button
              variant={isLiked ? "primary" : "ghost"}
              size="lg"
              onClick={handleToggleLike}
            >
              {isLiked ? '♥' : '♡'}
            </Button>
          </div>
        </div>
      </div>

      {/* 시놉시스 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          시놉시스
        </h2>
        <div
          className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
            !expandedSynopsis ? 'line-clamp-3' : ''
          }`}
        >
          {novelData.synopsis}
        </div>
        <button
          onClick={() => setExpandedSynopsis(!expandedSynopsis)}
          className="mt-3 text-primary-500 hover:text-primary-600 font-medium text-sm"
        >
          {expandedSynopsis ? '접기' : '펼치기'}
        </button>
      </div>

      {/* 회차 목록 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          회차 목록
        </h2>

        {/* 탭 */}
        <div className="mb-6 flex gap-2">
          {(['all', 'free', 'paid'] as const).map((filter) => {
            const labels: Record<typeof filter, string> = {
              all: '전체',
              free: '무료',
              paid: '유료',
            };
            return (
              <button
                key={filter}
                onClick={() => setEpisodeFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  episodeFilter === filter
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>

        {/* 에피소드 목록 */}
        <div className="space-y-2">
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredEpisodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/novel/${id}/episode/${episode.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-gray-200 dark:border-gray-800"
              >
                {/* 회차번호 */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg font-bold text-gray-900 dark:text-white">
                  {episode.number}
                </div>

                {/* 제목 및 날짜 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                    {episode.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {episode.publishedAt}
                  </p>
                </div>

                {/* 무료/유료 배지 */}
                <div className="flex-shrink-0">
                  {episode.isFree ? (
                    <Badge variant="success" size="sm">
                      무료
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" size="sm">
                        {episode.price} 코인
                      </Badge>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 7 15.5 7 14 7.67 14 8.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 7 8.5 7 7 7.67 7 8.5 7.67 10 8.5 10zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 조회수 */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    조회 {formatNumber(episode.viewCount)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* 더보기 버튼 */}
          {hasMoreEpisodes && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                onClick={handleLoadMoreEpisodes}
                disabled={loadingMore}
              >
                {loadingMore ? '로딩 중...' : '더보기'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 작가 정보 */}
      <div className="mb-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          작가 정보
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {novelData.author.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              작품 {novelData.author.totalWorks}개
            </p>
          </div>
        </div>
      </div>

      {/* 유사 작품 */}
      {similarNovels.length > 0 && (
        <div className="mb-12">
          <NovelGrid novels={similarNovels} title="같은 장르의 다른 소설" />
        </div>
      )}
    </div>
  );
}

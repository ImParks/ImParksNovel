'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReaderStore } from '@/stores';
import { Button } from '@/components/atoms/Button';
import { SettingsPanel } from '@/components/molecules/SettingsPanel';
import { gql } from '@/lib/graphql-client';

// GraphQL Types
interface EpisodeData {
  episode: {
    id: string;
    novelId: string;
    authorId: string;
    episodeNumber: number;
    title: string;
    content: string;
    wordCount: number;
    status: string;
    isFree: boolean;
    price: number;
    viewCount: number;
    likeCount: number;
    dislikeCount: number;
    recommendCount: number;
    commentCount: number;
    publishedAt: string;
    createdAt: string;
  };
}

interface CommentsData {
  comments: {
    edges: Array<{
      node: {
        id: string;
        userId: string;
        episodeId: string;
        content: string;
        isSpoiler: boolean;
        parentId: string | null;
        depth: number;
        isPinned: boolean;
        isEdited: boolean;
        likeCount: number;
        isHidden: boolean;
        createdAt: string;
      };
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

// Mock 데이터 (fallback용)
interface Episode {
  id: string;
  number: number;
  title: string;
  content: string;
  isFree: boolean;
  price: number;
  viewCount: number;
  recommendCount: number;
  publishedAt: string;
  novelId: string;
  novelTitle: string;
  prevEpisodeId: string | null;
  nextEpisodeId: string | null;
}

const MOCK_EPISODES: Record<string, Episode> = {
  ep1: {
    id: 'ep1',
    number: 1,
    title: '프롤로그 - 세계가 변한 날',
    content: `10년 전, 세계에 갑자기 나타난 통로. 그것은 던전이라 불렸다.

던전의 출현은 세상을 완전히 바꿨다. 수십억의 인류가 절멸했다. 무너진 문명, 파괴된 도시, 그리고 남겨진 사람들.

나는 그 10년을 살아남았다. 모두가 죽을 것이라고 생각했을 때도, 세상이 끝날 것이라고 생각했을 때도, 나는 살아있었다.

무엇 때문일까? 나는 모른다. 단지 살기 위해 애썼을 뿐이다.

그리고 오늘, 모든 것이 바뀌기 시작했다.

[시스템 메시지]
"축하합니다. 당신은 던전 관리자로 선정되었습니다."

무슨 소리지? 던전 관리자? 그런 게 있다고?

나는 하늘을 향해 손을 들었다. 하얀 빛이 내 몸을 감싸기 시작했고, 이상한 감각이 내 몸을 훑고 지나갔다.

이것이 모든 것의 시작이었다. 내 인생의 두 번째 변화가 시작된 것이다.

앞으로 어떤 일이 벌어질지, 나는 아무도 모르지 못했다. 단지, 이 통로 속에서 나는 더 이상 약자가 아니게 될 것이라는 확신이 들었다.

세상이 끝났어도, 내 삶은 이제 시작된 것이다.`,
    isFree: true,
    price: 0,
    viewCount: 500000,
    recommendCount: 12000,
    publishedAt: '2024-01-01',
    novelId: '1',
    novelTitle: '나 혼자만 레벨업',
    prevEpisodeId: null,
    nextEpisodeId: 'ep2',
  },
  ep2: {
    id: 'ep2',
    number: 2,
    title: '각성',
    content: `[시스템 메시지]
"던전 관리자 계약이 완료되었습니다."

내 눈 앞에 반투명한 창이 떠올랐다. 그리고 그곳에 쓰인 글자들을 읽으며, 나는 천천히 웃음을 지었다.

이건... 정말로?

나는 손을 들었고, 창을 터치했다. 그 순간, 엄청난 에너지가 내 몸으로 흘러들었다.

[레벨: 1]
[경험치: 0/100]
[체력: 10]
[마나: 5]

아, 이건 정말... 게임처럼 작동한다.

나는 웃음을 멈출 수 없었다. 10년 동안 죽음의 문턱에서 헤맸던 모든 날들이, 이 순간 가치 있어 보였다.

"이제부터가 진짜다."

나는 중얼거렸다.

"이제부터... 나는 강해질 것이다."`,
    isFree: false,
    price: 50,
    viewCount: 350000,
    recommendCount: 8500,
    publishedAt: '2024-01-02',
    novelId: '1',
    novelTitle: '나 혼자만 레벨업',
    prevEpisodeId: 'ep1',
    nextEpisodeId: 'ep3',
  },
};

const getThemeStyles = (theme: string) => {
  switch (theme) {
    case 'sepia':
      return 'bg-yellow-50 text-yellow-900';
    case 'dark':
      return 'bg-gray-900 text-gray-100';
    case 'light':
    default:
      return 'bg-white text-gray-900';
  }
};

export default function EpisodePage() {
  const params = useParams();
  const router = useRouter();
  const { fontSize, theme, lineHeight } = useReaderStore();
  const [showSettings, setShowSettings] = useState(false);
  const [liked, setLiked] = useState(false);

  const episodeId = params.episodeId as string;
  const novelId = params.id as string;

  // API 상태 관리
  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [novelTitle, setNovelTitle] = useState<string>('');
  const [prevEpisodeId, setPrevEpisodeId] = useState<string | null>(null);
  const [nextEpisodeId, setNextEpisodeId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Fallback mock 데이터
  const mockEpisode = MOCK_EPISODES[episodeId as keyof typeof MOCK_EPISODES];

  useEffect(() => {
    async function fetchEpisodeData() {
      setLoading(true);
      try {
        // 1. Episode 쿼리
        const episodeResult = await gql<EpisodeData>(`
          query Episode($id: ID!) {
            episode(id: $id) {
              id novelId authorId episodeNumber title content wordCount status
              isFree price viewCount likeCount dislikeCount recommendCount commentCount
              publishedAt createdAt
            }
          }
        `, { id: episodeId });

        const episodeData = episodeResult.episode;

        // 2. Comments 쿼리
        const commentsResult = await gql<CommentsData>(`
          query Comments($episodeId: ID!, $first: Int) {
            comments(episodeId: $episodeId, first: $first) {
              edges {
                node {
                  id userId episodeId content isSpoiler parentId depth isPinned
                  isEdited likeCount isHidden createdAt
                }
              }
              pageInfo { hasNextPage endCursor }
              totalCount
            }
          }
        `, { episodeId, first: 50 });

        // 3. 이전/다음 에피소드 조회 (간단한 로직: 현재 번호 ±1)
        // TODO: API에서 이전/다음 에피소드 ID를 직접 제공하도록 개선 필요
        const currentEpisodeNumber = episodeData.episodeNumber;

        // 데이터 설정
        setEpisode({
          id: episodeData.id,
          number: episodeData.episodeNumber,
          title: episodeData.title,
          content: episodeData.content,
          isFree: episodeData.isFree,
          price: episodeData.price,
          viewCount: episodeData.viewCount,
          recommendCount: episodeData.recommendCount,
          publishedAt: episodeData.publishedAt,
          novelId: episodeData.novelId,
        });

        setComments(commentsResult.comments.edges.map(edge => edge.node));

        // 3. Check episode ownership for paid episodes
        if (!episodeData.isFree) {
          try {
            const ownershipResult = await gql<{ episodeOwnership: { id: string } | null }>(`
              query EpisodeOwnership($episodeId: ID!) {
                episodeOwnership(episodeId: $episodeId) {
                  id
                }
              }
            `, { episodeId });
            setIsPurchased(!!ownershipResult.episodeOwnership);
          } catch (err) {
            setIsPurchased(false);
          }
        } else {
          setIsPurchased(true);
        }

        // 4. Get novel title from novelId
        try {
          const novelResult = await gql<{ novel: { title: string } }>(`
            query Novel($id: ID!) {
              novel(id: $id) {
                title
              }
            }
          `, { id: episodeData.novelId });
          setNovelTitle(novelResult.novel.title);
        } catch (err) {
          setNovelTitle('소설 제목');
        }

        // 5. Get prev/next episodes
        try {
          const allEpisodesResult = await gql<{
            episodes: {
              edges: Array<{ node: { id: string; episodeNumber: number } }>
            }
          }>(`
            query Episodes($novelId: ID!, $first: Int) {
              episodes(novelId: $novelId, first: $first) {
                edges {
                  node {
                    id
                    episodeNumber
                  }
                }
              }
            }
          `, { novelId: episodeData.novelId, first: 200 });

          const allEpisodes = allEpisodesResult.episodes.edges.map(edge => edge.node);
          const currentIndex = allEpisodes.findIndex(ep => ep.id === episodeId);

          if (currentIndex > 0) {
            setPrevEpisodeId(allEpisodes[currentIndex - 1].id);
          }
          if (currentIndex < allEpisodes.length - 1) {
            setNextEpisodeId(allEpisodes[currentIndex + 1].id);
          }
        } catch (err) {
          console.error('Failed to get prev/next episodes:', err);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch episode data:', error);
        // Fallback to mock data
        setEpisode(mockEpisode);
        setNovelTitle(mockEpisode?.novelTitle || '');
        setPrevEpisodeId(mockEpisode?.prevEpisodeId || null);
        setNextEpisodeId(mockEpisode?.nextEpisodeId || null);
        setLoading(false);
      }
    }

    fetchEpisodeData();
  }, [episodeId, mockEpisode]);

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

  if (!episode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">회차를 찾을 수 없습니다</h1>
          <Button onClick={() => router.back()}>뒤로가기</Button>
        </div>
      </div>
    );
  }

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const result = await gql<{ createComment: { id: string; content: string; createdAt: string } }>(`
        mutation CreateComment($input: CreateCommentInput!) {
          createComment(input: $input) {
            id
            content
            createdAt
          }
        }
      `, {
        input: {
          episodeId,
          content: newComment.trim(),
          isSpoiler: false,
        },
      });

      setComments(prev => [result.createComment, ...prev]);
      setNewComment('');
      alert('댓글이 작성되었습니다.');
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('댓글 작성에 실패했습니다. 로그인이 필요합니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePurchaseEpisode = async () => {
    setPurchasing(true);
    try {
      await gql<{ purchaseEpisode: { id: string } }>(`
        mutation PurchaseEpisode($episodeId: ID!) {
          purchaseEpisode(episodeId: $episodeId) {
            id
          }
        }
      `, { episodeId });

      setIsPurchased(true);
      alert('회차를 구매했습니다.');
      // Refetch episode data to show content
      window.location.reload();
    } catch (error) {
      console.error('Failed to purchase episode:', error);
      alert('회차 구매에 실패했습니다. 코인이 부족하거나 로그인이 필요합니다.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRentEpisode = async (days: 3 | 7 | 14) => {
    setPurchasing(true);
    try {
      await gql<{ rentEpisode: { id: string } }>(`
        mutation RentEpisode($episodeId: ID!, $days: Int!) {
          rentEpisode(episodeId: $episodeId, days: $days) {
            id
          }
        }
      `, { episodeId, days });

      setIsPurchased(true);
      alert(`회차를 ${days}일 대여했습니다.`);
      // Refetch episode data to show content
      window.location.reload();
    } catch (error) {
      console.error('Failed to rent episode:', error);
      alert('회차 대여에 실패했습니다. 코인이 부족하거나 로그인이 필요합니다.');
    } finally {
      setPurchasing(false);
    }
  };

  const isFree = episode.isFree;
  const canRead = isFree || isPurchased;

  return (
    <div className={`transition-colors duration-300 ${getThemeStyles(theme)}`}>
      {/* 상단 바 */}
      <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push(`/novel/${novelId}`)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            aria-label="뒤로가기"
          >
            ←
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {novelTitle}
            </h1>
            <h2 className="text-base font-bold">{episode.title}</h2>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            aria-label="설정"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="sticky top-20 z-30 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-center">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}

      {/* 본문 영역 */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {canRead ? (
          <>
            {/* 제목 */}
            <header className="text-center mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{episode.number}화</p>
              <h1 className="text-3xl font-bold mb-2">{episode.title}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(episode.publishedAt).toLocaleDateString()}
              </p>
            </header>

            {/* 본문 */}
            <article
              className="prose dark:prose-invert max-w-none mb-12"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
              }}
            >
              {episode.content.split('\n\n').map((paragraph: string, i: number) => (
                <p key={i} className="mb-6 text-justify">
                  {paragraph}
                </p>
              ))}
            </article>
          </>
        ) : (
          <>
            {/* 유료 회차 미리보기 */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">{episode.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                {new Date(episode.publishedAt).toLocaleDateString()}
              </p>

              {/* 미리보기 텍스트 (블러 처리) */}
              <div className="relative mb-8 pb-8">
                <article
                  className="prose dark:prose-invert max-w-none mb-4 blur-sm opacity-70"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                  }}
                >
                  {episode.content.split('\n\n').slice(0, 2).map((paragraph: string, i: number) => (
                    <p key={i} className="mb-4 text-justify">
                      {paragraph}
                    </p>
                  ))}
                </article>

                {/* 그라디언트 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-gray-900 pointer-events-none" />
              </div>

              {/* 구매 옵션 */}
              <div className="space-y-4 max-w-sm mx-auto">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handlePurchaseEpisode}
                  disabled={purchasing}
                >
                  {purchasing ? '구매 중...' : `${episode.price}코인으로 구매`}
                </Button>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">또는</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRentEpisode(3)}
                    disabled={purchasing}
                  >
                    대여 (3일) - {Math.floor(episode.price * 0.5)}코인
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRentEpisode(7)}
                    disabled={purchasing}
                  >
                    대여 (7일) - {Math.floor(episode.price * 0.7)}코인
                  </Button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="mb-2">코인이 부족하신가요?</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/payment/coins')}
                    className="w-full"
                  >
                    코인 충전하기
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <div className="sticky bottom-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* 이전/다음 버튼 */}
            <button
              onClick={() =>
                prevEpisodeId && router.push(`/novel/${novelId}/episode/${prevEpisodeId}`)
              }
              disabled={!prevEpisodeId}
              className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← 이전
            </button>

            <div className="text-center flex-1">
              <p className="text-sm font-bold">{episode.number}화</p>
            </div>

            <button
              onClick={() =>
                nextEpisodeId && router.push(`/novel/${novelId}/episode/${nextEpisodeId}`)
              }
              disabled={!nextEpisodeId}
              className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              다음 →
            </button>
          </div>

          {/* 추천 버튼 */}
          <button
            onClick={() => setLiked(!liked)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className={`text-xl ${liked ? 'text-red-500' : 'text-gray-400'}`}>♥</span>
            <span className="text-sm font-medium">
              추천 {episode.recommendCount + (liked ? 1 : 0)}
            </span>
          </button>
        </div>
      </div>

      {/* 댓글 섹션 (canRead일 때만 표시) */}
      {canRead && (
        <div className="container mx-auto px-4 py-8 max-w-3xl bg-white dark:bg-gray-900">
          <h3 className="text-xl font-bold mb-4">댓글 {comments.length}</h3>

          {/* 댓글 작성 */}
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 작성하세요..."
              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleCreateComment}
                disabled={submittingComment || !newComment.trim()}
              >
                {submittingComment ? '작성 중...' : '댓글 작성'}
              </Button>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

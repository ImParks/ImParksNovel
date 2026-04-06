'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Badge } from '@/components/atoms';
import Link from 'next/link';
import { gql } from '@/lib/graphql-client';
import {
  getPurchaseHistory,
  getCoinHistory,
  getCurrentMembership,
  getMembershipHistory,
} from '@/lib/mock/my-page-data';

type TabType = 'coins' | 'episodes' | 'membership';

interface CoinTransaction {
  id: string;
  type: 'CHARGE' | 'USE' | 'REFUND';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface PurchaseHistoryNode {
  id: string;
  episodeId: string;
  purchaseType: 'OWN' | 'RENT';
  coinsSpent: number;
  expiresAt: string | null;
  createdAt: string;
}

interface EpisodeInfo {
  id: string;
  novelId: string;
  title: string;
  episodeNumber: number;
}

interface NovelInfo {
  id: string;
  title: string;
}

interface CoinBalance {
  balance: number;
  totalCharged: number;
  totalUsed: number;
}

interface Membership {
  id: string;
  tier: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
}

export default function PurchasesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('coins');
  const [loading, setLoading] = useState(true);
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [purchaseHistoryData, setPurchaseHistoryData] = useState<PurchaseHistoryNode[]>([]);
  const [, setCoinBalance] = useState<CoinBalance | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [episodeInfoMap, setEpisodeInfoMap] = useState<Record<string, EpisodeInfo>>({});
  const [novelInfoMap, setNovelInfoMap] = useState<Record<string, NovelInfo>>({});
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // 코인 거래 내역 조회
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'coins') return;

    const fetchCoinData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 코인 잔액 조회
        const balanceData = await gql<{ coinBalance: CoinBalance }>(
          `query CoinBalance {
            coinBalance {
              balance
              totalCharged
              totalUsed
            }
          }`
        );
        setCoinBalance(balanceData.coinBalance);

        // 코인 거래 내역 조회
        const transactionsData = await gql<{
          coinTransactions: {
            edges: Array<{ node: CoinTransaction }>,
            totalCount: number
          }
        }>(
          `query CoinTransactions($type: CoinTransactionType, $first: Int, $after: String) {
            coinTransactions(type: $type, first: $first, after: $after) {
              edges {
                node {
                  id
                  type
                  amount
                  balanceAfter
                  description
                  createdAt
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
              totalCount
            }
          }`,
          { first: 50 }
        );

        setCoinTransactions(transactionsData.coinTransactions.edges.map(edge => edge.node));
      } catch (err) {
        console.error('Failed to fetch coin data:', err);
        setError('코인 내역을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [isAuthenticated, activeTab]);

  // 회차 구매 내역 조회
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'episodes') return;

    const fetchPurchaseHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await gql<{
          purchaseHistory: {
            edges: Array<{ node: PurchaseHistoryNode }>,
            pageInfo: { hasNextPage: boolean; endCursor: string | null },
            totalCount: number
          }
        }>(
          `query PurchaseHistory($first: Int, $after: String) {
            purchaseHistory(first: $first, after: $after) {
              edges {
                node {
                  id
                  episodeId
                  purchaseType
                  coinsSpent
                  expiresAt
                  createdAt
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
              totalCount
            }
          }`,
          { first: 50 }
        );

        const purchases = data.purchaseHistory.edges.map(edge => edge.node);
        setPurchaseHistoryData(purchases);
        setHasNextPage(data.purchaseHistory.pageInfo.hasNextPage);
        setEndCursor(data.purchaseHistory.pageInfo.endCursor);

        // Fetch episode info for each purchase
        const episodeIds = purchases.map(p => p.episodeId);
        const episodeMap: Record<string, EpisodeInfo> = {};
        const novelMap: Record<string, NovelInfo> = {};

        for (const episodeId of episodeIds) {
          try {
            const episodeResult = await gql<{ episode: EpisodeInfo }>(`
              query Episode($id: ID!) {
                episode(id: $id) {
                  id
                  novelId
                  title
                  episodeNumber
                }
              }
            `, { id: episodeId });

            episodeMap[episodeId] = episodeResult.episode;

            // Fetch novel info if not already fetched
            if (!novelMap[episodeResult.episode.novelId]) {
              const novelResult = await gql<{ novel: NovelInfo }>(`
                query Novel($id: ID!) {
                  novel(id: $id) {
                    id
                    title
                  }
                }
              `, { id: episodeResult.episode.novelId });

              novelMap[episodeResult.episode.novelId] = novelResult.novel;
            }
          } catch (err) {
            console.error(`Failed to fetch episode info for ${episodeId}:`, err);
          }
        }

        setEpisodeInfoMap(episodeMap);
        setNovelInfoMap(novelMap);
      } catch (err) {
        console.error('Failed to fetch purchase history:', err);
        setError('구매 내역을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseHistory();
  }, [isAuthenticated, activeTab]);

  // 멤버십 정보 조회
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'membership') return;

    const fetchMembership = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await gql<{ myMembership: Membership | null }>(
          `query MyMembership {
            myMembership {
              id
              tier
              status
              startedAt
              expiresAt
              autoRenew
            }
          }`
        );

        setMembership(data.myMembership);
      } catch (err) {
        console.error('Failed to fetch membership:', err);
        setError('멤버십 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
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
            구매 내역을 확인하려면 로그인해주세요.
          </p>
          <Button asChild variant="primary">
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Fallback to mock data
  const coinHistory = error ? getCoinHistory() : coinTransactions.map(t => ({
    id: t.id,
    date: new Date(t.createdAt).toLocaleDateString('ko-KR'),
    type: t.type.toLowerCase() as 'charge' | 'use' | 'refund',
    amount: t.amount,
    balance: t.balanceAfter,
    description: t.description,
  }));

  const purchaseHistory = error ? getPurchaseHistory() : purchaseHistoryData.map(p => {
    const episodeInfo = episodeInfoMap[p.episodeId];
    const novelInfo = episodeInfo ? novelInfoMap[episodeInfo.novelId] : null;

    return {
      id: p.id,
      novelTitle: novelInfo?.title || '소설 제목',
      episodeTitle: episodeInfo ? `${episodeInfo.episodeNumber}화 - ${episodeInfo.title}` : `${p.episodeId}화`,
      purchaseType: p.purchaseType.toLowerCase() as 'own' | 'rent',
      cost: p.coinsSpent,
      date: new Date(p.createdAt).toLocaleDateString('ko-KR'),
      expiryDate: p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('ko-KR') : null,
    };
  });

  const handleLoadMorePurchases = async () => {
    if (!hasNextPage || loadingMore || !endCursor) return;

    setLoadingMore(true);
    try {
      const data = await gql<{
        purchaseHistory: {
          edges: Array<{ node: PurchaseHistoryNode }>,
          pageInfo: { hasNextPage: boolean; endCursor: string | null },
          totalCount: number
        }
      }>(
        `query PurchaseHistory($first: Int, $after: String) {
          purchaseHistory(first: $first, after: $after) {
            edges {
              node {
                id
                episodeId
                purchaseType
                coinsSpent
                expiresAt
                createdAt
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
            totalCount
          }
        }`,
        { first: 50, after: endCursor }
      );

      const purchases = data.purchaseHistory.edges.map(edge => edge.node);
      setPurchaseHistoryData(prev => [...prev, ...purchases]);
      setHasNextPage(data.purchaseHistory.pageInfo.hasNextPage);
      setEndCursor(data.purchaseHistory.pageInfo.endCursor);

      // Fetch episode/novel info for new purchases
      const episodeIds = purchases.map(p => p.episodeId);
      const episodeMap: Record<string, EpisodeInfo> = { ...episodeInfoMap };
      const novelMap: Record<string, NovelInfo> = { ...novelInfoMap };

      for (const episodeId of episodeIds) {
        if (!episodeMap[episodeId]) {
          try {
            const episodeResult = await gql<{ episode: EpisodeInfo }>(`
              query Episode($id: ID!) {
                episode(id: $id) {
                  id
                  novelId
                  title
                  episodeNumber
                }
              }
            `, { id: episodeId });

            episodeMap[episodeId] = episodeResult.episode;

            if (!novelMap[episodeResult.episode.novelId]) {
              const novelResult = await gql<{ novel: NovelInfo }>(`
                query Novel($id: ID!) {
                  novel(id: $id) {
                    id
                    title
                  }
                }
              `, { id: episodeResult.episode.novelId });

              novelMap[episodeResult.episode.novelId] = novelResult.novel;
            }
          } catch (err) {
            console.error(`Failed to fetch episode info for ${episodeId}:`, err);
          }
        }
      }

      setEpisodeInfoMap(episodeMap);
      setNovelInfoMap(novelMap);
    } catch (err) {
      console.error('Failed to load more purchases:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const currentMembership = membership ? {
    name: membership.tier,
    monthlyPrice: 0, // TODO: tier 정보에서 조회 필요
    startDate: new Date(membership.startedAt).toLocaleDateString('ko-KR'),
    endDate: new Date(membership.expiresAt).toLocaleDateString('ko-KR'),
    benefits: [], // TODO: tier 정보에서 조회 필요
  } : (error ? getCurrentMembership() : null);

  const membershipHistory = getMembershipHistory();

  return (
    <main className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          구매 내역
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          코인 충전, 회차 구매, 멤버십 이용 내역을 확인할 수 있습니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: 'coins', label: '코인 내역' },
          { id: 'episodes', label: '회차 구매' },
          { id: 'membership', label: '멤버십' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={[
              'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === id
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

      {/* 코인 내역 */}
      {activeTab === 'coins' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Mock 데이터를 표시합니다.</div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    잔액
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {coinHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {history.date}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          history.type === 'charge'
                            ? 'success'
                            : history.type === 'use'
                            ? 'warning'
                            : 'error'
                        }
                        size="sm"
                      >
                        {history.type === 'charge'
                          ? '충전'
                          : history.type === 'use'
                          ? '사용'
                          : '환불'}
                      </Badge>
                    </td>
                    <td
                      className={[
                        'px-6 py-4 font-medium',
                        history.amount > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {history.amount > 0 ? '+' : ''}{history.amount}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {history.balance}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {history.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 회차 구매 */}
      {activeTab === 'episodes' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Mock 데이터를 표시합니다.</div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    소설
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    회차
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    구매유형
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    코인
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    구매일
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    만료일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {purchaseHistory.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {purchase.novelTitle}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {purchase.episodeTitle}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={purchase.purchaseType === 'own' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {purchase.purchaseType === 'own' ? '소유' : '대여'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {purchase.cost}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {purchase.date}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {purchase.expiryDate || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 더보기 버튼 */}
          {hasNextPage && (
            <div className="flex justify-center p-4">
              <Button
                variant="secondary"
                onClick={handleLoadMorePurchases}
                disabled={loadingMore}
              >
                {loadingMore ? '로딩 중...' : '더보기'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 멤버십 */}
      {activeTab === 'membership' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Mock 데이터를 표시합니다.</div>
            </div>
          ) : null}
          {/* 현재 멤버십 */}
          {currentMembership && (
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">현재 멤버십</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm opacity-90">멤버십</p>
                  <p className="text-2xl font-bold">{currentMembership.name}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">월 가격</p>
                  <p className="text-2xl font-bold">{currentMembership.monthlyPrice.toLocaleString()}원</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">시작일</p>
                  <p className="text-lg font-semibold">{currentMembership.startDate}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">만료일</p>
                  <p className="text-lg font-semibold">{currentMembership.endDate}</p>
                </div>
              </div>

              <div>
                <p className="text-sm opacity-90 mb-2">혜택</p>
                <ul className="space-y-1">
                  {currentMembership.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span>✓</span> {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="secondary" className="text-primary-600">
                  멤버십 관리
                </Button>
              </div>
            </div>
          )}

          {/* 멤버십 이력 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                멤버십 이용 이력
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      멤버십
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      월 가격
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      시작일
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      만료일
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {membershipHistory.map((membership) => (
                    <tr key={membership.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {membership.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {membership.monthlyPrice.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {membership.startDate}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {membership.endDate}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={membership.status === 'active' ? 'success' : 'default'}
                          size="sm"
                        >
                          {membership.status === 'active' ? '진행중' : '만료'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

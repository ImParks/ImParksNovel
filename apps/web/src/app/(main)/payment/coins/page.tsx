'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePaymentStore, type CoinPackage, type PaymentHistory } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { gql } from '@/lib/graphql-client';
import {
  COIN_BALANCE_QUERY,
  COIN_TRANSACTIONS_QUERY,
  PREPARE_COIN_CHARGE_MUTATION,
  CONFIRM_COIN_CHARGE_MUTATION,
} from '@/lib/graphql-queries';

const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'basic',
    coins: 10,
    bonusCoins: 0,
    price: 1000,
  },
  {
    id: 'popular',
    coins: 55,
    bonusCoins: 5,
    price: 5000,
    recommended: true,
  },
  {
    id: 'premium',
    coins: 120,
    bonusCoins: 20,
    price: 10000,
  },
  {
    id: 'vip',
    coins: 650,
    bonusCoins: 50,
    price: 50000,
  },
];

// Mock 충전 내역
const MOCK_PAYMENT_HISTORY: PaymentHistory[] = [
  {
    id: '1',
    date: '2024-03-20',
    type: 'purchase',
    coins: 120,
    price: 10000,
    balance: 2500,
  },
  {
    id: '2',
    date: '2024-03-18',
    type: 'purchase',
    coins: 55,
    price: 5000,
    balance: 2380,
  },
  {
    id: '3',
    date: '2024-03-15',
    type: 'reward',
    coins: 30,
    price: 0,
    balance: 2325,
  },
  {
    id: '4',
    date: '2024-03-10',
    type: 'purchase',
    coins: 10,
    price: 1000,
    balance: 2295,
  },
];

// GraphQL 응답 타입
interface CoinBalanceResponse {
  coinBalance: {
    balance: number;
    totalCharged: number;
    totalUsed: number;
  };
}

interface CoinTransactionNode {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
}

interface CoinTransactionsResponse {
  coinTransactions: {
    edges: Array<{ node: CoinTransactionNode }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    totalCount: number;
  };
}

interface PrepareChargeResponse {
  prepareCoinCharge: {
    paymentKey: string;
    orderId: string;
    amount: number;
  };
}

interface ConfirmChargeResponse {
  confirmCoinCharge: {
    success: boolean;
    balance: number;
    transaction: {
      id: string;
      type: string;
      amount: number;
      createdAt: string;
    };
  };
}

export default function CoinsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { userCoins, addCoins } = usePaymentStore();
  const [selectedPackageId, setSelectedPackageId] = useState<string>('popular');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<PaymentHistory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const selectedPackage = COIN_PACKAGES.find((p) => p.id === selectedPackageId);

  // 인증 체크
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  // API 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadPaymentData = async () => {
      setIsLoadingData(true);

      try {
        // 코인 잔액 조회
        try {
          const balanceData = await gql<CoinBalanceResponse>(COIN_BALANCE_QUERY);
          setApiBalance(balanceData.coinBalance.balance);
        } catch (error) {
          console.warn('코인 잔액 API 실패, store 데이터 사용:', error);
        }

        // 코인 거래 내역 조회
        try {
          const transactionsData = await gql<CoinTransactionsResponse>(
            COIN_TRANSACTIONS_QUERY,
            { first: 10 }
          );

          const mappedTransactions: PaymentHistory[] = transactionsData.coinTransactions.edges.map(
            ({ node }) => ({
              id: node.id,
              date: new Date(node.createdAt).toISOString().split('T')[0],
              type: node.type.toLowerCase() as 'purchase' | 'reward' | 'refund',
              coins: Math.abs(node.amount),
              price: 0, // API에서 가격 정보가 없으므로 0
              balance: node.balance,
            })
          );

          setTransactions(mappedTransactions);
        } catch (error) {
          console.warn('거래 내역 API 실패, mock 데이터 사용:', error);
          setTransactions(MOCK_PAYMENT_HISTORY);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    loadPaymentData();
  }, [isAuthenticated]);

  const handlePayment = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);

    try {
      // Step 1: 결제 준비 (주문 정보 생성)
      const prepareData = await gql<PrepareChargeResponse>(PREPARE_COIN_CHARGE_MUTATION, {
        packageId: selectedPackage.id,
      });

      // Step 2: 실제 환경에서는 여기서 Toss Payments 위젯을 호출해야 함
      // 테스트 환경에서는 즉시 확인 단계로 진행 (시뮬레이션)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 3: 결제 확인
      const confirmData = await gql<ConfirmChargeResponse>(CONFIRM_COIN_CHARGE_MUTATION, {
        input: {
          orderId: prepareData.prepareCoinCharge.orderId,
          paymentKey: prepareData.prepareCoinCharge.paymentKey,
          amount: prepareData.prepareCoinCharge.amount,
        },
      });

      if (confirmData.confirmCoinCharge.success) {
        // 코인 추가 (store 업데이트)
        addCoins(selectedPackage.coins + selectedPackage.bonusCoins);

        // API 잔액 업데이트
        setApiBalance(confirmData.confirmCoinCharge.balance);

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

        // 거래 내역 새로고침
        try {
          const transactionsData = await gql<CoinTransactionsResponse>(
            COIN_TRANSACTIONS_QUERY,
            { first: 10 }
          );

          const mappedTransactions: PaymentHistory[] = transactionsData.coinTransactions.edges.map(
            ({ node }) => ({
              id: node.id,
              date: new Date(node.createdAt).toISOString().split('T')[0],
              type: node.type.toLowerCase() as 'purchase' | 'reward' | 'refund',
              coins: Math.abs(node.amount),
              price: 0,
              balance: node.balance,
            })
          );

          setTransactions(mappedTransactions);
        } catch (error) {
          console.warn('거래 내역 새로고침 실패:', error);
        }
      }
    } catch (error) {
      console.error('결제 처리 실패:', error);
      alert('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 표시할 코인 잔액 (API 우선, fallback to store)
  const displayBalance = apiBalance !== null ? apiBalance : userCoins;

  // 표시할 거래 내역 (API 우선, fallback to mock)
  const displayTransactions = transactions.length > 0 ? transactions : MOCK_PAYMENT_HISTORY;

  if (!isAuthenticated) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 현재 잔액 */}
        <div className="mb-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">보유 코인</p>
          {isLoadingData ? (
            <div className="flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <p className="text-5xl font-bold text-primary-500 mb-1">{displayBalance}</p>
              <p className="text-xs text-gray-400">≈ {(displayBalance * 100).toLocaleString()}원</p>
            </>
          )}
        </div>

        {/* 성공 메시지 */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium text-center">
            충전이 완료되었습니다! {(selectedPackage?.coins ?? 0) + (selectedPackage?.bonusCoins ?? 0)}
            코인이 추가되었습니다.
          </div>
        )}

        {/* 충전 패키지 */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">충전 패키지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {COIN_PACKAGES.map((pkg) => (
              <label key={pkg.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="package"
                  value={pkg.id}
                  checked={selectedPackageId === pkg.id}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="sr-only"
                />

                <div
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedPackageId === pkg.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-2xl font-bold">{pkg.coins}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">코인</p>
                    </div>

                    {pkg.recommended && (
                      <Badge variant="info" size="sm">
                        인기
                      </Badge>
                    )}
                  </div>

                  {pkg.bonusCoins > 0 && (
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-4">
                      + {pkg.bonusCoins} 보너스
                    </p>
                  )}

                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {(pkg.price / 1000).toLocaleString()}원
                  </p>
                </div>
              </label>
            ))}
          </div>

          {selectedPackage && (
            <Button
              size="lg"
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing && <Spinner size="sm" />}
              {isProcessing
                ? '결제 중...'
                : `${selectedPackage.coins + selectedPackage.bonusCoins}개 구매 - ${(selectedPackage.price / 1000).toLocaleString()}원`}
            </Button>
          )}
        </div>

        {/* 충전 내역 */}
        <div>
          <h2 className="text-xl font-bold mb-4">충전 내역</h2>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">날짜</th>
                  <th className="px-4 py-3 text-left font-medium">유형</th>
                  <th className="px-4 py-3 text-right font-medium">금액</th>
                  <th className="px-4 py-3 text-right font-medium">잔액</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingData ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center">
                      <Spinner size="sm" className="mx-auto" />
                    </td>
                  </tr>
                ) : displayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      거래 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  displayTransactions.map((history) => (
                  <tr
                    key={history.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {new Date(history.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {history.type === 'purchase' && (
                        <span className="text-red-500 dark:text-red-400">구매</span>
                      )}
                      {history.type === 'reward' && (
                        <span className="text-green-500 dark:text-green-400">보상</span>
                      )}
                      {history.type === 'refund' && (
                        <span className="text-yellow-500 dark:text-yellow-400">환불</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {history.type === 'purchase' && (
                        <span className="text-red-500 dark:text-red-400">
                          -{history.coins.toLocaleString()}
                        </span>
                      )}
                      {history.type === 'reward' && (
                        <span className="text-green-500 dark:text-green-400">
                          +{history.coins.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      {history.balance.toLocaleString()}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

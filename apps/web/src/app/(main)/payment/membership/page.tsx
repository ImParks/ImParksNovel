'use client';

import { useState } from 'react';
import { usePaymentStore, type MembershipPlan } from '@/stores';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 4900,
    monthlyBonus: 30,
    previewChapters: true,
    allPreviewChapters: false,
    aiTokens: 0,
    firstChapterFree: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9900,
    monthlyBonus: 100,
    previewChapters: true,
    allPreviewChapters: true,
    aiTokens: 50,
    firstChapterFree: false,
    recommended: true,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 19900,
    monthlyBonus: 250,
    previewChapters: true,
    allPreviewChapters: true,
    aiTokens: 150,
    firstChapterFree: true,
  },
];

export default function MembershipPage() {
  const { membershipId, membershipExpireDate, setMembership, cancelMembership } =
    usePaymentStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const currentPlan = membershipId
    ? MEMBERSHIP_PLANS.find((p) => p.id === membershipId)
    : null;

  const selectedPlan = MEMBERSHIP_PLANS.find((p) => p.id === selectedPlanId);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);

    // 결제 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 멤버십 설정 (30일 후)
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 30);

    setMembership(selectedPlan.id, expireDate.toISOString());

    setIsProcessing(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleCancel = async () => {
    setIsProcessing(true);

    // 취소 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1000));

    cancelMembership();
    setShowCancelConfirm(false);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 현재 멤버십 상태 */}
        <div className="mb-12 p-6 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 border border-primary-200 dark:border-primary-800">
          {currentPlan ? (
            <div>
              <p className="text-sm text-primary-600 dark:text-primary-400 mb-2">현재 구독 중</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {currentPlan.name} 멤버십
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                만료일: {membershipExpireDate && new Date(membershipExpireDate).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-primary-600 dark:text-primary-400 mb-2">
                멤버십 미가입
              </p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                멤버십에 가입하고 특별한 혜택을 받으세요
              </h2>
            </div>
          )}
        </div>

        {/* 성공 메시지 */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium text-center">
            멤버십 {selectedPlan?.name}에 구독되었습니다. 혜택을 바로 이용할 수 있습니다.
          </div>
        )}

        {/* 멤버십 플랜 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {MEMBERSHIP_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg overflow-hidden transition-all ${
                selectedPlanId === plan.id
                  ? 'ring-2 ring-primary-500 shadow-lg'
                  : 'border border-gray-200 dark:border-gray-700'
              } ${plan.recommended ? 'md:scale-105' : ''}`}
            >
              {/* 추천 배지 */}
              {plan.recommended && (
                <div className="absolute top-0 right-0 z-10">
                  <Badge variant="success" size="sm">
                    추천
                  </Badge>
                </div>
              )}

              <div
                className={`p-6 h-full flex flex-col ${
                  selectedPlanId === plan.id
                    ? 'bg-primary-50 dark:bg-primary-950'
                    : 'bg-white dark:bg-gray-900'
                }`}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    월 {(plan.price / 1000).toLocaleString()}원
                  </p>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-primary-500 font-bold">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      매월 보너스 코인 {plan.monthlyBonus}개
                    </span>
                  </li>

                  {plan.previewChapters && (
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-primary-500 font-bold">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {plan.allPreviewChapters
                          ? '모든 무료 회차 선공개'
                          : '일부 무료 회차 선공개'}
                      </span>
                    </li>
                  )}

                  {plan.aiTokens > 0 && (
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-primary-500 font-bold">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        AI 토큰 {plan.aiTokens}개 지급
                      </span>
                    </li>
                  )}

                  {plan.firstChapterFree && (
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-primary-500 font-bold">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        전 작품 1회차 무료 열람
                      </span>
                    </li>
                  )}
                </ul>

                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlanId === plan.id}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">선택</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          {currentPlan ? (
            <>
              <Button
                size="lg"
                onClick={handleSubscribe}
                disabled={isProcessing || selectedPlan?.id === currentPlan.id}
                className="w-full"
              >
                {isProcessing && <Spinner size="sm" />}
                {isProcessing
                  ? '처리 중...'
                  : selectedPlan?.id === currentPlan.id
                    ? '현재 구독 중'
                    : `${selectedPlan?.name} 플랜으로 변경 - ${selectedPlan ? (selectedPlan.price / 1000).toLocaleString() : 0}원`}
              </Button>

              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowCancelConfirm(true)}
                className="w-full"
              >
                구독 취소
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing && <Spinner size="sm" />}
              {isProcessing
                ? '처리 중...'
                : `${selectedPlan?.name} 구독하기 - ${selectedPlan ? (selectedPlan.price / 1000).toLocaleString() : 0}원`}
            </Button>
          )}
        </div>

        {/* 취소 확인 모달 */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                구독을 취소하시겠어요?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                구독을 취소하면 남은 기간의 혜택을 더 이상 이용할 수 없습니다.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1"
                >
                  계속 구독
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? '취소 중...' : '취소하기'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

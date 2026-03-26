'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Toggle, Spinner } from '@/components/atoms';
import { gql } from '@/lib/graphql-client';
import { CREATE_EPISODE_MUTATION, PUBLISH_EPISODE_MUTATION } from '@/lib/graphql-queries';
import { useAuthStore } from '@/stores/auth.store';

export default function NewEpisodePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const novelId = params.id as string;

  const [episodeTitle, setEpisodeTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = content.length;
  const isValidLength = charCount >= 500 && charCount <= 50000;

  const handleAITool = (toolName: string) => {
    alert(`AI ${toolName} 기능은 준비중입니다. (Mock)`);
  };

  const handleSaveDraft = async () => {
    if (!episodeTitle.trim()) {
      alert('회차 제목을 입력해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await gql<{ createEpisode: { id: string; episodeNumber: number } }>(
        CREATE_EPISODE_MUTATION,
        {
          input: {
            novelId,
            title: episodeTitle,
            content,
            isFree,
            price: !isFree ? parseInt(price) : 0,
            status: 'DRAFT',
          },
        }
      );

      if (result.createEpisode) {
        alert('임시저장되었습니다.');
      }
    } catch (error) {
      console.error('Failed to save episode:', error);
      alert('에피소드 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!episodeTitle.trim()) {
      alert('회차 제목을 입력해주세요.');
      return;
    }
    if (!isValidLength) {
      alert('본문은 500자 이상 50,000자 이하여야 합니다.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 먼저 에피소드 생성
      const createResult = await gql<{ createEpisode: { id: string; episodeNumber: number } }>(
        CREATE_EPISODE_MUTATION,
        {
          input: {
            novelId,
            title: episodeTitle,
            content,
            isFree,
            price: !isFree ? parseInt(price) : 0,
            status: 'DRAFT',
          },
        }
      );

      if (createResult.createEpisode?.id) {
        // 이후 발행
        const publishResult = await gql<{ publishEpisode: { id: string; status: string } }>(
          PUBLISH_EPISODE_MUTATION,
          { id: createResult.createEpisode.id }
        );

        if (publishResult.publishEpisode) {
          alert('회차가 발행되었습니다!');
          router.back();
        }
      }
    } catch (error) {
      console.error('Failed to publish episode:', error);
      alert('에피소드 발행에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          새 회차 작성
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Main Editor Area */}
        <div className="flex-1 min-w-0">
          {/* Episode Title */}
          <div className="mb-4">
            <Input
              label="회차 제목"
              placeholder="예: 제1화 - 시작"
              value={episodeTitle}
              onChange={(e) => setEpisodeTitle(e.target.value)}
            />
          </div>

          {/* Pricing Toggle */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <Toggle
              label="무료 회차"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
            {!isFree && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="가격"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">코인</span>
              </div>
            )}
          </div>

          {/* Text Editor */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이야기를 시작하세요..."
              className={[
                'w-full min-h-[60vh] p-6 text-base leading-relaxed font-serif rounded-xl border transition-colors duration-150',
                'bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-400 dark:placeholder:text-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'border-gray-300 dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500',
                'resize-vertical',
              ].join(' ')}
            />

            {/* Character Counter */}
            <div className="flex items-center justify-between mt-2 px-1">
              <p
                className={[
                  'text-sm',
                  charCount === 0
                    ? 'text-gray-400'
                    : isValidLength
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400',
                ].join(' ')}
              >
                {charCount.toLocaleString()}자
                {charCount > 0 && !isValidLength && (
                  <span className="ml-1">
                    ({charCount < 500 ? `최소 500자 (${500 - charCount}자 부족)` : '최대 50,000자 초과'})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">500 ~ 50,000자</p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" /> 저장 중...
                </>
              ) : (
                '임시저장'
              )}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePublish}
              disabled={isSubmitting || !isValidLength}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" /> 발행 중...
                </>
              ) : (
                '발행하기'
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          {/* AI Tools */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              AI 창작 도구
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleAITool('문장 다듬기')}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <span className="text-lg">✨</span>
                문장 다듬기
              </button>
              <button
                onClick={() => handleAITool('이어쓰기 제안')}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <span className="text-lg">📝</span>
                이어쓰기 제안
              </button>
              <button
                onClick={() => handleAITool('캐릭터 대사 생성')}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <span className="text-lg">💬</span>
                캐릭터 대사 생성
              </button>
            </div>
          </div>

          {/* Publish Options */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              발행 옵션
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>유형</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {isFree ? '무료' : `유료 (${price}코인)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>글자수</span>
                <span
                  className={`font-medium ${isValidLength ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  {charCount.toLocaleString()}자
                </span>
              </div>
              <div className="flex justify-between">
                <span>상태</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  작성중
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

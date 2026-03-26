'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Select, Toggle, Spinner } from '@/components/atoms';
import { GENRES } from '@/lib/mock-data';
import { gql } from '@/lib/graphql-client';
import { GENRES_QUERY, CREATE_NOVEL_MUTATION } from '@/lib/graphql-queries';
import { useAuthStore } from '@/stores/auth.store';

export default function NewNovelPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAdult, setIsAdult] = useState(false);
  const [genres, setGenres] = useState(GENRES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(true);

  // 장르 데이터 조회
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const result = await gql<{ genres: typeof GENRES }>(GENRES_QUERY);
        if (result.genres) {
          setGenres(result.genres);
        }
      } catch (error) {
        console.error('Failed to fetch genres:', error);
        // Fallback to mock data
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  const genreOptions = [
    { value: '', label: '장르를 선택하세요' },
    ...genres.map((g) => ({ value: g.id, label: g.name })),
  ];

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !genre) {
      alert('제목과 장르를 입력해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await gql<{ createNovel: { id: string; title: string; status: string } }>(
        CREATE_NOVEL_MUTATION,
        {
          input: {
            title,
            synopsis,
            genreId: genre,
            tags,
            isAdultOnly: isAdult,
            status: 'DRAFT',
          },
        }
      );

      if (result.createNovel) {
        alert('소설이 임시저장되었습니다.');
      }
    } catch (error) {
      console.error('Failed to save novel:', error);
      alert('소설 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !genre) {
      alert('제목과 장르를 입력해주세요.');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await gql<{ createNovel: { id: string; title: string; status: string } }>(
        CREATE_NOVEL_MUTATION,
        {
          input: {
            title,
            synopsis,
            genreId: genre,
            tags,
            isAdultOnly: isAdult,
            status: 'PUBLISHED',
          },
        }
      );

      if (result.createNovel) {
        alert('소설 연재가 시작되었습니다!');
        router.push('/author/novels');
      }
    } catch (error) {
      console.error('Failed to publish novel:', error);
      alert('소설 연재 시작에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingGenres) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          새 소설 만들기
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          새로운 이야기를 시작해보세요
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <Input
          label="제목"
          placeholder="소설 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Synopsis */}
        <Textarea
          label="시놉시스"
          placeholder="소설의 줄거리를 간략하게 소개해주세요"
          rows={5}
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          hint="독자가 소설을 선택할 때 참고하는 핵심 소개글입니다."
        />

        {/* Genre */}
        <Select
          label="장르"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          options={genreOptions}
        />

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            태그
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="태그 입력 후 Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={handleAddTag}
            >
              추가
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            최대 10개까지 추가할 수 있습니다. ({tags.length}/10)
          </p>
        </div>

        {/* Adult Content */}
        <Toggle
          label="성인 콘텐츠 여부"
          checked={isAdult}
          onChange={(e) => setIsAdult(e.target.checked)}
        />

        {/* Cover Upload UI */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            표지 이미지
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg
                className="w-10 h-10 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              클릭하여 표지 이미지를 업로드하세요
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              권장 크기: 600x900px / JPG, PNG (최대 5MB)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSave}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" /> 연재 중...
              </>
            ) : (
              '연재 시작'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { SearchInput, NovelGrid, RankingList } from '@/components';
import { Button } from '@/components/atoms';
import {
  MOCK_TRENDING,
  MOCK_NEW_RELEASES,
  MOCK_FANTASY_NOVELS,
  MOCK_ROMANCE_NOVELS,
  MOCK_MARTIAL_ARTS_NOVELS,
  MOCK_MODERN_NOVELS,
  MOCK_SF_NOVELS,
} from '@/lib/mock-data';

const GENRES = [
  { id: 'fantasy', label: '판타지', novels: MOCK_FANTASY_NOVELS },
  { id: 'romance', label: '로맨스', novels: MOCK_ROMANCE_NOVELS },
  { id: 'martial', label: '무협', novels: MOCK_MARTIAL_ARTS_NOVELS },
  { id: 'modern', label: '현대', novels: MOCK_MODERN_NOVELS },
  { id: 'sf', label: 'SF', novels: MOCK_SF_NOVELS },
];

function HeroSection() {
  return (
    <section className="relative">
      <div className="bg-gradient-to-br from-primary-500 via-primary-400 to-purple-500 rounded-2xl px-6 py-16 sm:px-12 sm:py-24 text-white overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            당신의 이야기를 만나세요
          </h1>

          <p className="text-lg sm:text-xl mb-8 opacity-90">
            작가와 독자가 함께 만들어가는 새로운 연재 경험.
          </p>

          {/* 검색 입력 */}
          <div className="mb-8">
            <SearchInput
              placeholder="소설 제목, 작가명으로 검색하세요..."
              className="[&_input]:bg-white [&_input]:text-gray-900"
            />
          </div>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary">
              소설 둘러보기
            </Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/20">
              작가로 참가하기
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrendingSection() {
  return <RankingList entries={MOCK_TRENDING} title="실시간 인기 소설" />;
}

function NewReleasesSection() {
  return (
    <NovelGrid novels={MOCK_NEW_RELEASES} title="신작 추천" moreLink="/novels?sort=recent" />
  );
}

function GenreSection() {
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">장르별 추천</h2>

      {/* 장르 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            onClick={() => setSelectedGenre(genre)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
              selectedGenre.id === genre.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {genre.label}
          </button>
        ))}
      </div>

      {/* 장르별 소설 그리드 */}
      <NovelGrid
        novels={selectedGenre.novels}
        title=""
        moreLink={`/novels?genre=${selectedGenre.id}`}
      />
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-12 py-4">
      <HeroSection />
      <TrendingSection />
      <NewReleasesSection />
      <GenreSection />
    </div>
  );
}

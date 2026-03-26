import Link from 'next/link';
import { NovelCard, type NovelCardProps } from '@/components/molecules';

export interface NovelGridProps {
  novels: NovelCardProps[];
  title: string;
  moreLink?: string;
}

export function NovelGrid({ novels, title, moreLink }: NovelGridProps) {
  return (
    <section className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {moreLink && (
          <Link
            href={moreLink}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            더보기 &gt;
          </Link>
        )}
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {novels.map((novel) => (
          <NovelCard key={novel.id} {...novel} />
        ))}
      </div>
    </section>
  );
}

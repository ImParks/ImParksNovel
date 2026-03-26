import Link from 'next/link';
import Image from 'next/image';
import { type NovelCardProps } from '@/components/molecules';

export interface RankingListProps {
  entries: Array<{
    rank: number;
    rankChange?: number;
    novel: NovelCardProps;
  }>;
  title: string;
}

const medalColors: Record<number, { bg: string; text: string; ring: string }> = {
  1: { bg: 'bg-yellow-100', text: 'text-yellow-900', ring: 'ring-yellow-300' },
  2: { bg: 'bg-gray-100', text: 'text-gray-900', ring: 'ring-gray-300' },
  3: { bg: 'bg-orange-100', text: 'text-orange-900', ring: 'ring-orange-300' },
};


export function RankingList({ entries, title }: RankingListProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>

      <div className="space-y-2">
        {entries.map(({ rank, rankChange, novel }) => {
          const medalColor = medalColors[rank];
          return (
            <Link key={novel.id} href={`/novel/${novel.id}`} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                {/* 순위 번호 */}
                <span
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                    medalColor
                      ? `${medalColor.bg} ${medalColor.text} ring-2 ${medalColor.ring}`
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {rank}
                </span>

                {/* 커버 이미지 (작은 버전) */}
                <span className="flex-shrink-0 relative w-10 h-14 rounded overflow-hidden block shadow-sm">
                  {novel.coverImageUrl ? (
                    <Image
                      src={novel.coverImageUrl}
                      alt={novel.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="w-full h-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center block">
                      <span className="text-white text-lg font-bold">{novel.title.charAt(0)}</span>
                    </span>
                  )}
                </span>

                {/* 제목/작가 정보 */}
                <span className="flex-1 min-w-0">
                  <span className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors block">
                    {novel.title}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">{novel.authorName}</span>
                </span>

                {/* 순위 변동 */}
                {rankChange !== undefined && rankChange !== 0 && (
                  <span className="flex-shrink-0 flex items-center gap-1">
                    {rankChange > 0 ? (
                      <>
                        <span className="text-red-500 font-semibold text-sm">↑</span>
                        <span className="text-red-500 text-xs font-semibold">{rankChange}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-blue-500 font-semibold text-sm">↓</span>
                        <span className="text-blue-500 text-xs font-semibold">{Math.abs(rankChange)}</span>
                      </>
                    )}
                  </span>
                )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

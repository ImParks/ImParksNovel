import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/atoms';

export interface NovelCardProps {
  id: string;
  title: string;
  authorName: string;
  coverImageUrl?: string;
  genreName: string;
  tags?: string[];
  totalEpisodes: number;
  totalViews: number;
  status: string;
}

const genreGradients: Record<string, string> = {
  판타지: 'from-purple-400 to-pink-400',
  로맨스: 'from-pink-300 to-red-400',
  무협: 'from-orange-400 to-yellow-400',
  현대: 'from-blue-400 to-cyan-400',
  SF: 'from-cyan-400 to-blue-500',
  미스터리: 'from-gray-500 to-gray-700',
  공포: 'from-red-600 to-purple-700',
  드라마: 'from-indigo-400 to-purple-400',
};

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  ONGOING: 'warning',
  COMPLETED: 'success',
  HIATUS: 'info',
  COMPLETED_SERIES: 'success',
};

const statusLabel: Record<string, string> = {
  ONGOING: '연재중',
  COMPLETED: '완결',
  HIATUS: '휴재',
  COMPLETED_SERIES: '완결',
};

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

export function NovelCard({
  id,
  title,
  authorName,
  coverImageUrl,
  genreName,
  totalEpisodes,
  totalViews,
  status,
}: NovelCardProps) {
  const gradientClass = genreGradients[genreName] || 'from-gray-400 to-gray-500';
  const statusVariant = statusBadgeVariant[status] || 'default';
  const statusText = statusLabel[status] || status;

  return (
    <Link href={`/novel/${id}`}>
      <div className="group cursor-pointer flex flex-col gap-2 h-full">
        {/* 커버 이미지 */}
        <div className="relative overflow-hidden rounded-lg flex-shrink-0 shadow-md hover:shadow-xl transition-shadow">
          <div className={`aspect-[3/4] bg-gradient-to-br ${gradientClass} relative`}>
            {coverImageUrl ? (
              <Image
                src={coverImageUrl}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              /* 기본 표지 디자인 */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
                <div className="text-center space-y-3">
                  {/* 제목의 첫 글자 크게 */}
                  <div className="text-6xl sm:text-7xl font-bold drop-shadow-lg">
                    {title.charAt(0)}
                  </div>
                  {/* 장르명 */}
                  <div className="text-sm font-medium opacity-80 uppercase tracking-wider">
                    {genreName}
                  </div>
                </div>
                {/* 장식 요소 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            {/* 장르 Badge - 좌상단 */}
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="info" size="sm" className="bg-black/40 text-white border-0 backdrop-blur-sm">
                {genreName}
              </Badge>
            </div>

            {/* 상태 Badge - 우상단 */}
            <div className="absolute top-2 right-2 z-10">
              <Badge variant={statusVariant} size="sm" className="backdrop-blur-sm">
                {statusText}
              </Badge>
            </div>
          </div>
        </div>

        {/* 제목 */}
        <h3 className="font-bold text-sm line-clamp-1 text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
          {title}
        </h3>

        {/* 작가명 */}
        <p className="text-xs text-gray-500 dark:text-gray-400">{authorName}</p>

        {/* 하단 정보 */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto">
          총 {totalEpisodes}화 · 조회 {formatNumber(totalViews)}
        </p>
      </div>
    </Link>
  );
}

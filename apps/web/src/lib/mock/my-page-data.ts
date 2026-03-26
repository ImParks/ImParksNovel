// Mock data for my page (user's bookshelf, purchases, etc.)

export interface NovelInLibrary {
  id: string;
  title: string;
  authorName: string;
  coverImageUrl?: string;
  genreName: string;
  totalEpisodes: number;
  status: string;
  lastReadEpisode?: number;
  bookmarkedCount?: number;
  newEpisodesCount?: number;
}

export interface PurchaseHistory {
  id: string;
  novelTitle: string;
  episodeTitle?: string;
  purchaseType: 'own' | 'rent';
  cost: number;
  date: string;
  expiryDate?: string; // For rental
}

export interface CoinHistory {
  id: string;
  date: string;
  type: 'charge' | 'use' | 'refund';
  amount: number;
  balance: number;
  description: string;
}

export interface MembershipInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  status: 'active' | 'expired';
  startDate: string;
  endDate: string;
  benefits: string[];
}

// Recently read novels
export function getRecentlyRead(): NovelInLibrary[] {
  return [
    {
      id: 'novel_001',
      title: '그 남자의 정체',
      authorName: '작가_이름',
      coverImageUrl: undefined,
      genreName: '로맨스',
      totalEpisodes: 120,
      status: 'ONGOING',
      lastReadEpisode: 45,
    },
    {
      id: 'novel_002',
      title: '용사가 되지 않겠습니다',
      authorName: '신작가',
      coverImageUrl: undefined,
      genreName: '판타지',
      totalEpisodes: 200,
      status: 'ONGOING',
      lastReadEpisode: 12,
    },
    {
      id: 'novel_003',
      title: '죽음 그 이후의 세계',
      authorName: '김작가',
      coverImageUrl: undefined,
      genreName: 'SF',
      totalEpisodes: 87,
      status: 'COMPLETED',
      lastReadEpisode: 87,
    },
  ];
}

// Bookmarked novels
export function getBookmarked(): NovelInLibrary[] {
  return [
    {
      id: 'novel_004',
      title: '너는 나의 운명',
      authorName: '로맨스작가',
      coverImageUrl: undefined,
      genreName: '로맨스',
      totalEpisodes: 150,
      status: 'ONGOING',
      bookmarkedCount: 3,
      newEpisodesCount: 2,
    },
    {
      id: 'novel_005',
      title: '마법사의 수제자',
      authorName: '판타지작가',
      coverImageUrl: undefined,
      genreName: '판타지',
      totalEpisodes: 256,
      status: 'ONGOING',
      bookmarkedCount: 1,
      newEpisodesCount: 5,
    },
  ];
}

// Favorite novels (관심 목록)
export function getFavorites(): NovelInLibrary[] {
  return [
    {
      id: 'novel_006',
      title: '무협 최강자',
      authorName: '무협작가',
      coverImageUrl: undefined,
      genreName: '무협',
      totalEpisodes: 300,
      status: 'ONGOING',
    },
    {
      id: 'novel_007',
      title: '현대판 신화',
      authorName: '이름작가',
      coverImageUrl: undefined,
      genreName: '판타지',
      totalEpisodes: 180,
      status: 'COMPLETED',
    },
  ];
}

// Purchased novels
export function getPurchased(): NovelInLibrary[] {
  return [
    {
      id: 'novel_008',
      title: '소녀, 너를 만났다',
      authorName: '이영미',
      coverImageUrl: undefined,
      genreName: '드라마',
      totalEpisodes: 100,
      status: 'COMPLETED',
    },
    {
      id: 'novel_009',
      title: '검의 왕',
      authorName: '황성진',
      coverImageUrl: undefined,
      genreName: '무협',
      totalEpisodes: 250,
      status: 'ONGOING',
    },
  ];
}

// Purchase history
export function getPurchaseHistory(): PurchaseHistory[] {
  return [
    {
      id: 'purchase_001',
      novelTitle: '그 남자의 정체',
      episodeTitle: '45화 - 숨겨진 진실',
      purchaseType: 'own',
      cost: 100,
      date: '2026-03-20',
    },
    {
      id: 'purchase_002',
      novelTitle: '용사가 되지 않겠습니다',
      episodeTitle: '12화 - 새로운 시작',
      purchaseType: 'rent',
      cost: 50,
      date: '2026-03-18',
      expiryDate: '2026-04-18',
    },
    {
      id: 'purchase_003',
      novelTitle: '죽음 그 이후의 세계',
      episodeTitle: '전편 구매 (Season Pass)',
      purchaseType: 'own',
      cost: 2500,
      date: '2026-03-10',
    },
    {
      id: 'purchase_004',
      novelTitle: '너는 나의 운명',
      episodeTitle: '50-100화 구매권',
      purchaseType: 'rent',
      cost: 800,
      date: '2026-02-25',
      expiryDate: '2026-03-25',
    },
  ];
}

// Coin history
export function getCoinHistory(): CoinHistory[] {
  return [
    {
      id: 'coin_001',
      date: '2026-03-22',
      type: 'charge',
      amount: 5000,
      balance: 8500,
      description: '코인 충전 (신용카드)',
    },
    {
      id: 'coin_002',
      date: '2026-03-20',
      type: 'use',
      amount: -100,
      balance: 3500,
      description: '그 남자의 정체 - 45화 구매',
    },
    {
      id: 'coin_003',
      date: '2026-03-18',
      type: 'use',
      amount: -50,
      balance: 3600,
      description: '용사가 되지 않겠습니다 - 12화 렌탈',
    },
    {
      id: 'coin_004',
      date: '2026-03-15',
      type: 'charge',
      amount: 10000,
      balance: 3650,
      description: '코인 충전 (구글 플레이)',
    },
    {
      id: 'coin_005',
      date: '2026-03-10',
      type: 'use',
      amount: -2500,
      balance: -6350,
      description: '죽음 그 이후의 세계 - Season Pass',
    },
    {
      id: 'coin_006',
      date: '2026-03-01',
      type: 'charge',
      amount: 1000,
      balance: -3850,
      description: '이벤트 보너스',
    },
  ];
}

// Current membership
export function getCurrentMembership(): MembershipInfo | null {
  return {
    id: 'membership_001',
    name: '프리미엄 멤버',
    monthlyPrice: 9900,
    status: 'active',
    startDate: '2026-02-22',
    endDate: '2026-04-22',
    benefits: [
      '전체 에피소드 무제한 읽기',
      '신작 우선 열람',
      '광고 제거',
      '월 3회 무료 코인',
    ],
  };
}

// Membership history
export function getMembershipHistory(): MembershipInfo[] {
  return [
    {
      id: 'membership_001',
      name: '프리미엄 멤버',
      monthlyPrice: 9900,
      status: 'active',
      startDate: '2026-02-22',
      endDate: '2026-04-22',
      benefits: [
        '전체 에피소드 무제한 읽기',
        '신작 우선 열람',
        '광고 제거',
        '월 3회 무료 코인',
      ],
    },
    {
      id: 'membership_002',
      name: '프리미엄 멤버',
      monthlyPrice: 9900,
      status: 'expired',
      startDate: '2026-01-22',
      endDate: '2026-02-22',
      benefits: [
        '전체 에피소드 무제한 읽기',
        '신작 우선 열람',
        '광고 제거',
        '월 3회 무료 코인',
      ],
    },
  ];
}

// Update user profile (mock)
export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  isAuthor?: boolean;
  authorName?: string;
  authorBio?: string;
}

export function getCurrentUserProfile(): UserProfile {
  return {
    id: 'user_current',
    nickname: '판타지러버',
    email: 'user@example.com',
    avatarUrl: undefined,
    bio: '소설을 사랑하는 일반 사용자입니다.',
    isAuthor: false,
  };
}

// Notification settings (mock)
export interface NotificationSettings {
  newEpisodeNotification: boolean;
  commentNotification: boolean;
  supportNotification: boolean;
  promotionNotification: boolean;
}

export function getNotificationSettings(): NotificationSettings {
  return {
    newEpisodeNotification: true,
    commentNotification: true,
    supportNotification: false,
    promotionNotification: true,
  };
}

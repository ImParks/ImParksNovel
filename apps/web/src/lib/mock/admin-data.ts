// Mock data for admin pages

export interface DashboardStats {
  pendingReports: number;
  newSignups: number;
  newNovels: number;
  dailySales: number;
  activeUsers: number;
}

export interface Report {
  id: string;
  targetType: 'novel' | 'episode' | 'comment' | 'user';
  targetTitle: string;
  targetContent: string;
  reason: string;
  reportedBy: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
  adminNotes?: string;
}

export interface User {
  id: string;
  nickname: string;
  email: string;
  role: 'READER' | 'AUTHOR' | 'ADMIN';
  status: 'active' | 'suspended' | 'withdrawn';
  joinedAt: string;
  novelCount: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'service' | 'maintenance' | 'update';
  status: 'published' | 'draft';
  isPinned: boolean;
  createdAt: string;
}

// Dashboard Stats
export function getDashboardStats(): DashboardStats {
  return {
    pendingReports: 12,
    newSignups: 45,
    newNovels: 8,
    dailySales: 1250000,
    activeUsers: 3240,
  };
}

// Reports
export function getReports(limit?: number): Report[] {
  const reports: Report[] = [
    {
      id: 'rep_001',
      targetType: 'comment',
      targetTitle: '욕설 및 비난 댓글',
      targetContent: '이 소설은 너무 형편해... 작가는 왜 이따위로 쓰냐',
      reason: '욕설 및 혐오',
      reportedBy: '익명_12345',
      status: 'pending',
      createdAt: '2026-03-22T10:30:00Z',
    },
    {
      id: 'rep_002',
      targetType: 'novel',
      targetTitle: '불법 콘텐츠 소설',
      targetContent: '실제 개인 정보를 노출한 내용',
      reason: '개인정보 노출',
      reportedBy: '사용자_789',
      status: 'pending',
      createdAt: '2026-03-22T09:15:00Z',
    },
    {
      id: 'rep_003',
      targetType: 'user',
      targetTitle: '스팸 계정',
      targetContent: '계정: spam_user_001',
      reason: '스팸 활동',
      reportedBy: '관리자',
      status: 'resolved',
      createdAt: '2026-03-21T16:45:00Z',
      adminNotes: '계정 정지 처리 완료',
    },
    {
      id: 'rep_004',
      targetType: 'episode',
      targetTitle: '저작권 침해 회차',
      targetContent: '다른 작가의 소설 복사본',
      reason: '저작권 침해',
      reportedBy: '작가_kim',
      status: 'resolved',
      createdAt: '2026-03-20T14:20:00Z',
      adminNotes: '콘텐츠 삭제 완료',
    },
    {
      id: 'rep_005',
      targetType: 'comment',
      targetTitle: '광고성 댓글',
      targetContent: '이 사이트에서 더 좋은 소설을 읽어보세요: [링크]',
      reason: '광고 및 스팸',
      reportedBy: '사용자_456',
      status: 'rejected',
      createdAt: '2026-03-19T11:00:00Z',
      adminNotes: '자동 필터링됨 - 거짓 신고',
    },
  ];

  return limit ? reports.slice(0, limit) : reports;
}

// Users
export function getUsers(limit?: number): User[] {
  const users: User[] = [
    {
      id: 'user_001',
      nickname: '판타지_러버',
      email: 'fantasy@example.com',
      role: 'READER',
      status: 'active',
      joinedAt: '2026-01-15',
      novelCount: 0,
    },
    {
      id: 'user_002',
      nickname: '신진작가_이름',
      email: 'author1@example.com',
      role: 'AUTHOR',
      status: 'active',
      joinedAt: '2026-02-20',
      novelCount: 2,
    },
    {
      id: 'user_003',
      nickname: '로맨스_애호가',
      email: 'romance@example.com',
      role: 'READER',
      status: 'suspended',
      joinedAt: '2026-01-10',
      novelCount: 0,
    },
    {
      id: 'user_004',
      nickname: '유명작가',
      email: 'famous@example.com',
      role: 'AUTHOR',
      status: 'active',
      joinedAt: '2025-12-01',
      novelCount: 15,
    },
    {
      id: 'user_005',
      nickname: '탈퇴한_사용자',
      email: 'withdrawn@example.com',
      role: 'READER',
      status: 'withdrawn',
      joinedAt: '2025-11-20',
      novelCount: 0,
    },
    {
      id: 'user_006',
      nickname: '웹소설_마니아',
      email: 'webnovel@example.com',
      role: 'READER',
      status: 'active',
      joinedAt: '2026-03-01',
      novelCount: 0,
    },
    {
      id: 'user_007',
      nickname: '신작가_김',
      email: 'author2@example.com',
      role: 'AUTHOR',
      status: 'active',
      joinedAt: '2026-03-10',
      novelCount: 1,
    },
    {
      id: 'user_008',
      nickname: '장르_평론가',
      email: 'critic@example.com',
      role: 'READER',
      status: 'active',
      joinedAt: '2026-02-15',
      novelCount: 0,
    },
  ];

  return limit ? users.slice(0, limit) : users;
}

// Notices
export function getNotices(): Notice[] {
  const notices: Notice[] = [
    {
      id: 'notice_001',
      title: '서비스 점검 안내',
      content: '3월 24일 오후 2시~4시 서비스 점검이 예정되어 있습니다.',
      category: 'maintenance',
      status: 'published',
      isPinned: true,
      createdAt: '2026-03-22',
    },
    {
      id: 'notice_002',
      title: '새로운 결제 수단 추가',
      content: '카카오페이 결제가 추가되었습니다.',
      category: 'update',
      status: 'published',
      isPinned: false,
      createdAt: '2026-03-20',
    },
    {
      id: 'notice_003',
      title: '3월 신작가 모집 공고',
      content: '바이브코딩에서 신작가를 모집합니다. 자세한 내용은 공식 블로그를 확인해주세요.',
      category: 'service',
      status: 'published',
      isPinned: false,
      createdAt: '2026-03-15',
    },
    {
      id: 'notice_004',
      title: '커뮤니티 이용 규칙 변경',
      content: '더욱 건강한 커뮤니티를 위해 이용 규칙을 업데이트했습니다.',
      category: 'general',
      status: 'draft',
      isPinned: false,
      createdAt: '2026-03-18',
    },
  ];

  return notices;
}

// Add new report (mock)
export function createReport(data: Omit<Report, 'id' | 'createdAt'>): Report {
  return {
    ...data,
    id: `rep_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
}

// Update report (mock)
export function updateReport(id: string, updates: Partial<Report>): Report | null {
  const reports = getReports();
  const report = reports.find((r) => r.id === id);
  if (report) {
    return { ...report, ...updates };
  }
  return null;
}

// Create notice (mock)
export function createNotice(data: Omit<Notice, 'id' | 'createdAt'>): Notice {
  return {
    ...data,
    id: `notice_${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
  };
}

// Update notice (mock)
export function updateNotice(id: string, updates: Partial<Notice>): Notice | null {
  const notices = getNotices();
  const notice = notices.find((n) => n.id === id);
  if (notice) {
    return { ...notice, ...updates };
  }
  return null;
}

// Domain enums (Prisma 스키마와 동기화)
export enum UserRole {
  READER = 'READER',
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum NovelStatus {
  DRAFT = 'DRAFT',
  SERIALIZING = 'SERIALIZING',
  HIATUS = 'HIATUS',
  COMPLETED = 'COMPLETED',
  HIDDEN = 'HIDDEN',
}

export enum EpisodeStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
}

export enum MembershipTier {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// Common types
export interface PaginationInput {
  first?: number;
  after?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

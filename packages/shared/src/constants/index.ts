// Episode constraints
export const EPISODE_MIN_LENGTH = 500;
export const EPISODE_MAX_LENGTH = 50_000;
export const EPISODE_PREVIEW_LENGTH = 200;

// Coin pricing
export const COIN_MIN_PRICE = 1;
export const COIN_MAX_PRICE = 10;

// Free episodes required before paid
export const FREE_EPISODES_REQUIRED = 3;

// Upload limits
export const MAX_UPLOAD_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Comment limits
export const MAX_COMMENT_DEPTH = 2;

// Rental durations (days)
export const RENTAL_DURATIONS = [3, 7, 14] as const;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('READER', 'AUTHOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SocialProvider" AS ENUM ('GOOGLE', 'KAKAO', 'NAVER');

-- CreateEnum
CREATE TYPE "NovelStatus" AS ENUM ('DRAFT', 'SERIALIZING', 'HIATUS', 'COMPLETED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "EpisodeStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SerializationType" AS ENUM ('DAILY', 'SPECIFIC_DAYS', 'WEEKLY_COUNT', 'BIWEEKLY', 'MONTHLY_COUNT', 'IRREGULAR');

-- CreateEnum
CREATE TYPE "SerializationMarkType" AS ENUM ('DELAYED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AIFeatureType" AS ENUM ('CONTINUE_WRITING', 'IMPROVE_SENTENCE', 'GENERATE_SETTING', 'SUGGEST_PLOT', 'GENERATE_DIALOGUE', 'ANALYZE_STYLE', 'DETECT_ERROR', 'SUMMARIZE');

-- CreateEnum
CREATE TYPE "AITokenTransactionType" AS ENUM ('CHARGE', 'USE', 'REFUND', 'BONUS', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('CHARGE', 'PURCHASE', 'REFUND', 'BONUS', 'SUPPORT_SENT', 'SUPPORT_RECEIVED', 'MEMBERSHIP', 'GIFT_SENT', 'GIFT_RECEIVED');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('OWNERSHIP', 'RENTAL_3D', 'RENTAL_7D', 'RENTAL_14D');

-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('BASIC', 'PREMIUM', 'VIP');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'PHONE', 'TRANSFER', 'VIRTUAL_ACCOUNT');

-- CreateEnum
CREATE TYPE "LikeTargetType" AS ENUM ('NOVEL', 'EPISODE', 'COMMENT');

-- CreateEnum
CREATE TYPE "DislikeTargetType" AS ENUM ('NOVEL', 'EPISODE');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('NOVEL', 'EPISODE', 'COMMENT', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('WARNING', 'SUSPEND_1D', 'SUSPEND_7D', 'SUSPEND_30D', 'PERMANENT_BAN', 'CONTENT_HIDE', 'CONTENT_DELETE', 'BADGE_GRANT', 'BADGE_REVOKE', 'RESTORE');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('EVENT_WINNER', 'CONTEST_WINNER', 'FEATURED_AUTHOR', 'FEATURED_NOVEL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_EPISODE', 'COMMENT_REPLY', 'SUPPORT', 'SYSTEM', 'SETTLEMENT', 'SERIALIZATION_CHANGE', 'BADGE');

-- CreateEnum
CREATE TYPE "RankingType" AS ENUM ('GENRE', 'REALTIME', 'NEW_RELEASE', 'COMPLETED', 'SUPPORT');

-- CreateEnum
CREATE TYPE "RankingPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "targetRoles" "UserRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" "AdminActionType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "suspendUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "customName" TEXT,
    "customIcon" TEXT,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT NOT NULL,
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerImageUrl" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "conditions" JSONB,
    "rewards" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "rewardDetails" JSONB,
    "grantedAt" TIMESTAMP(3),

    CONSTRAINT "event_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popup_notices" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "showOnce" BOOLEAN NOT NULL DEFAULT false,
    "showInterval" INTEGER,
    "targetRoles" "UserRole"[],
    "targetPages" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popup_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_token_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalCharged" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_token_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_token_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AITokenTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "paymentId" TEXT,
    "generationLogId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_token_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT,
    "episodeId" TEXT,
    "featureType" "AIFeatureType" NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "tokensCharged" INTEGER NOT NULL,
    "inputText" TEXT,
    "outputText" TEXT,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "request" JSONB,
    "response" JSONB,
    "modelId" TEXT,
    "wasAccepted" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novel_settings" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerationLogId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novel_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_summaries" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "basicSummary" TEXT,
    "detailedSummary" TEXT,
    "characters" JSONB,
    "plotPoints" JSONB,
    "foreshadowing" JSONB,
    "aiGenerationLogId" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "hiddenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "notifyNewEpisode" BOOLEAN NOT NULL DEFAULT true,
    "folderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmark_folders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmark_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "lastEpisodeId" TEXT NOT NULL,
    "lastEpisodeNumber" INTEGER NOT NULL,
    "scrollPosition" DOUBLE PRECISION,
    "lastReadAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "LikeTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dislikes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "DislikeTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dislikes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "view_counts" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "view_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "rankingType" "RankingType" NOT NULL,
    "period" "RankingPeriod" NOT NULL,
    "genreId" TEXT,
    "rank" INTEGER NOT NULL,
    "novelId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "supportAmount" INTEGER NOT NULL DEFAULT 0,
    "previousRank" INTEGER,
    "rankChange" INTEGER,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_keywords" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER,
    "previousRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novel_share_links" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "sharerId" TEXT,
    "platform" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novel_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novels" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "genreId" TEXT NOT NULL,
    "tags" TEXT[],
    "status" "NovelStatus" NOT NULL DEFAULT 'DRAFT',
    "isAdultOnly" BOOLEAN NOT NULL DEFAULT false,
    "totalEpisodes" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalDislikes" INTEGER NOT NULL DEFAULT 0,
    "totalBookmarks" INTEGER NOT NULL DEFAULT 0,
    "totalFavorites" INTEGER NOT NULL DEFAULT 0,
    "totalSupports" INTEGER NOT NULL DEFAULT 0,
    "aiContributionRatio" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "novels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "status" "EpisodeStatus" NOT NULL DEFAULT 'DRAFT',
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "price" INTEGER,
    "aiContributionRatio" DOUBLE PRECISION,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "recommendCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_drafts" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT,
    "novelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncedFromDevice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novel_serialization_schedules" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "type" "SerializationType" NOT NULL,
    "serialDays" TEXT[],
    "serialCount" INTEGER,
    "preferredTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novel_serialization_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novel_serialization_marks" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "markType" "SerializationMarkType" NOT NULL,
    "lastEpisodeAt" TIMESTAMP(3) NOT NULL,
    "daysOverdue" INTEGER NOT NULL,
    "consecutiveReleases" INTEGER NOT NULL DEFAULT 0,
    "lastReleaseAt" TIMESTAMP(3),
    "releaseConditionMet" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "novel_serialization_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "novel_polls" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novel_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalCharged" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "totalRefunded" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "paymentId" TEXT,
    "purchaseId" TEXT,
    "supportId" TEXT,
    "membershipId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "purchaseType" "PurchaseType" NOT NULL,
    "coinsSpent" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "upgradedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episode_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "MembershipTier" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "nextPaymentAt" TIMESTAMP(3),
    "lastBonusAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supports" (
    "id" TEXT NOT NULL,
    "supporterId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "novelId" TEXT,
    "coinsAmount" INTEGER NOT NULL,
    "message" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "episodeSalesAmount" INTEGER NOT NULL DEFAULT 0,
    "episodeSalesCount" INTEGER NOT NULL DEFAULT 0,
    "supportAmount" INTEGER NOT NULL DEFAULT 0,
    "supportCount" INTEGER NOT NULL DEFAULT 0,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "aiFee" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "bankName" TEXT,
    "bankAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pgProvider" TEXT NOT NULL DEFAULT 'TOSS_PAYMENTS',
    "pgPaymentKey" TEXT,
    "pgOrderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "productType" TEXT NOT NULL,
    "productId" TEXT,
    "pgResponse" JSONB,
    "refundedAmount" INTEGER,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_gifts" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isAdultOnly" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "nickname" TEXT NOT NULL,
    "nicknameChangedAt" TIMESTAMP(3),
    "profileImageUrl" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'READER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAdultVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "loginFailCount" INTEGER NOT NULL DEFAULT 0,
    "loginBlockedUntil" TIMESTAMP(3),
    "viewerSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identity_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "di" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "carrier" TEXT,
    "isAdult" BOOLEAN NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_identity_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorBio" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "accountHolder" TEXT,
    "taxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "author_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_isPublished_isPinned_publishedAt_idx" ON "announcements"("isPublished", "isPinned", "publishedAt");

-- CreateIndex
CREATE INDEX "admin_actions_adminId_idx" ON "admin_actions"("adminId");

-- CreateIndex
CREATE INDEX "admin_actions_targetType_targetId_idx" ON "admin_actions"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "admin_actions_actionType_idx" ON "admin_actions"("actionType");

-- CreateIndex
CREATE INDEX "admin_actions_createdAt_idx" ON "admin_actions"("createdAt");

-- CreateIndex
CREATE INDEX "user_badges_targetType_targetId_isActive_idx" ON "user_badges"("targetType", "targetId", "isActive");

-- CreateIndex
CREATE INDEX "user_badges_expiresAt_idx" ON "user_badges"("expiresAt");

-- CreateIndex
CREATE INDEX "events_isPublished_startAt_endAt_idx" ON "events"("isPublished", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "event_participations_userId_idx" ON "event_participations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_participations_eventId_userId_key" ON "event_participations"("eventId", "userId");

-- CreateIndex
CREATE INDEX "popup_notices_isActive_startAt_endAt_idx" ON "popup_notices"("isActive", "startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_token_wallets_userId_key" ON "ai_token_wallets"("userId");

-- CreateIndex
CREATE INDEX "ai_token_transactions_walletId_createdAt_idx" ON "ai_token_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_transactions_userId_createdAt_idx" ON "ai_token_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_token_transactions_type_idx" ON "ai_token_transactions"("type");

-- CreateIndex
CREATE INDEX "ai_generation_logs_userId_createdAt_idx" ON "ai_generation_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_generation_logs_novelId_idx" ON "ai_generation_logs"("novelId");

-- CreateIndex
CREATE INDEX "ai_generation_logs_featureType_idx" ON "ai_generation_logs"("featureType");

-- CreateIndex
CREATE INDEX "novel_settings_novelId_category_idx" ON "novel_settings"("novelId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "episode_summaries_episodeId_key" ON "episode_summaries"("episodeId");

-- CreateIndex
CREATE INDEX "comments_episodeId_deletedAt_createdAt_idx" ON "comments"("episodeId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "comments_episodeId_deletedAt_likeCount_idx" ON "comments"("episodeId", "deletedAt", "likeCount");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_novelId_key" ON "bookmarks"("userId", "novelId");

-- CreateIndex
CREATE INDEX "bookmark_folders_userId_idx" ON "bookmark_folders"("userId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_novelId_key" ON "favorites"("userId", "novelId");

-- CreateIndex
CREATE INDEX "reading_history_userId_lastReadAt_idx" ON "reading_history"("userId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "reading_history_userId_novelId_key" ON "reading_history"("userId", "novelId");

-- CreateIndex
CREATE INDEX "likes_targetType_targetId_idx" ON "likes"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_targetType_targetId_key" ON "likes"("userId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "dislikes_targetType_targetId_idx" ON "dislikes"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "dislikes_userId_targetType_targetId_key" ON "dislikes"("userId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "recommendations_episodeId_idx" ON "recommendations"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_userId_episodeId_key" ON "recommendations"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "reports_targetType_targetId_idx" ON "reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- CreateIndex
CREATE INDEX "view_counts_episodeId_viewedAt_idx" ON "view_counts"("episodeId", "viewedAt");

-- CreateIndex
CREATE INDEX "view_counts_userId_episodeId_idx" ON "view_counts"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "view_counts_ipAddress_episodeId_idx" ON "view_counts"("ipAddress", "episodeId");

-- CreateIndex
CREATE INDEX "rankings_rankingType_genreId_period_calculatedAt_idx" ON "rankings"("rankingType", "genreId", "period", "calculatedAt");

-- CreateIndex
CREATE INDEX "rankings_novelId_idx" ON "rankings"("novelId");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_rankingType_period_genreId_rank_key" ON "rankings"("rankingType", "period", "genreId", "rank");

-- CreateIndex
CREATE INDEX "search_keywords_period_periodStart_rank_idx" ON "search_keywords"("period", "periodStart", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "search_keywords_keyword_period_periodStart_key" ON "search_keywords"("keyword", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "novel_share_links_shareCode_key" ON "novel_share_links"("shareCode");

-- CreateIndex
CREATE INDEX "novel_share_links_novelId_idx" ON "novel_share_links"("novelId");

-- CreateIndex
CREATE INDEX "novel_share_links_sharerId_idx" ON "novel_share_links"("sharerId");

-- CreateIndex
CREATE INDEX "novel_share_links_platform_createdAt_idx" ON "novel_share_links"("platform", "createdAt");

-- CreateIndex
CREATE INDEX "novels_authorId_idx" ON "novels"("authorId");

-- CreateIndex
CREATE INDEX "novels_genreId_status_deletedAt_idx" ON "novels"("genreId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "novels_status_deletedAt_idx" ON "novels"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "novels_tags_idx" ON "novels" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "novels_createdAt_idx" ON "novels"("createdAt");

-- CreateIndex
CREATE INDEX "novels_totalViews_idx" ON "novels"("totalViews");

-- CreateIndex
CREATE INDEX "novels_totalLikes_idx" ON "novels"("totalLikes");

-- CreateIndex
CREATE INDEX "novels_totalBookmarks_idx" ON "novels"("totalBookmarks");

-- CreateIndex
CREATE INDEX "episodes_novelId_status_idx" ON "episodes"("novelId", "status");

-- CreateIndex
CREATE INDEX "episodes_novelId_publishedAt_idx" ON "episodes"("novelId", "publishedAt");

-- CreateIndex
CREATE INDEX "episodes_authorId_idx" ON "episodes"("authorId");

-- CreateIndex
CREATE INDEX "episodes_scheduledAt_idx" ON "episodes"("scheduledAt");

-- CreateIndex
CREATE INDEX "episodes_deletedAt_idx" ON "episodes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_novelId_episodeNumber_key" ON "episodes"("novelId", "episodeNumber");

-- CreateIndex
CREATE INDEX "episode_drafts_authorId_novelId_idx" ON "episode_drafts"("authorId", "novelId");

-- CreateIndex
CREATE INDEX "episode_drafts_updatedAt_idx" ON "episode_drafts"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "novel_serialization_schedules_novelId_key" ON "novel_serialization_schedules"("novelId");

-- CreateIndex
CREATE INDEX "novel_serialization_marks_novelId_isActive_idx" ON "novel_serialization_marks"("novelId", "isActive");

-- CreateIndex
CREATE INDEX "novel_serialization_marks_markType_isActive_idx" ON "novel_serialization_marks"("markType", "isActive");

-- CreateIndex
CREATE INDEX "novel_polls_novelId_idx" ON "novel_polls"("novelId");

-- CreateIndex
CREATE INDEX "novel_polls_authorId_idx" ON "novel_polls"("authorId");

-- CreateIndex
CREATE INDEX "poll_options_pollId_idx" ON "poll_options"("pollId");

-- CreateIndex
CREATE INDEX "poll_votes_optionId_idx" ON "poll_votes"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_pollId_userId_key" ON "poll_votes"("pollId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "coin_wallets_userId_key" ON "coin_wallets"("userId");

-- CreateIndex
CREATE INDEX "coin_transactions_walletId_createdAt_idx" ON "coin_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "coin_transactions_userId_createdAt_idx" ON "coin_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "coin_transactions_type_idx" ON "coin_transactions"("type");

-- CreateIndex
CREATE INDEX "episode_purchases_userId_idx" ON "episode_purchases"("userId");

-- CreateIndex
CREATE INDEX "episode_purchases_episodeId_idx" ON "episode_purchases"("episodeId");

-- CreateIndex
CREATE INDEX "episode_purchases_expiresAt_idx" ON "episode_purchases"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "episode_purchases_userId_episodeId_purchaseType_key" ON "episode_purchases"("userId", "episodeId", "purchaseType");

-- CreateIndex
CREATE INDEX "memberships_userId_status_idx" ON "memberships"("userId", "status");

-- CreateIndex
CREATE INDEX "memberships_expiresAt_idx" ON "memberships"("expiresAt");

-- CreateIndex
CREATE INDEX "supports_supporterId_idx" ON "supports"("supporterId");

-- CreateIndex
CREATE INDEX "supports_authorId_idx" ON "supports"("authorId");

-- CreateIndex
CREATE INDEX "supports_novelId_idx" ON "supports"("novelId");

-- CreateIndex
CREATE INDEX "supports_createdAt_idx" ON "supports"("createdAt");

-- CreateIndex
CREATE INDEX "settlements_authorId_status_idx" ON "settlements"("authorId", "status");

-- CreateIndex
CREATE INDEX "settlements_periodStart_periodEnd_idx" ON "settlements"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "payments_pgPaymentKey_key" ON "payments"("pgPaymentKey");

-- CreateIndex
CREATE UNIQUE INDEX "payments_pgOrderId_key" ON "payments"("pgOrderId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "coin_gifts_senderId_idx" ON "coin_gifts"("senderId");

-- CreateIndex
CREATE INDEX "coin_gifts_receiverId_idx" ON "coin_gifts"("receiverId");

-- CreateIndex
CREATE INDEX "coin_gifts_createdAt_idx" ON "coin_gifts"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_type_idx" ON "notifications"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE INDEX "genres_isActive_sortOrder_idx" ON "genres"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_useCount_idx" ON "tags"("useCount");

-- CreateIndex
CREATE INDEX "tags_isBanned_idx" ON "tags"("isBanned");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_nickname_idx" ON "users"("nickname");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_identity_verifications_userId_key" ON "user_identity_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_identity_verifications_ci_key" ON "user_identity_verifications"("ci");

-- CreateIndex
CREATE INDEX "user_identity_verifications_ci_idx" ON "user_identity_verifications"("ci");

-- CreateIndex
CREATE INDEX "user_social_accounts_userId_idx" ON "user_social_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_accounts_provider_providerUserId_key" ON "user_social_accounts"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "author_profiles_userId_key" ON "author_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "author_profiles_authorName_key" ON "author_profiles"("authorName");

-- CreateIndex
CREATE INDEX "author_profiles_authorName_idx" ON "author_profiles"("authorName");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_token_transactions" ADD CONSTRAINT "ai_token_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "ai_token_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novel_settings" ADD CONSTRAINT "novel_settings_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_summaries" ADD CONSTRAINT "episode_summaries_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "bookmark_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_drafts" ADD CONSTRAINT "episode_drafts_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novel_serialization_schedules" ADD CONSTRAINT "novel_serialization_schedules_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "novel_serialization_marks" ADD CONSTRAINT "novel_serialization_marks_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "novel_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "novel_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "coin_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_identity_verifications" ADD CONSTRAINT "user_identity_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_accounts" ADD CONSTRAINT "user_social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_profiles" ADD CONSTRAINT "author_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


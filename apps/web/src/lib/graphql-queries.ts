// GraphQL 쿼리 및 뮤테이션 정의

export const SIGN_IN_MUTATION = `
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        nickname
        role
      }
    }
  }
`;

export const SIGN_UP_MUTATION = `
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        nickname
        role
      }
    }
  }
`;

// ================================
// Discovery (홈/검색/랭킹)
// ================================

export const TRENDING_NOVELS_QUERY = `
  query TrendingNovels($limit: Int!) {
    trendingNovels(limit: $limit) {
      id
      title
      synopsis
      coverImageUrl
      authorName
      genreName
      tags
      status
      totalEpisodes
      totalViews
      totalLikes
      totalBookmarks
      isAdultOnly
      createdAt
    }
  }
`;

export const NEW_RELEASES_QUERY = `
  query NewReleases($genreId: ID, $limit: Int!) {
    newReleases(genreId: $genreId, limit: $limit) {
      id
      title
      synopsis
      coverImageUrl
      authorName
      genreName
      tags
      status
      totalEpisodes
      totalViews
      totalLikes
      totalBookmarks
      isAdultOnly
      createdAt
    }
  }
`;

export const RANKING_QUERY = `
  query Ranking($type: RankingType!, $period: RankingPeriod!, $genreId: ID, $limit: Int!) {
    ranking(type: $type, period: $period, genreId: $genreId, limit: $limit) {
      type
      period
      entries {
        rank
        previousRank
        rankChange
        novel {
          id
          title
          coverImageUrl
          authorName
          genreName
          totalViews
          totalLikes
          status
        }
        score
      }
    }
  }
`;

export const SEARCH_NOVELS_QUERY = `
  query SearchNovels($query: String!, $filters: SearchFilters, $sort: SearchSort, $first: Int, $after: String) {
    searchNovels(query: $query, filters: $filters, sort: $sort, first: $first, after: $after) {
      novels {
        edges {
          node {
            id
            title
            synopsis
            coverImageUrl
            authorName
            genreName
            tags
            status
            totalEpisodes
            totalViews
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
      suggestions
    }
  }
`;

export const NOVELS_BY_GENRE_QUERY = `
  query NovelsByGenre($genreId: ID!, $sort: NovelSort, $first: Int, $after: String) {
    novelsByGenre(genreId: $genreId, sort: $sort, first: $first, after: $after) {
      edges {
        node {
          id
          title
          synopsis
          coverImageUrl
          authorName
          genreName
          tags
          status
          totalEpisodes
          totalViews
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

// ================================
// System
// ================================

export const GENRES_QUERY = `
  query Genres {
    genres {
      id
      name
      slug
      description
      sortOrder
      isActive
    }
  }
`;

// ================================
// Novel (상세/에피소드)
// ================================

export const NOVEL_DETAIL_QUERY = `
  query NovelDetail($id: ID!) {
    novelDetail(id: $id) {
      novel {
        id
        authorId
        title
        synopsis
        coverImageUrl
        genreId
        tags
        status
        isAdultOnly
        totalEpisodes
        totalViews
        totalLikes
        totalBookmarks
        totalFavorites
        totalSupports
        createdAt
      }
      recentEpisodes {
        id
        episodeNumber
        title
        isFree
        price
        viewCount
        likeCount
        publishedAt
      }
      similarNovels {
        novel {
          id
          title
          coverImageUrl
          authorName
          genreName
        }
      }
    }
  }
`;

export const EPISODES_QUERY = `
  query Episodes($novelId: ID!, $status: EpisodeStatus, $first: Int, $after: String) {
    episodes(novelId: $novelId, status: $status, first: $first, after: $after) {
      edges {
        node {
          id
          novelId
          episodeNumber
          title
          wordCount
          status
          isFree
          price
          viewCount
          likeCount
          commentCount
          publishedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const EPISODE_QUERY = `
  query Episode($id: ID!) {
    episode(id: $id) {
      id
      novelId
      authorId
      episodeNumber
      title
      content
      wordCount
      status
      isFree
      price
      viewCount
      likeCount
      dislikeCount
      recommendCount
      commentCount
      publishedAt
      createdAt
    }
  }
`;

// ================================
// User
// ================================

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      nickname
      profileImageUrl
      bio
      role
      status
      isAdultVerified
      lastLoginAt
      createdAt
    }
  }
`;

export const AUTHOR_PROFILE_QUERY = `
  query AuthorProfile($userId: ID!) {
    authorProfile(userId: $userId) {
      id
      userId
      authorName
      authorBio
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      nickname
      profileImageUrl
      bio
    }
  }
`;

export const APPLY_FOR_AUTHOR_MUTATION = `
  mutation ApplyForAuthor($input: ApplyForAuthorInput!) {
    applyForAuthor(input: $input)
  }
`;

// ================================
// Content (댓글/좋아요/북마크)
// ================================

export const COMMENTS_QUERY = `
  query Comments($episodeId: ID!, $first: Int, $after: String) {
    comments(episodeId: $episodeId, first: $first, after: $after) {
      edges {
        node {
          id
          episodeId
          userId
          content
          likeCount
          createdAt
          user {
            id
            nickname
            profileImageUrl
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const CREATE_COMMENT_MUTATION = `
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      episodeId
      userId
      content
      likeCount
      createdAt
    }
  }
`;

export const TOGGLE_LIKE_MUTATION = `
  mutation ToggleLike($targetType: LikeTargetType!, $targetId: ID!) {
    toggleLike(targetType: $targetType, targetId: $targetId) {
      isLiked
      count
    }
  }
`;

export const TOGGLE_BOOKMARK_MUTATION = `
  mutation ToggleBookmark($novelId: ID!) {
    toggleBookmark(novelId: $novelId) {
      isBookmarked
    }
  }
`;

export const TOGGLE_FAVORITE_MUTATION = `
  mutation ToggleFavorite($novelId: ID!) {
    toggleFavorite(novelId: $novelId) {
      isFavorited
    }
  }
`;

export const MY_BOOKMARKS_QUERY = `
  query MyBookmarks($first: Int, $after: String) {
    myBookmarks(first: $first, after: $after) {
      edges {
        node {
          id
          novel {
            id
            title
            coverImageUrl
            authorName
            genreName
            totalEpisodes
          }
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const MY_FAVORITES_QUERY = `
  query MyFavorites($first: Int, $after: String) {
    myFavorites(first: $first, after: $after) {
      edges {
        node {
          id
          novel {
            id
            title
            coverImageUrl
            authorName
            genreName
            totalEpisodes
          }
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const RECENT_READS_QUERY = `
  query RecentReads($first: Int, $after: String) {
    recentReads(first: $first, after: $after) {
      edges {
        node {
          id
          novel {
            id
            title
            coverImageUrl
            authorName
            genreName
          }
          episode {
            id
            episodeNumber
            title
          }
          lastReadAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

// ================================
// Payment
// ================================

export const COIN_BALANCE_QUERY = `
  query CoinBalance {
    coinBalance {
      balance
      totalCharged
      totalUsed
    }
  }
`;

export const COIN_TRANSACTIONS_QUERY = `
  query CoinTransactions($type: CoinTransactionType, $first: Int, $after: String) {
    coinTransactions(type: $type, first: $first, after: $after) {
      edges {
        node {
          id
          type
          amount
          balance
          description
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const PURCHASE_HISTORY_QUERY = `
  query PurchaseHistory($first: Int, $after: String) {
    purchaseHistory(first: $first, after: $after) {
      edges {
        node {
          id
          episode {
            id
            episodeNumber
            title
            novel {
              id
              title
            }
          }
          price
          purchasedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const MY_MEMBERSHIP_QUERY = `
  query MyMembership {
    myMembership {
      id
      tier
      startDate
      endDate
      isActive
    }
  }
`;

export const PURCHASE_EPISODE_MUTATION = `
  mutation PurchaseEpisode($episodeId: ID!) {
    purchaseEpisode(episodeId: $episodeId) {
      success
      balance
    }
  }
`;

export const RENT_EPISODE_MUTATION = `
  mutation RentEpisode($episodeId: ID!, $days: Int!) {
    rentEpisode(episodeId: $episodeId, days: $days) {
      id
      expiresAt
    }
  }
`;

export const PAYMENT_CONFIG_QUERY = `
  query PaymentConfig {
    paymentConfig {
      clientKey
    }
  }
`;

export const PREPARE_COIN_CHARGE_MUTATION = `
  mutation PrepareCoinCharge($packageId: ID!) {
    prepareCoinCharge(packageId: $packageId) {
      paymentKey
      orderId
      amount
    }
  }
`;

export const CONFIRM_COIN_CHARGE_MUTATION = `
  mutation ConfirmCoinCharge($input: ConfirmCoinChargeInput!) {
    confirmCoinCharge(input: $input) {
      success
      balance
      transaction {
        id
        type
        amount
        createdAt
      }
    }
  }
`;

export const PREPARE_MEMBERSHIP_SUBSCRIPTION_MUTATION = `
  mutation PrepareMembershipSubscription($tier: MembershipTier!) {
    prepareMembershipSubscription(tier: $tier) {
      paymentKey
      orderId
      amount
    }
  }
`;

export const CONFIRM_MEMBERSHIP_SUBSCRIPTION_MUTATION = `
  mutation ConfirmMembershipSubscription($input: ConfirmSubscriptionInput!) {
    confirmMembershipSubscription(input: $input) {
      id
      tier
      startDate
      endDate
      isActive
    }
  }
`;

export const CANCEL_MEMBERSHIP_MUTATION = `
  mutation CancelMembership {
    cancelMembership {
      id
      tier
      startDate
      endDate
      isActive
    }
  }
`;

// ================================
// Novel (작가용)
// ================================

export const MY_NOVELS_QUERY = `
  query MyNovels($status: NovelStatus, $first: Int, $after: String) {
    myNovels(status: $status, first: $first, after: $after) {
      edges {
        node {
          id
          title
          coverImageUrl
          genreName
          status
          totalEpisodes
          totalViews
          totalLikes
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const CREATE_NOVEL_MUTATION = `
  mutation CreateNovel($input: CreateNovelInput!) {
    createNovel(input: $input) {
      id
      title
      synopsis
      coverImageUrl
      genreId
      tags
      status
      isAdultOnly
      createdAt
    }
  }
`;

export const UPDATE_NOVEL_MUTATION = `
  mutation UpdateNovel($id: ID!, $input: UpdateNovelInput!) {
    updateNovel(id: $id, input: $input) {
      id
      title
      synopsis
      coverImageUrl
      genreId
      tags
      status
      isAdultOnly
      updatedAt
    }
  }
`;

export const CREATE_EPISODE_MUTATION = `
  mutation CreateEpisode($input: CreateEpisodeInput!) {
    createEpisode(input: $input) {
      id
      novelId
      episodeNumber
      title
      content
      wordCount
      status
      isFree
      price
      createdAt
    }
  }
`;

export const PUBLISH_EPISODE_MUTATION = `
  mutation PublishEpisode($id: ID!) {
    publishEpisode(id: $id) {
      id
      status
      publishedAt
    }
  }
`;

// ================================
// Dashboard (작가/관리자)
// ================================

export const AUTHOR_DASHBOARD_QUERY = `
  query AuthorDashboard {
    authorDashboard {
      totalRevenue
      monthlyRevenue
      totalViews
      monthlyViews
      totalSupportAmount
      subscriberCount
    }
  }
`;

export const ADMIN_DASHBOARD_QUERY = `
  query AdminDashboard {
    adminDashboard {
      pendingReports
      todayNewUsers
      todayNewNovels
      todayRevenue
      activeUsers
    }
  }
`;

export const PUBLISHED_NOTICES_QUERY = `
  query PublishedNotices($first: Int, $after: String) {
    publishedNotices(first: $first, after: $after) {
      edges {
        node {
          id
          title
          content
          category
          isPinned
          publishedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const REPORTS_QUERY = `
  query Reports($status: String, $first: Int, $after: String) {
    reports(status: $status, first: $first, after: $after) {
      edges {
        node {
          id
          reporterId
          targetType
          targetId
          reason
          status
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

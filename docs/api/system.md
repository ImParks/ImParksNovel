# System 도메인 API

## GraphQL Queries

### notifications(type: NotificationType, isRead: Boolean, first: Int, after: String): NotificationConnection!
- 인증: 필수 | 권한: 모든 인증 사용자
- 알림 목록

### unreadNotificationCount: Int!
- 인증: 필수 | 권한: 모든 인증 사용자
- 읽지 않은 알림 수

### notificationSettings: NotificationSettings!
- 인증: 필수 | 권한: 모든 인증 사용자
- 알림 설정 조회

### masterGenres: [Genre!]!
- 인증: 선택 | 권한: 없음
- 장르 마스터

### masterTags(category: String): [Tag!]!
- 인증: 선택 | 권한: 없음
- 태그 마스터

### appConfig: AppConfig!
- 인증: 선택 | 권한: 없음
- 앱 설정 (코인 패키지, 멤버십 요금, 점검 모드)

---

## GraphQL Mutations

### markNotificationAsRead(id: ID!): Notification!
- 인증: 필수 | 권한: 모든 인증 사용자

### markAllNotificationsAsRead: Boolean!
- 인증: 필수 | 권한: 모든 인증 사용자

### deleteNotification(id: ID!): Boolean!
- 인증: 필수 | 권한: 모든 인증 사용자

### updateNotificationSettings(input: NotificationSettingsInput!): NotificationSettings!
- 인증: 필수 | 권한: 모든 인증 사용자
- Input: emailEnabled?, pushEnabled?, newEpisode?, comments?, likes?, marketing?

---

## Socket.io Events

### 연결
```typescript
const socket = io('wss://api.example.com/notifications', {
  auth: { token: 'Bearer {jwt}' }
});
```

### 서버 → 클라이언트

| Event | Payload | 설명 |
|-------|---------|------|
| `notification` | { id, type, title, message, data?, createdAt } | 새 알림 |
| `notification:count` | { unreadCount } | 읽지 않은 알림 수 변경 |
| `episode:published` | { novelId, episodeId, episodeNumber, title } | 구독 소설 새 회차 |

### 클라이언트 → 서버

| Event | Payload | 설명 |
|-------|---------|------|
| `subscribe` | { channels: string[] } | 채널 구독 |
| `unsubscribe` | { channels: string[] } | 채널 해제 |

---

## Types

```graphql
type Notification {
  id: ID!
  type: NotificationType!
  title: String!
  message: String!
  data: JSON
  isRead: Boolean!
  createdAt: DateTime!
}

type NotificationConnection {
  edges: [NotificationEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
  unreadCount: Int!
}

type NotificationSettings {
  emailEnabled: Boolean!
  pushEnabled: Boolean!
  newEpisode: Boolean!
  comments: Boolean!
  likes: Boolean!
  marketing: Boolean!
}

type AppConfig {
  maintenanceMode: Boolean!
  maintenanceMessage: String
  coinPackages: [CoinPackage!]!
  membershipPlans: [MembershipPlan!]!
}

type CoinPackage {
  id: ID!
  name: String!
  coins: Int!
  bonusCoins: Int!
  price: Int!
}

type MembershipPlan {
  tier: MembershipTier!
  name: String!
  price: Int!
  monthlyCoins: Int!
  benefits: [String!]!
}

enum NotificationType {
  NEW_EPISODE COMMENT_REPLY SUPPORT SYSTEM
  SETTLEMENT SERIALIZATION_CHANGE BADGE
}
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| NOTIFICATION_001 | 404 | 알림을 찾을 수 없음 |
| NOTIFICATION_002 | 403 | 다른 사용자의 알림 |
| SOCKET_001 | 401 | 소켓 인증 실패 |
| SYSTEM_001 | 503 | 시스템 점검 중 |

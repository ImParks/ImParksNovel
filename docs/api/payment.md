# Payment 도메인 API

## GraphQL Queries

### coinBalance: CoinBalance!
- 인증: 필수 | 권한: 모든 인증 사용자
- 코인 잔액 조회

### coinTransactions(type: CoinTransactionType, first: Int, after: String): CoinTransactionConnection!
- 인증: 필수 | 권한: 모든 인증 사용자
- 코인 거래 내역

### myMembership: Membership
- 인증: 필수 | 권한: 모든 인증 사용자
- 현재 멤버십 조회

### episodeOwnership(episodeId: ID!): EpisodeOwnership
- 인증: 필수 | 권한: 모든 인증 사용자
- 회차 소유/대여 여부 확인

### purchaseHistory(first: Int, after: String): EpisodeOwnershipConnection!
- 인증: 필수 | 권한: 모든 인증 사용자
- 구매 내역 (소유+대여)

### settlements(year: Int, month: Int): [Settlement!]!
- 인증: 필수 | 권한: AUTHOR 이상
- 정산 내역 조회

### withdrawalRequests: [WithdrawalRequest!]!
- 인증: 필수 | 권한: AUTHOR 이상
- 출금 신청 내역

### availableWithdrawalAmount: Int!
- 인증: 필수 | 권한: AUTHOR 이상
- 출금 가능 금액

---

## GraphQL Mutations

### prepareCoinCharge(packageId: ID!): PaymentPrepare!
- 인증: 필수 | 권한: 모든 인증 사용자
- 코인 충전 준비 (토스 결제 시작)
- Response: { orderId, amount, orderName, customerKey }

### confirmCoinCharge(input: ConfirmChargeInput!): CoinBalance!
- 인증: 필수 | 권한: 모든 인증 사용자
- 코인 충전 확인 (토스 결제 승인 후)
- Input: orderId!, paymentKey!, amount!

### purchaseEpisode(episodeId: ID!): EpisodeOwnership!
- 인증: 필수 | 권한: 모든 인증 사용자
- 회차 영구 소유 구매 (코인 차감)

### rentEpisode(episodeId: ID!, days: Int!): EpisodeOwnership!
- 인증: 필수 | 권한: 모든 인증 사용자
- 회차 대여 (3일/7일/14일, 소유가 대비 30~50%)

### prepareMembershipSubscription(tier: MembershipTier!): PaymentPrepare!
- 인증: 필수 | 권한: 모든 인증 사용자
- 멤버십 가입 준비

### confirmMembershipSubscription(input: ConfirmSubscriptionInput!): Membership!
- 인증: 필수 | 권한: 모든 인증 사용자
- Input: orderId!, paymentKey!, amount!, billingKey!

### cancelMembership: Membership!
- 인증: 필수 | 권한: 멤버십 보유자

### sponsorAuthor(input: SponsorInput!): Sponsorship!
- 인증: 필수 | 권한: 모든 인증 사용자
- Input: authorId!, coinAmount!, message?, isAnonymous?

### requestWithdrawal(input: WithdrawalInput!): WithdrawalRequest!
- 인증: 필수 | 권한: AUTHOR 이상 (최소 10,000원)
- Input: amount!, bankName!, accountNumber!, accountHolder!

---

## REST API

### POST /api/webhooks/toss-payments
- 인증: 웹훅 시크릿 검증 (Toss-Signature 헤더)
- 토스페이먼츠 결제 이벤트 웹훅
- 멱등성: orderId 기준 중복 처리 방지
- Events: PAYMENT_STATUS_CHANGED, BILLING_STATUS_CHANGED

---

## Types

```graphql
type CoinBalance {
  balance: Int!
  totalCharged: Int!
  totalUsed: Int!
}

type EpisodeOwnership {
  id: ID!
  episodeId: String!
  purchaseType: PurchaseType!
  coinsSpent: Int!
  expiresAt: DateTime
  createdAt: DateTime!
}

type Membership {
  tier: MembershipTier!
  status: MembershipStatus!
  startedAt: DateTime!
  expiresAt: DateTime!
  autoRenew: Boolean!
}

type Settlement {
  id: ID!
  periodStart: DateTime!
  periodEnd: DateTime!
  episodeSalesAmount: Int!
  supportAmount: Int!
  platformFee: Int!
  aiFee: Int!
  netAmount: Int!
  status: SettlementStatus!
}

type PaymentPrepare {
  orderId: String!
  amount: Int!
  orderName: String!
  customerKey: String!
}

enum PurchaseType { OWNERSHIP RENTAL_3D RENTAL_7D RENTAL_14D }
enum MembershipTier { BASIC PREMIUM VIP }
enum MembershipStatus { ACTIVE CANCELLED EXPIRED }
enum SettlementStatus { PENDING PROCESSING COMPLETED FAILED }
enum CoinTransactionType { CHARGE PURCHASE REFUND BONUS SUPPORT_SENT SUPPORT_RECEIVED MEMBERSHIP GIFT_SENT GIFT_RECEIVED }
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| PAY_001 | 402 | 코인 잔액 부족 |
| PAY_002 | 409 | 이미 구매한 회차 |
| PAY_003 | 400 | 유효하지 않은 결제 정보 |
| PAY_004 | 404 | 주문을 찾을 수 없음 |
| PAY_005 | 400 | 결제 금액 불일치 |
| MEMBERSHIP_001 | 409 | 이미 멤버십 보유 |
| MEMBERSHIP_002 | 404 | 활성 멤버십 없음 |
| WITHDRAWAL_001 | 400 | 최소 출금 금액(10,000원) 미달 |
| WITHDRAWAL_002 | 400 | 출금 가능 금액 초과 |
| WEBHOOK_001 | 401 | 유효하지 않은 웹훅 서명 |
| WEBHOOK_002 | 409 | 중복 이벤트 (멱등성) |

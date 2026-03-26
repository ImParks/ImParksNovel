# 뷰어 + 결제 페이지 구현 완료

**작성일**: 2026-03-22
**구현 범위**: 회차 뷰어, 코인 충전, 멤버십 가입
**상태**: 완료 (Mock 데이터 기반)

---

## 구현 개요

소설 연재 플랫폼의 핵심 기능인 **회차 뷰어**, **결제**, **구독** 기능을 Next.js 14 + Zustand 기반으로 구현했습니다.

### 📊 파일 통계
- **Pages**: 3개
- **Stores**: 2개 (신규)
- **Components**: 3개 신규 + 기존 atoms/molecules 확장
- **Layout files**: 4개
- **설계 문서**: 1개 (상세)

---

## 생성된 파일 목록

### 1️⃣ Stores (상태 관리)

```
apps/web/src/stores/
├── reader.store.ts           # 글자 크기, 테마, 줄간격 (localStorage persist)
├── payment.store.ts          # 사용자 코인, 멤버십 상태
└── index.ts                  # (업데이트) 새 stores export
```

**특징**:
- `useReaderStore`: localStorage 자동 저장 (독서 설정 세션 유지)
- `usePaymentStore`: 메모리 저장 (향후 React Query로 전환 예정)

---

### 2️⃣ Components (UI)

#### Atoms (신규)
```
components/atoms/
└── Slider/
    └── index.tsx                # 범위 선택 (14~24px 글자 크기용)
```

#### Molecules (신규)
```
components/molecules/
├── RadioGroup/
│   └── index.tsx                # 옵션 그룹 선택 (테마, 줄간격)
└── SettingsPanel/
    └── index.tsx                # 뷰어 설정 패널 (Slider + RadioGroup)
```

**특징**:
- RadioGroup: 제어 컴포넌트 (부모가 상태 관리)
- SettingsPanel: Zustand 직접 사용 (useReaderStore)
- 모두 다크모드 지원

---

### 3️⃣ Pages (라우팅)

#### 회차 뷰어
```
app/(main)/novel/[id]/episode/[episodeId]/
├── layout.tsx                   # 뷰어 전용 (Header/Footer 제외)
└── page.tsx                      # 회차 뷰어 페이지
```

**기능**:
- ✅ 상단 바: 뒤로, 제목, 설정 아이콘
- ✅ 본문: 동적 글자 크기, 테마, 줄간격
- ✅ 하단: 이전/다음, 추천 버튼
- ✅ 유료 회차: 미리보기 (블러) + 구매 버튼

**Mock 데이터**:
- ep1 (무료, 500K 조회)
- ep2 (유료, 50 코인)

#### 코인 충전
```
app/(main)/payment/coins/
└── page.tsx                      # 코인 충전 페이지
```

**기능**:
- ✅ 현재 잔액: 큰 글자로 표시
- ✅ 패키지 그리드: 10/55/120/650 코인
- ✅ 결제 시뮬레이션: 2초 대기 → 성공 메시지
- ✅ 충전 내역: 날짜/유형/금액/잔액 테이블

**패키지**:
- 10 코인 - 1,000원
- 55 코인 + 5 보너스 - 5,000원 ⭐ (인기)
- 120 코인 + 20 보너스 - 10,000원
- 650 코인 + 50 보너스 - 50,000원

#### 멤버십
```
app/(main)/payment/membership/
└── page.tsx                      # 멤버십 페이지
```

**기능**:
- ✅ 현재 구독 상태 표시
- ✅ 플랜 카드: Basic / Premium / VIP
- ✅ 구독 로직: 선택 → 결제 시뮬레이션 → 상태 업데이트
- ✅ 취소 모달: 확인 필수

**플랜**:
| 플랜 | 가격 | 월 보너스 | 특징 |
|-----|------|---------|------|
| Basic | 4,900원 | 30코인 | 일부 선공개 |
| Premium | 9,900원 | 100코인 | 모든 선공개 + AI토큰 50 | ⭐
| VIP | 19,900원 | 250코인 | 전 작품 1회차 무료 + AI토큰 150 |

#### Layout Files
```
app/(main)/
├── novel/
│   ├── layout.tsx               # pass-through
│   └── [id]/
│       ├── layout.tsx           # pass-through
│       └── episode/[episodeId]/
│           └── layout.tsx       # 뷰어 전용 (children만)
└── payment/
    └── layout.tsx               # pass-through
```

---

## 컴포넌트 아키텍처

### Atomic Design 계층

```
atoms
├── Button (기존)
├── Badge (기존)
├── Spinner (기존)
├── Input (기존)
└── Slider (신규)

molecules
├── RadioGroup (신규)
├── SettingsPanel (신규)
├── SearchInput (기존)
├── UserAvatar (기존)
└── NovelCard (기존)

organisms
├── Header (기존)
├── Footer (기존)
├── MobileNav (기존)

templates
├── MainLayout (기존)
```

### 상태 관리 전략

```
useReaderStore (Zustand + persist)
├── fontSize: 14~24
├── theme: 'light' | 'sepia' | 'dark'
└── lineHeight: 1.5 | 1.8 | 2.0 | 2.5

usePaymentStore (Zustand)
├── userCoins: number
├── membershipId: string | null
└── membershipExpireDate: string | null

useState (로컬)
├── showSettings (뷰어 설정 패널)
├── selectedPackageId (코인 선택)
├── selectedPlanId (플랜 선택)
├── isProcessing (로딩)
└── showSuccess (성공 메시지)
```

---

## 주요 파일 경로

### ✅ 생성된 파일

```
✓ apps/web/src/stores/reader.store.ts
✓ apps/web/src/stores/payment.store.ts
✓ apps/web/src/components/atoms/Slider/index.tsx
✓ apps/web/src/components/molecules/RadioGroup/index.tsx
✓ apps/web/src/components/molecules/SettingsPanel/index.tsx
✓ apps/web/src/app/(main)/novel/[id]/episode/[episodeId]/page.tsx
✓ apps/web/src/app/(main)/novel/[id]/episode/[episodeId]/layout.tsx
✓ apps/web/src/app/(main)/novel/layout.tsx
✓ apps/web/src/app/(main)/novel/[id]/layout.tsx
✓ apps/web/src/app/(main)/payment/coins/page.tsx
✓ apps/web/src/app/(main)/payment/membership/page.tsx
✓ apps/web/src/app/(main)/payment/layout.tsx
✓ logs/frontend-design-2026-03-22.md
```

---

## 기술 스택

- **Framework**: Next.js 14 App Router
- **Styling**: TailwindCSS
- **State**: Zustand (전역), useState (로컬)
- **Language**: TypeScript
- **Architecture**: Atomic Design 5계층

---

## 주요 기능

### 📖 회차 뷰어
- 동적 글자 크기 (14~24px 슬라이더)
- 테마 선택 (흰색/세피아/다크)
- 줄간격 조정 (1.5~2.5)
- localStorage 자동 저장
- 무료/유료 회차 구분
- 미리보기 (블러 처리)

### 💰 코인 충전
- 4개 패키지 선택
- 결제 시뮬레이션
- 성공 메시지 표시
- 충전 내역 테이블

### 🎁 멤버십
- 3개 플랜 (Basic/Premium/VIP)
- 구독/변경/취소 기능
- 구독 상태 표시
- 취소 확인 모달

---

## 테스트 체크리스트

- [ ] 글자 크기 슬라이더 동작 및 localStorage 저장
- [ ] 테마 변경 (light/sepia/dark) 적용
- [ ] 줄간격 라디오 버튼 적용
- [ ] 뷰어 설정 패널 열기/닫기
- [ ] 무료 회차 본문 표시
- [ ] 유료 회차 미리보기 + 구매 버튼
- [ ] 코인 패키지 선택 및 결제 시뮬레이션
- [ ] 멤버십 플랜 선택 및 구독
- [ ] 구독 취소 모달 및 확인
- [ ] 모바일 반응형 (375px, 768px, 1024px)
- [ ] 다크모드 전체 적용

---

## 설계 문서

상세한 설계 문서는 다음을 참조하세요:
- **📄 `logs/frontend-design-2026-03-22.md`**
  - 컴포넌트 트리 및 책임
  - 서버/클라이언트 분류
  - 렌더링 전략
  - 상태 관리 설계
  - SEO 전략
  - 성능 최적화
  - 접근성 체크리스트
  - 의사결정 기록 및 FAQ

---

## 다음 단계

1. **실제 API 연동**
   - episode fetch (SSR)
   - payment gateway (토스)
   - membership subscription API

2. **인증 통합**
   - NextAuth.js
   - 유료 회차 구매 여부 검증

3. **고도화 기능**
   - 회차 북마크
   - 댓글 시스템
   - 읽은 위치 저장

---

## 주의사항

⚠️ **Sepia 테마**: 다크모드 미지원 (배경 색상 고정)
→ 개선 필요: 시스템 다크모드 감지 후 색상 조정

⚠️ **모달**: 기본 Escape 키, 포커스 트래핑 미지원
→ 향후: ARIA dialog role 및 keyboard handler 추가

⚠️ **결제**: Mock 데이터 기반 (실제 토스 미연동)
→ 향후: 토스 SDK + API 연동

# AI 소설 작성 보조 시스템 설계

> 버전: v1.0
> 작성일: 2026-03-27
> 상태: Design Council 합의 완료

## 1. 개요

### 1.1 목적
장기 연재 소설(100화 이상)에서 AI 이어쓰기 기능이 **이야기 일관성을 유지**하면서 **토큰 비용을 최적화**하는 시스템을 설계한다.

### 1.2 핵심 과제
1. 장기 연재의 토큰 관리: 100화 전체 텍스트(~250K 토큰)를 매번 전송할 수 없음
2. 복선/떡밥 참조: 작가가 특정 회차의 복선을 회수할 때 해당 내용을 프롬프트에 포함
3. 설정집(Novel Bible) 관리: 캐릭터, 세계관, 복선을 구조화하여 저장 및 검색
4. 회차 분할 제안: 줄거리 입력 시 적정 회차 수 및 분할 지점 제안

### 1.3 사용 모델
- **기본 모델**: gpt-5.4-mini (이어쓰기, 설정 생성, 플롯 제안)
- **경량 모델**: gpt-5.4-nano (요약 생성, 텍스트 개선)
- **백업 (계획)**: Anthropic Claude (추후 문서/키 제공 시)
- **API**: OpenAI Responses API (`client.responses.create()`)

---

## 2. 토큰 관리 전략: 하이브리드 접근법

### 2.1 전략 조합

| 전략 | 설명 | 토큰 예산 |
|------|------|----------|
| **C: 설정집** | 캐릭터, 세계관, 활성 복선 등 구조화된 메타데이터 | 2,000~4,000 |
| **A: 슬라이딩 윈도우** | 직전 1~2화 전문 또는 요약 | 2,000~6,000 |
| **B: 요약 체인** | 누적 요약 (10화마다 압축) | 2,000~5,000 |

### 2.2 프롬프트 구조 및 토큰 예산

```
+-----------------------------------------------------------+
| [시스템 프롬프트]                           ~500 토큰      |
| - AI 역할: 한국어 웹소설 작가 보조                         |
| - 출력 규칙: 문체 유지, 자연스러운 전개                    |
+-----------------------------------------------------------+
| [설정집 요약]                          2,000~4,000 토큰    |
| - 주요 캐릭터 (이름, 성격, 현재 상태)                      |
| - 세계관 핵심 규칙                                         |
| - 활성 복선 목록                                           |
+-----------------------------------------------------------+
| [누적 요약]                            2,000~5,000 토큰    |
| - 전체 스토리 흐름                                         |
| - 최근 5화 주요 사건                                       |
| - 캐릭터별 현재 상황                                       |
+-----------------------------------------------------------+
| [직전 회차 요약]                       1,000~2,000 토큰    |
| - 직전 1~2화의 상세 요약                                   |
+-----------------------------------------------------------+
| [직전 1화 전문]                        2,000~4,000 토큰    |
| - 문체 유지를 위한 레퍼런스 텍스트                         |
+-----------------------------------------------------------+
| [참조 회차 발췌] (선택적)              0~2,000 토큰        |
| - 작가가 지정한 특정 복선/장면                             |
+-----------------------------------------------------------+
| [작가 지시]                              500~1,000 토큰    |
| - "3화 복선 회수하며 주인공이 마을에 도착"                 |
+-----------------------------------------------------------+
총 예산: 8,000~18,000 토큰 (입력)
출력: 2,000~4,000 토큰 (1회차 분량)
```

### 2.3 비용 비교 (100화 소설, 1회 이어쓰기 기준)

| 방식 | 입력 토큰 | 비용 (gpt-5.4-mini) |
|------|----------|---------------------|
| 전체 텍스트 전송 | ~250,000 | ~$0.19 |
| 하이브리드 전략 | ~15,000 | ~$0.011 (**94% 절감**) |

---

## 3. 자동 요약 시스템

### 3.1 요약 생성 시점

| 요약 유형 | 생성 시점 | 비용 부담 | 모델 |
|----------|----------|----------|------|
| basicSummary | 회차 발행 시 자동 | 플랫폼 | gpt-5.4-nano |
| detailedSummary | 작가 요청 시 | 작가 토큰 | gpt-5.4-mini |
| cumulativeSummary | 10화마다 배치 | 플랫폼 | gpt-5.4-nano |

### 3.2 요약 압축 워크플로우

```
회차 발행
    |
    v
basicSummary 생성 (gpt-5.4-nano, 플랫폼 부담)
    |
    v
10화 도달? --No--> 종료
    |
   Yes
    v
cumulativeSummary 압축 (BullMQ delayed job)
    |
    v
NovelSummary 업데이트
```

---

## 4. 설정집 (Novel Bible) 설계

### 4.1 카테고리

| 카테고리 | 코드 | 설명 |
|----------|------|------|
| 캐릭터 | CHARACTER | 등장인물 프로필 |
| 세계관 | WORLDBUILDING | 시대, 지리, 마법 체계 |
| 복선 | FORESHADOW | 깔린 떡밥, 회수 여부 |
| 타임라인 | TIMELINE | 주요 사건 순서 |
| 사용자 정의 | CUSTOM | 작가 자유 메모 |

### 4.2 structuredData 타입

```typescript
interface CharacterData {
  name: string;
  age?: number;
  gender?: string;
  appearance?: string;
  personality?: string;
  abilities?: string[];
  relationships?: Array<{ characterId: string; relation: string }>;
  currentStatus?: string;
}

interface ForeshadowData {
  layedInEpisode: number;
  resolvedInEpisode?: number;
  hint: string;
  relatedCharacterIds?: string[];
}

interface WorldbuildingData {
  type: "geography" | "system" | "organization" | "item" | "other";
  rules?: string[];
  restrictions?: string[];
}

interface TimelineData {
  date?: string;
  episodeNumber: number;
  importance: "major" | "minor";
}
```

---

## 5. DB 스키마 변경

### 5.1 새로운 Enum

```prisma
enum SettingCategory {
  CHARACTER
  WORLDBUILDING
  FORESHADOW
  TIMELINE
  CUSTOM
}

enum SettingStatus {
  ACTIVE
  RESOLVED
  ARCHIVED
}
```

### 5.2 NovelSetting 확장

```prisma
model NovelSetting {
  id                String          @id @default(cuid())
  novelId           String
  novel             Novel           @relation(fields: [novelId], references: [id], onDelete: Cascade)
  category          SettingCategory
  title             String
  content           String
  structuredData    Json?
  linkedEpisodes    Int[]
  linkedCharacters  String[]
  status            SettingStatus   @default(ACTIVE)
  isAIGenerated     Boolean         @default(false)
  sortOrder         Int             @default(0)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([novelId, category])
  @@index([novelId, status])
  @@map("novel_settings")
}
```

### 5.3 NovelSummary (신규)

```prisma
model NovelSummary {
  id              String   @id @default(cuid())
  novelId         String   @unique
  novel           Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  overallPlot     String
  recentEvents    String
  activeThreads   Json
  characterStatus Json
  lastEpisode     Int
  version         Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("novel_summaries")
}
```

---

## 6. 모델 선택 전략

| 기능 | 모델 | reasoning | verbosity | 이유 |
|------|------|-----------|-----------|------|
| 이어쓰기 | gpt-5.4-mini | none | medium | 창의적 글쓰기, 비용 균형 |
| 텍스트 개선 | gpt-5.4-nano | none | medium | 단순 교정, 최저 비용 |
| 설정 생성 | gpt-5.4-mini | none | medium | 구조화된 출력 필요 |
| 플롯 제안 | gpt-5.4-mini | low | medium | 약간의 추론 필요 |
| 회차 분할 | gpt-5.4-mini | low | low | 구조 분석 필요 |
| 요약 생성 | gpt-5.4-nano | none | low | 대량 처리, 최저 비용 |
| 복선 분석 | gpt-5.4-mini | medium | medium | 텍스트 심층 분석 |

---

## 7. 복선 참조 시스템 (MVP: 수동 태깅)

작가가 복선을 등록할 때 `linkedEpisodes`에 관련 회차를 입력.
AI 호출 시 해당 복선의 content + 관련 회차 basicSummary를 프롬프트에 삽입.

---

## 8. 회차 분할 제안

작가가 줄거리를 입력하면:
- 1회차당 약 3,000~6,000자 기준
- 장면 전환 지점에서 분할
- 각 회차 제목 + 요약 + 클리프행어 제안

---

## 9. 1회차 생성 제한

| 회차 길이 | 글자 수 | 토큰 | 전략 |
|----------|--------|------|------|
| 짧은 회차 | ~3,000자 | ~2,000 | 단일 생성 |
| 표준 회차 | ~4,500자 | ~3,000 | 단일 생성 |
| 긴 회차 | ~6,000자 | ~4,000 | 단일 생성 |
| 초장편 | 6,000자+ | 4,000+ | 섹션별 분할 생성 |

---

## 10. MVP vs 확장

### MVP (Phase 1)
- 하이브리드 토큰 관리 (설정집 + 슬라이딩 윈도우 + 요약)
- 플랫폼 부담 기본 요약 자동 생성
- 설정집 카테고리별 구조화
- 수동 복선 태깅 및 참조
- 회차 분할 제안 API
- NovelSummary 누적 요약 저장
- 10화마다 요약 압축 배치

### 확장 (Phase 2+)
- AI 자동 복선 추출
- RAG 기반 관련 회차 검색 (임베딩 + pgvector)
- 캐릭터 관계도 시각화
- 타임라인 자동 생성
- Anthropic Claude 백업 프로바이더

# Logger System Guide

구조화된 로깅 시스템 사용 가이드입니다.

## 개요

- **LoggerService**: NestJS의 `LoggerService` 인터페이스를 구현한 커스텀 로거
- **HttpLoggerMiddleware**: 모든 HTTP 요청/응답을 자동으로 로깅
- **LoggerModule**: Global 모듈로 주입되어 모든 곳에서 사용 가능

## 환경별 동작

### 개발 환경 (NODE_ENV=development)

- **콘솔 출력**: 컬러 포맷팅 + JSON 구조
- **레벨별 색상**:
  - error: 빨강 (Red)
  - warn: 노랑 (Yellow)
  - log: 청록색 (Cyan)
  - debug: 자주색 (Magenta)
  - verbose: 흰색 (White)

```json
[ERROR] [2026-03-27T10:30:45.123Z] [AuthService] User not found
{
  "userId": "123",
  "ip": "127.0.0.1"
}
```

### 프로덕션 환경 (NODE_ENV=production)

- **콘솔 출력**: JSON only (ELK, Datadog 등과 쉽게 통합)
- 모든 로그는 JSON 객체로 출력되어 로그 수집 시스템에서 파싱 용이

```json
{"timestamp":"2026-03-27T10:30:45.123Z","level":"error","message":"User not found","context":"AuthService","metadata":{"userId":"123","ip":"127.0.0.1"}}
```

## 사용법

### 1. 기본 로깅

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from './common/logger/logger.service';

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async findUser(id: string) {
    this.logger.log(`Finding user with ID: ${id}`, 'UserService');
    // ...
  }
}
```

### 2. 메타데이터와 함께 로깅

```typescript
this.logger.logWithMetadata(
  'User logged in successfully',
  'AuthService',
  {
    userId: user.id,
    email: user.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  },
  'log',
);
```

### 3. 로그 레벨별 사용

```typescript
// 정보성 메시지
this.logger.log('Payment processed', 'PaymentService');

// 경고 (복구 가능한 상황)
this.logger.warn('Retry attempt 3 of 5', 'PaymentService', {
  transactionId: 'tx_123',
});

// 에러 (복구 불가능한 상황)
this.logger.error('Database connection failed', error.stack, 'PrismaService');

// 디버깅 (개발 환경에서만 출력)
this.logger.debug('User object', 'UserService', { user: userData });

// 상세 정보 (개발 환경에서만 출력)
this.logger.verbose('Query executed', 'NovelRepository', { query: sqlQuery });
```

### 4. 성능 측정

비동기 작업의 실행 시간을 자동으로 측정하고 로깅합니다.

```typescript
// 성공한 경우
const user = await this.logger.measure(
  'Fetch user from database',
  'UserService',
  async () => {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  },
);

// 출력:
// [LOG] [timestamp] [UserService] Fetch user from database completed
// { "duration": "45ms" }

// 실패한 경우
try {
  await this.logger.measure(
    'Process payment',
    'PaymentService',
    async () => {
      return this.processPayment(dto);
    },
  );
} catch (error) {
  // 자동으로 에러와 실행 시간이 로깅됨
  // [ERROR] [timestamp] [PaymentService] Process payment failed
  // { "duration": "120ms", "error": "Insufficient balance" }
}
```

### 5. HTTP 요청 로깅

모든 HTTP 요청/응답이 자동으로 로깅됩니다. (별도 설정 불필요)

```json
{
  "timestamp": "2026-03-27T10:30:45.123Z",
  "level": "log",
  "message": "GET /api/novels - 200",
  "context": "HttpLogger",
  "metadata": {
    "method": "GET",
    "path": "/api/novels",
    "statusCode": 200,
    "duration": "45ms",
    "ip": "127.0.0.1",
    "query": { "page": "1", "limit": "20" }
  }
}
```

### 6. GraphQL 요청 로깅

GraphQL 요청도 HTTP 레이어에서 자동으로 로깅됩니다.

```json
{
  "timestamp": "2026-03-27T10:30:45.123Z",
  "level": "log",
  "message": "POST /graphql - 200",
  "context": "HttpLogger",
  "metadata": {
    "method": "POST",
    "path": "/graphql",
    "statusCode": 200,
    "duration": "85ms",
    "ip": "127.0.0.1"
  }
}
```

## 구조화된 로그 포맷

모든 로그는 다음 구조를 따릅니다:

```typescript
interface StructuredLog {
  timestamp: string;        // ISO 8601 형식
  level: 'error' | 'warn' | 'log' | 'debug' | 'verbose';
  message: string;          // 주 메시지
  context?: string;         // 로그 출처 (클래스명, 모듈명 등)
  metadata?: {              // 추가 정보
    [key: string]: unknown;
  };
  stack?: string;           // 에러 스택 트레이스
}
```

## 모범 사례

### 1. 컨텍스트 명시

```typescript
// Good
this.logger.log('Novel created', 'NovelService', { novelId: novel.id });

// Bad
this.logger.log('Novel created');
```

### 2. 민감 정보 제외

```typescript
// Good
this.logger.logWithMetadata('User login', 'AuthService', {
  userId: user.id,
  email: user.email, // 최소한의 정보만
});

// Bad
this.logger.logWithMetadata('User login', 'AuthService', {
  user: userData, // 패스워드 등 민감 정보가 포함될 수 있음
});
```

### 3. 적절한 레벨 선택

```typescript
// 운영 관심사: 비즈니스 이벤트
this.logger.log('Payment completed', 'PaymentService');

// 운영 경고: 복구 가능하나 주의 필요
this.logger.warn('Cache miss for novel', 'CacheService');

// 에러: 복구 불가능한 상황
this.logger.error('Database connection lost', error.stack, 'PrismaService');

// 개발 전용: 디버깅
this.logger.debug('Query parameters', 'SearchService', { params });
```

### 4. 성능 측정 활용

```typescript
// 중요한 작업의 성능을 추적
const payment = await this.logger.measure(
  'Payment gateway API call',
  'PaymentGatewayAdapter',
  async () => {
    return this.gateway.charge(amount);
  },
);
```

## Winston 확장 (선택사항)

현재는 NestJS 내장 Logger를 확장하고 있습니다. 향후 Winston을 추가하려면:

```bash
npm install winston winston-daily-rotate-file
```

그 후 `LoggerService`를 확장하여 Winston 프로바이더를 추가할 수 있습니다.

```typescript
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger = winston.createLogger({
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });
  // ...
}
```

## 로그 모니터링

### 개발 환경

```bash
npm run dev
```

콘솔에서 실시간으로 컬러 포맷된 로그 확인

### 프로덕션 환경

1. **ELK Stack (Elasticsearch, Logstash, Kibana)**
   - JSON 로그를 Logstash로 수집
   - Elasticsearch에 저장
   - Kibana에서 대시보드 구성

2. **Datadog / New Relic**
   - JSON 로그 직접 수집
   - 자동 분석 및 알림

3. **CloudWatch (AWS)**
   - JSON 로그를 CloudWatch Logs로 수집
   - CloudWatch Insights로 쿼리

## 문제 해결

### 로그가 안 보인다

```typescript
// 1. 의존성이 제대로 주입되었는지 확인
constructor(private readonly logger: LoggerService) {}

// 2. 개발 환경 DEBUG/VERBOSE 로그가 안 보인다
// NODE_ENV=development인지 확인
console.log(process.env.NODE_ENV);
```

### 프로덕션에서 debug 로그가 출력된다

```typescript
// NODE_ENV를 반드시 production으로 설정
// .env 파일 또는 환경변수 확인
NODE_ENV=production npm run start:prod
```

### HTTP 로깅이 너무 많다

HTTP 로깅 미들웨어를 선택적으로 비활성화하려면 `logger.module.ts`를 수정:

```typescript
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 특정 경로 제외
    consumer
      .apply(HttpLoggerMiddleware)
      .exclude('/health', '/metrics')
      .forRoutes('*');
  }
}
```

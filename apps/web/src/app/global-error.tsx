/**
 * Next.js 글로벌 에러 바운더리
 *
 * 역할:
 * - 루트 레벨 에러 캡처
 * - Sentry로 에러 보고
 * - 사용자 친화적인 에러 UI 표시
 *
 * 주의:
 * - 이 파일은 'use client'를 명시해야 함
 * - Sentry 에러 보고가 초기화되었다고 가정
 *
 * 설치 필요:
 * npm install @sentry/nextjs
 */

'use client';

import { useEffect } from 'react';

/**
 * 주석: Sentry 임포트
 * import * as Sentry from '@sentry/nextjs';
 *
 * 사용 예시:
 * useEffect(() => {
 *   Sentry.captureException(error, {
 *     contexts: {
 *       react: {
 *         componentStack: errorInfo.componentStack,
 *       },
 *     },
 *   });
 * }, [error, errorInfo]);
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Sentry에 에러 보고
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(error);

    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '40px',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '12px',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: '#6b7280',
                fontSize: '14px',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              An unexpected error occurred. We've been notified and will look
              into it. Please try again.
            </p>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#991b1b',
                  overflow: 'auto',
                  maxHeight: '150px',
                }}
              >
                <strong>Error Details:</strong>
                <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                  {error.message}
                </pre>
              </div>
            )}

            <button
              onClick={reset}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#2563eb')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#3b82f6')
              }
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

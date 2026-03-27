/**
 * Next.js 라우트 레벨 에러 바운더리
 *
 * 역할:
 * - 개별 라우트의 에러 캡처
 * - Sentry로 에러 보고
 * - 컨텍스트 정보 함께 전송
 *
 * 주의:
 * - 이 파일은 'use client'를 명시해야 함
 * - global-error.tsx와 달리 HTML, body 태그 불필요
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
 *     tags: {
 *       errorBoundary: 'route-level',
 *     },
 *   });
 * }, [error, errorInfo]);
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Sentry에 에러 보고
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(error, {
    //   tags: { errorBoundary: 'route-level' },
    // });

    console.error('Route error caught:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#f9fafb',
        padding: '20px',
        borderRadius: '8px',
        margin: '20px 0',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '12px',
          }}
        >
          Page Load Error
        </h2>

        <p
          style={{
            color: '#6b7280',
            fontSize: '14px',
            marginBottom: '20px',
            lineHeight: '1.5',
          }}
        >
          We encountered an error while loading this page. Please try again.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '12px',
              color: '#7f1d1d',
              overflow: 'auto',
              maxHeight: '120px',
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
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = '#dc2626')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = '#ef4444')
          }
        >
          Try again
        </button>
      </div>
    </div>
  );
}

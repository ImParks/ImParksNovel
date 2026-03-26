import { QueryClient } from '@tanstack/react-query';

// 싱글톤 패턴: 서버/클라이언트 환경 분리
let browserQueryClient: QueryClient | undefined;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR에서 즉시 refetch 방지
        staleTime: 5 * 60 * 1000, // 5분
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // 서버: 매 요청마다 새 인스턴스
    return makeQueryClient();
  }

  // 클라이언트: 싱글톤 유지
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}

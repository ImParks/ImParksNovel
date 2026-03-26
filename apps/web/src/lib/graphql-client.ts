import { GraphQLClient } from 'graphql-request';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

export const graphqlClient = new GraphQLClient(API_URL, {
  headers: () => {
    // 브라우저 환경에서만 localStorage 접근
    if (typeof window === 'undefined') {
      return {} as Record<string, string>;
    }

    // zustand persist 스토리지에서 토큰 추출
    try {
      const raw = localStorage.getItem('vibe-auth');
      if (!raw) return {} as Record<string, string>;

      const parsed = JSON.parse(raw) as { state?: { token?: string } };
      const token = parsed?.state?.token;

      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {
      // localStorage 파싱 실패 시 무시
    }

    return {} as Record<string, string>;
  },
});

// 타입 안전한 요청 헬퍼
export async function gql<T, V extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
  variables?: V
): Promise<T> {
  return graphqlClient.request<T>(query, variables);
}

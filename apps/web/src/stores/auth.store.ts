import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  role: 'READER' | 'AUTHOR' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user: User, token: string) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (partial: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'vibe-auth',
      storage: createJSONStorage(() => localStorage),
      // token만 persist, user 정보도 함께 저장
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export type { User, AuthState };

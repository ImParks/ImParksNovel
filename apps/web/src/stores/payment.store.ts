import { create } from 'zustand';

export interface CoinPackage {
  id: string;
  coins: number;
  bonusCoins: number;
  price: number;
  recommended?: boolean;
}

export interface PaymentHistory {
  id: string;
  date: string;
  type: 'purchase' | 'refund' | 'reward';
  coins: number;
  price: number;
  balance: number;
}

export interface MembershipPlan {
  id: string;
  name: 'Basic' | 'Premium' | 'VIP';
  price: number;
  monthlyBonus: number;
  previewChapters: boolean;
  allPreviewChapters: boolean;
  aiTokens: number;
  firstChapterFree: boolean;
  recommended?: boolean;
}

interface PaymentState {
  userCoins: number;
  membershipId: string | null;
  membershipExpireDate: string | null;

  // Actions
  setUserCoins: (coins: number) => void;
  addCoins: (coins: number) => void;
  deductCoins: (coins: number) => void;
  setMembership: (id: string, expireDate: string) => void;
  cancelMembership: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  userCoins: 0,
  membershipId: null,
  membershipExpireDate: null,

  setUserCoins: (coins) => set({ userCoins: coins }),

  addCoins: (coins) =>
    set((state) => ({
      userCoins: state.userCoins + coins,
    })),

  deductCoins: (coins) =>
    set((state) => ({
      userCoins: Math.max(0, state.userCoins - coins),
    })),

  setMembership: (id, expireDate) =>
    set({
      membershipId: id,
      membershipExpireDate: expireDate,
    }),

  cancelMembership: () =>
    set({
      membershipId: null,
      membershipExpireDate: null,
    }),
}));

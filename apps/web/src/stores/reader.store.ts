import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ReaderStore {
  fontSize: number; // 14~24px
  theme: 'light' | 'sepia' | 'dark';
  lineHeight: 1.5 | 1.8 | 2.0 | 2.5;

  // Actions
  setFontSize: (size: number) => void;
  setTheme: (theme: ReaderStore['theme']) => void;
  setLineHeight: (height: ReaderStore['lineHeight']) => void;
  reset: () => void;
}

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_THEME = 'light' as const;
const DEFAULT_LINE_HEIGHT = 1.8 as const;

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      fontSize: DEFAULT_FONT_SIZE,
      theme: DEFAULT_THEME,
      lineHeight: DEFAULT_LINE_HEIGHT,

      setFontSize: (size) => {
        const clamped = Math.max(14, Math.min(24, size));
        set({ fontSize: clamped });
      },

      setTheme: (theme) => set({ theme }),

      setLineHeight: (height) => set({ lineHeight: height }),

      reset: () =>
        set({
          fontSize: DEFAULT_FONT_SIZE,
          theme: DEFAULT_THEME,
          lineHeight: DEFAULT_LINE_HEIGHT,
        }),
    }),
    {
      name: 'vibe-reader-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fontSize: state.fontSize,
        theme: state.theme,
        lineHeight: state.lineHeight,
      }),
    }
  )
);

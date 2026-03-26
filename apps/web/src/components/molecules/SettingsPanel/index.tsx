'use client';

import { useReaderStore } from '@/stores';
import { Slider } from '@/components/atoms/Slider';
import { Button } from '@/components/atoms/Button';
import { RadioGroup, RadioOption } from '@/components/molecules/RadioGroup';

interface SettingsPanelProps {
  onClose?: () => void;
}

const themeOptions: RadioOption[] = [
  { id: 'light', label: '흰색', value: 'light' },
  { id: 'sepia', label: '세피아', value: 'sepia' },
  { id: 'dark', label: '다크', value: 'dark' },
];

const lineHeightOptions: RadioOption[] = [
  { id: '1.5', label: '1.5', value: '1.5' },
  { id: '1.8', label: '1.8', value: '1.8' },
  { id: '2.0', label: '2.0', value: '2.0' },
  { id: '2.5', label: '2.5', value: '2.5' },
];

export type { SettingsPanelProps };

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { fontSize, theme, lineHeight, setFontSize, setTheme, setLineHeight, reset } =
    useReaderStore();

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">뷰어 설정</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close settings"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* 글자 크기 */}
        <div>
          <Slider
            label="글자 크기"
            min={14}
            max={24}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.currentTarget.value))}
          />
        </div>

        {/* 배경 테마 */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">배경</p>
          <RadioGroup
            name="theme"
            options={themeOptions}
            value={theme}
            onChange={(value) => setTheme(value as 'light' | 'sepia' | 'dark')}
          />
        </div>

        {/* 줄간격 */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">줄간격</p>
          <RadioGroup
            name="lineHeight"
            options={lineHeightOptions}
            value={String(lineHeight)}
            onChange={(value) => setLineHeight(Number(value) as 1.5 | 1.8 | 2.0 | 2.5)}
          />
        </div>

        {/* 초기화 버튼 */}
        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={reset} className="w-full">
            초기화
          </Button>
        </div>
      </div>
    </div>
  );
}

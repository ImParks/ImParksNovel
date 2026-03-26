import { InputHTMLAttributes, forwardRef } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      min = 0,
      max = 100,
      step = 1,
      value,
      showValue = true,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            {showValue && (
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {value}
              </span>
            )}
          </div>
        )}

        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          className={[
            'w-full h-2 rounded-lg appearance-none cursor-pointer',
            'bg-gray-200 dark:bg-gray-700',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
export type { SliderProps };

import { InputHTMLAttributes, forwardRef, useId } from 'react';

// Usage:
// <Toggle label="알림 받기" checked={isNotified} onChange={handleChange} />
// <Toggle label="공지 고정" defaultChecked={isPinned} />

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, className = '', id: propId, ...props }, ref) => {
    const generatedId = useId();
    const id = propId ?? generatedId;

    return (
      <div className="flex items-center gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={[
            'w-4 h-4 cursor-pointer',
            'rounded border-gray-300 dark:border-gray-700',
            'text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export { Toggle };
export type { ToggleProps };

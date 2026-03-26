import { HTMLAttributes, forwardRef } from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
};

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={[
          'inline-block rounded-full animate-spin',
          'border-gray-300 border-t-primary-500',
          'dark:border-gray-600 dark:border-t-primary-400',
          sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  },
);

Spinner.displayName = 'Spinner';

export { Spinner };
export type { SpinnerProps };

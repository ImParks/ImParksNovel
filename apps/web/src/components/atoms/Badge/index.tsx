import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success:
    'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  warning:
    'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  error:
    'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  info:
    'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={[
          'inline-flex items-center font-medium rounded-full whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };

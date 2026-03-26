import React, { ButtonHTMLAttributes, forwardRef } from 'react';

// Usage:
// <Button variant="primary" size="md" onClick={handleClick}>클릭</Button>
// <Button variant="ghost" size="sm" disabled>비활성화</Button>
// <Button asChild><Link href="/">홈</Link></Button>

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500 disabled:bg-primary-300',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 disabled:bg-gray-50 disabled:text-gray-400',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 disabled:text-gray-300',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      className = '',
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseClassName = [
      'inline-flex items-center justify-center font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      variantStyles[variant],
      sizeStyles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (asChild) {
      return (
        <span className={baseClassName} ref={ref as React.Ref<HTMLSpanElement>} {...props}>
          {children}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={baseClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };

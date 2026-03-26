'use client';

import { ImgHTMLAttributes, forwardRef, useState } from 'react';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fallback?: string;
}

const sizeStyles: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
};

const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ size = 'md', src, alt = '', fallback, className = '', ...props }, ref) => {
    const [hasError, setHasError] = useState(false);
    const sizeClass = sizeStyles[size];

    const initials = fallback
      ?? (alt ? alt.slice(0, 2).toUpperCase() : '?');

    if (!src || hasError) {
      return (
        <div
          className={[
            'inline-flex items-center justify-center rounded-full',
            'bg-gray-200 text-gray-600 font-medium',
            'dark:bg-gray-700 dark:text-gray-300',
            sizeClass,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={alt}
        >
          {initials}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={[
          'inline-block rounded-full object-cover',
          sizeClass,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
    );
  },
);

Avatar.displayName = 'Avatar';

export { Avatar };
export type { AvatarProps };

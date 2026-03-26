'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { Input } from '@/components/atoms';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = '검색어를 입력하세요', className = '', onSearch, ...props }, ref) => {
    return (
      <div className={['relative', className].filter(Boolean).join(' ')}>
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className="pl-10"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) {
              onSearch((e.target as HTMLInputElement).value);
            }
          }}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
export type { SearchInputProps };

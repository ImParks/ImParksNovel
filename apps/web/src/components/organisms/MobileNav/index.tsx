'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: '홈',
    icon: <HomeIcon />,
  },
  {
    href: '/search',
    label: '검색',
    icon: <SearchIcon />,
  },
  {
    href: '/my-library',
    label: '서재',
    icon: <LibraryIcon />,
  },
  {
    href: '/dashboard',
    label: '마이',
    icon: <UserIcon />,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex-1 flex flex-col items-center justify-center py-3 px-2 gap-1 transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div
                className={[
                  'w-6 h-6',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// SVG Icons

function HomeIcon() {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

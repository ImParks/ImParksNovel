'use client';

import { useAuthStore } from '@/stores/auth.store';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/atoms';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/', label: '홈' },
  { href: '/search', label: '검색' },
  { href: '/ranking', label: '랭킹' },
];

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl">
            <span className="text-primary-600 dark:text-primary-400">바이브</span>
            <span className="text-gray-900 dark:text-white">코딩</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Icon (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/search" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <SearchIcon />
            </Link>

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <UserAvatar user={user} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                    {user.nickname}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <Link
                      href="/my-library"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      내 서재
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      설정
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                  asChild
                >
                  <Link href="/login">로그인</Link>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  asChild
                >
                  <Link href="/signup">회원가입</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <HamburgerIcon />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Auth */}
            <div className="px-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/my-library"
                    className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    내 서재
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    설정
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    asChild
                  >
                    <Link href="/login">로그인</Link>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-start bg-primary-600 hover:bg-primary-700 text-white font-semibold"
                    asChild
                  >
                    <Link href="/signup">회원가입</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

// Helper Components

interface UserAvatarProps {
  user: {
    nickname: string;
    avatarUrl?: string;
  };
}

function UserAvatar({ user }: UserAvatarProps) {
  const initials = user.nickname.substring(0, 2).toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.nickname}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-700 dark:text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      className="w-6 h-6 text-gray-700 dark:text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

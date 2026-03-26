import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              <span className="text-primary-400">바이브</span>
              <span>코딩</span>
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              작가와 독자를 잇는 소설 연재 플랫폼. 당신의 이야기를 세상에 알리세요.
            </p>
          </div>

          {/* Column 2: Service */}
          <div>
            <h4 className="font-semibold mb-4 text-white">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/novels"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  소설 탐색
                </Link>
              </li>
              <li>
                <Link
                  href="/rankings"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  랭킹
                </Link>
              </li>
              <li>
                <Link
                  href="/new"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  신작
                </Link>
              </li>
              <li>
                <Link
                  href="/author-signup"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  작가 등록
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/notice"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  공지사항
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  문의하기
                </Link>
              </li>
              <li>
                <Link
                  href="/bug-report"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  버그 신고
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">법적</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  쿠키 정책
                </Link>
              </li>
              <li>
                <Link
                  href="/copyright"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  저작권
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} 바이브코딩. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// SVG Icons

function TwitterIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 012-2h3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

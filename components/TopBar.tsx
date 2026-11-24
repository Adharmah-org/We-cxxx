'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  onOpenSearch: () => void;
}

const NAV_LINKS = [
  { href: '/books', label: 'Library' },
  { href: '/poetry', label: 'Poetry' },
  { href: '/theatre', label: 'Theatre' },
  { href: '/stories', label: 'Stories' },
  { href: '/journal', label: 'Journal' },
];

export function TopBar({ onOpenSearch }: TopBarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#2B2823] bg-[#0C0B0A]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          href="/"
          className="font-literary text-lg font-semibold tracking-tight text-[#EFEAE0] transition-colors hover:text-[#C9A45C] whitespace-nowrap shrink-0 sm:text-xl"
        >
          TEJAS · BENIYAAZ.ROOH
        </Link>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Primary archive rooms"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_LINKS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'text-[#C9A45C]'
                    : 'text-[#9A9285] hover:text-[#EFEAE0]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-[#C9A45C]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2B2823] bg-[#141311] px-4 py-2 text-xs font-medium text-[#EFEAE0] transition-colors hover:border-[#C9A45C]/60 hover:text-[#DEC07C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A45C] whitespace-nowrap shrink-0"
          >
            <Search className="h-3.5 w-3.5 text-[#C9A45C]" />
            <span>Search Archive</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2B2823] bg-[#141311] text-[#EFEAE0] md:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#2B2823] bg-[#141311] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#1C1A17] text-[#C9A45C]'
                      : 'text-[#EFEAE0] hover:bg-[#1C1A17]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

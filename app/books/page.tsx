'use client';

import Image from 'next/image';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BASE_BOOKS_CATALOG } from '@/lib/data/booksCatalog';
import { getBookCoverImage } from '@/lib/media';
import type { BookSection } from '@/lib/types';
import { BookFolioModal } from '@/components/BookFolioModal';

const SECTIONS: { key: 'all' | BookSection; label: string }[] = [
  { key: 'all', label: 'All Editions (11)' },
  { key: 'novels', label: 'Novels' },
  { key: 'theatre', label: 'Stage Drama' },
  { key: 'poetry-collections', label: 'Poetry Anthology' },
  { key: 'special-editions', label: 'Illustrated & MBL' },
];

function BooksLibraryContent() {
  const searchParams = useSearchParams();
  const [sectionFilter, setSectionFilter] = useState<'all' | BookSection>('all');
  const [selectedBookSlug, setSelectedBookSlug] = useState<string | null>(
    () => searchParams.get('book')
  );

  const selectedBook = useMemo(
    () =>
      selectedBookSlug
        ? BASE_BOOKS_CATALOG.find((b) => b.slug === selectedBookSlug) || null
        : null,
    [selectedBookSlug]
  );

  const filteredBooks = useMemo(() => {
    if (sectionFilter === 'all') return BASE_BOOKS_CATALOG;
    return BASE_BOOKS_CATALOG.filter((b) => b.section === sectionFilter);
  }, [sectionFilter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 border-b border-[#2B2823] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#C9A45C]">
            The Library · 580 Preserved Pages
          </p>
          <h1 className="mt-1 font-literary text-4xl font-semibold text-[#EFEAE0]">
            Published Books & Special Editions
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#9A9285]">
            Select any edition to read the PDF directly, switch reading surfaces (Midnight, Warm Paper, Sepia, Daylight), and listen to its studio audiobook voiceover.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-[#2B2823] bg-[#141311] p-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec.key}
              type="button"
              onClick={() => setSectionFilter(sec.key)}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                sectionFilter === sec.key
                  ? 'bg-[#C9A45C] text-[#0C0B0A]'
                  : 'text-[#9A9285] hover:text-[#EFEAE0]'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBooks.map((book) => (
          <button
            key={book.id}
            type="button"
            onClick={() => setSelectedBookSlug(book.slug)}
            className="group flex flex-col overflow-hidden rounded-xl border border-[#2B2823] bg-[#141311] text-left transition-colors hover:border-[#C9A45C]/60"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0C0B0A]">
              <Image
                src={getBookCoverImage(book.slug)}
                alt={book.title}
                fill
                referrerPolicy="no-referrer"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A] via-[#0C0B0A]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs text-[#C9A45C]">
                  {book.genre} · {book.language}
                </p>
                <h2 className="devanagari-verse mt-1 font-literary text-2xl font-semibold text-[#EFEAE0]">
                  {book.title}
                </h2>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                {book.subtitle && (
                  <p className="devanagari-verse text-sm font-medium text-[#EFEAE0]/90">
                    {book.subtitle}
                  </p>
                )}
                <p className="devanagari-verse mt-2 line-clamp-3 text-xs leading-relaxed text-[#9A9285]">
                  {book.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#2B2823] pt-3 text-xs">
                <span className="font-mono-index text-[#9A9285]">
                  {book.pageCount} {book.pageCount === 1 ? 'page' : 'pages'} ·{' '}
                  {book.editionLabel || 'Edition'}
                </span>
                <span className="font-medium text-[#C9A45C]">Open PDF & Folio</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <BookFolioModal
        key={selectedBook?.slug ?? 'closed'}
        book={selectedBook}
        onClose={() => setSelectedBookSlug(null)}
      />
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-[#9A9285]">
          Loading Library...
        </div>
      }
    >
      <BooksLibraryContent />
    </Suspense>
  );
}

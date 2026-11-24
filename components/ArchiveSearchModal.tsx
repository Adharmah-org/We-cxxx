'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Drama, Feather, FileText, Search, Users, X } from 'lucide-react';
import { BASE_BOOKS_CATALOG } from '@/lib/data/booksCatalog';
import { BASE_POEMS_CATALOG } from '@/lib/data/poemsIndex';
import { STORY_ARCHIVES_DATA } from '@/lib/data/storiesArchiveData';
import { THEATRE_ACTS } from '@/lib/data/theatreArchiveData';
import { BASE_JOURNAL_POSTS } from '@/lib/data/journalSeed';

interface ArchiveSearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchHit {
  key: string;
  group: 'Library' | 'Poetry' | 'Stories' | 'Theatre' | 'Journal';
  title: string;
  subtitle: string;
  href: string;
}

export function ArchiveSearchModal({ open, onClose }: ArchiveSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    const out: SearchHit[] = [];

    if (!q) {
      BASE_BOOKS_CATALOG.slice(0, 4).forEach((b) =>
        out.push({
          key: `b-${b.id}`,
          group: 'Library',
          title: b.title,
          subtitle: `${b.genre} · ${b.language} · ${b.pageCount} pages`,
          href: `/books?book=${b.slug}`,
        })
      );
      BASE_POEMS_CATALOG.slice(0, 5).forEach((p) =>
        out.push({
          key: `p-${p.id}`,
          group: 'Poetry',
          title: `${p.title}${p.englishSubtitle ? ` · ${p.englishSubtitle}` : ''}`,
          subtitle: `${p.language} · ${p.category}`,
          href: `/poetry?poem=${p.slug}`,
        })
      );
      BASE_JOURNAL_POSTS.slice(0, 3).forEach((j) =>
        out.push({
          key: `j-${j.id}`,
          group: 'Journal',
          title: j.title,
          subtitle: j.sourceLabel,
          href: `/journal?entry=${j.slug}`,
        })
      );
      return out;
    }

    BASE_BOOKS_CATALOG.filter((b) =>
      `${b.title} ${b.subtitle ?? ''} ${b.genre} ${b.language} ${b.description}`
        .toLowerCase()
        .includes(q)
    )
      .slice(0, 5)
      .forEach((b) =>
        out.push({
          key: `b-${b.id}`,
          group: 'Library',
          title: b.title,
          subtitle: `${b.genre} · ${b.language} · ${b.pageCount} pages`,
          href: `/books?book=${b.slug}`,
        })
      );

    BASE_POEMS_CATALOG.filter((p) =>
      `${p.title} ${p.englishSubtitle ?? ''} ${p.body} ${p.category} ${p.language}`
        .toLowerCase()
        .includes(q)
    )
      .slice(0, 8)
      .forEach((p) =>
        out.push({
          key: `p-${p.id}`,
          group: 'Poetry',
          title: `${p.title}${p.englishSubtitle ? ` · ${p.englishSubtitle}` : ''}`,
          subtitle: `${p.language} · ${p.category}`,
          href: `/poetry?poem=${p.slug}`,
        })
      );

    for (const story of STORY_ARCHIVES_DATA) {
      for (const ch of story.chapters) {
        if (`${story.title} ${ch.title}`.toLowerCase().includes(q)) {
          out.push({
            key: `sc-${story.id}-${ch.numberLabel}`,
            group: 'Stories',
            title: `${ch.numberLabel}. ${ch.title}`,
            subtitle: `${story.title} · Page ${ch.page}`,
            href: `/stories?story=${story.slug}`,
          });
        }
      }
      for (const ch of story.characters) {
        if (`${ch.name} ${ch.role} ${ch.description}`.toLowerCase().includes(q)) {
          out.push({
            key: `char-${ch.id}`,
            group: 'Stories',
            title: ch.name,
            subtitle: `${ch.role} · ${story.title}`,
            href: `/stories?story=${story.slug}`,
          });
        }
      }
    }

    for (const act of THEATRE_ACTS) {
      for (const scene of act.scenes) {
        if (`${act.actNumber} ${act.title} ${scene.sceneNumber} ${scene.title}`.toLowerCase().includes(q)) {
          out.push({
            key: `th-${act.actNumber}-${scene.sceneNumber}`,
            group: 'Theatre',
            title: `${scene.sceneNumber}: ${scene.title}`,
            subtitle: `${act.actNumber} · Page ${scene.page}`,
            href: `/theatre`,
          });
        }
      }
    }

    BASE_JOURNAL_POSTS.filter((j) =>
      `${j.title} ${j.excerpt} ${j.content}`.toLowerCase().includes(q)
    )
      .slice(0, 4)
      .forEach((j) =>
        out.push({
          key: `j-${j.id}`,
          group: 'Journal',
          title: j.title,
          subtitle: j.sourceLabel,
          href: `/journal?entry=${j.slug}`,
        })
      );

    return out.slice(0, 20);
  }, [query]);

  const safeActiveIndex = hits.length > 0 ? activeIndex % hits.length : 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' && hits.length > 0) {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % hits.length);
      } else if (e.key === 'ArrowUp' && hits.length > 0) {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + hits.length) % hits.length);
      } else if (e.key === 'Enter' && hits[safeActiveIndex]) {
        e.preventDefault();
        router.push(hits[safeActiveIndex].href);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hits, safeActiveIndex, onClose, router]);

  if (!open) return null;

  const groups: SearchHit['group'][] = ['Library', 'Poetry', 'Stories', 'Theatre', 'Journal'];

  const renderIcon = (group: SearchHit['group']) => {
    switch (group) {
      case 'Library':
        return <BookOpen className="h-4 w-4 shrink-0 text-[#C9A45C]" />;
      case 'Poetry':
        return <Feather className="h-4 w-4 shrink-0 text-[#C9A45C]" />;
      case 'Stories':
        return <Users className="h-4 w-4 shrink-0 text-[#C9A45C]" />;
      case 'Theatre':
        return <Drama className="h-4 w-4 shrink-0 text-[#C9A45C]" />;
      default:
        return <FileText className="h-4 w-4 shrink-0 text-[#C9A45C]" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search literary archive"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-16 backdrop-blur-sm sm:pt-24"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#2B2823] bg-[#141311] shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[#2B2823] px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-[#C9A45C]" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search books, Marathi/Hindi poems, characters, play scenes..."
            className="w-full bg-transparent text-sm text-[#EFEAE0] placeholder-[#9A9285] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9A9285] transition-colors hover:bg-[#1C1A17] hover:text-[#EFEAE0]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {hits.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-literary text-xl text-[#EFEAE0]">
                No works matched “{query}”.
              </p>
              <p className="mt-1 text-sm text-[#9A9285]">
                Try searching by Marathi, Hindi, or English title, character name, or mood.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => {
                const groupHits = hits
                  .map((hit, idx) => ({ hit, idx }))
                  .filter((item) => item.hit.group === group);
                if (groupHits.length === 0) return null;

                return (
                  <div key={group}>
                    <h3 className="mb-2 text-xs font-medium text-[#9A9285]">
                      {group} ({groupHits.length})
                    </h3>
                    <div className="divide-y divide-[#2B2823]/70 border-y border-[#2B2823]">
                      {groupHits.map(({ hit, idx }) => {
                        const isActive = idx === safeActiveIndex;
                        return (
                          <button
                            key={hit.key}
                            type="button"
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => {
                              router.push(hit.href);
                              onClose();
                            }}
                            className={`flex w-full items-center justify-between gap-4 px-3 py-3 text-left transition-colors ${
                              isActive
                                ? 'bg-[#1C1A17] text-[#DEC07C]'
                                : 'hover:bg-[#1C1A17]/60'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {renderIcon(hit.group)}
                              <div className="min-w-0">
                                <p className="truncate font-literary text-base text-[#EFEAE0]">
                                  {hit.title}
                                </p>
                                <p className="truncate text-xs text-[#9A9285]">
                                  {hit.subtitle}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-medium text-[#C9A45C]">
                              Open
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2B2823] bg-[#0C0B0A] px-5 py-2.5 text-xs text-[#9A9285]">
          <span>Use ↑ ↓ arrows to navigate, Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bookmark,
  Languages,
  Loader2,
  Music2,
  Search,
} from 'lucide-react';
import {
  BASE_POEMS_CATALOG,
  POEM_CATEGORIES,
  POEM_LANGUAGES,
} from '@/lib/data/poemsIndex';
import type { PoemCategory, PoemEntry, PoemLanguage } from '@/lib/types';
import { VoiceoverPlayer } from '@/components/VoiceoverPlayer';
import { PoetrySongStudio } from '@/components/PoetrySongStudio';
import { CompanionYouTubePlayer } from '@/components/CompanionYouTubePlayer';

function PoetryRoomContent() {
  const searchParams = useSearchParams();
  const [languageFilter, setLanguageFilter] = useState<'all' | PoemLanguage>(
    'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | PoemCategory>(
    'all'
  );
  const [search, setSearch] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string>(
    () => searchParams.get('poem') || BASE_POEMS_CATALOG[0].slug
  );
  const selectedPoem = useMemo(
    () =>
      BASE_POEMS_CATALOG.find((p) => p.slug === selectedSlug) ||
      BASE_POEMS_CATALOG[0],
    [selectedSlug]
  );

  // Saved poems in localStorage
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('tejas_saved_poem_ids');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Gemini Translation state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Gemini Recitation audio state
  const [recitationAudio, setRecitationAudio] = useState<string | null>(null);
  const [reciting, setReciting] = useState(false);
  const [reciteError, setReciteError] = useState<string | null>(null);

  // Song studio drawer toggle
  const [showSongStudio, setShowSongStudio] = useState(true);

  const filteredPoems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BASE_POEMS_CATALOG.filter((p) => {
      if (languageFilter !== 'all' && p.language !== languageFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return `${p.title} ${p.englishSubtitle ?? ''} ${p.body} ${p.category}`
        .toLowerCase()
        .includes(q);
    });
  }, [languageFilter, categoryFilter, search]);

  const handleSelectPoem = (poem: PoemEntry) => {
    setSelectedSlug(poem.slug);
    setTranslatedText(null);
    setTranslateError(null);
    setRecitationAudio(null);
    setReciteError(null);
  };

  const toggleSavePoem = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        window.localStorage.setItem('tejas_saved_poem_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleTranslate = async (targetLanguage: 'English' | 'Hindi') => {
    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${selectedPoem.title}\n\n${selectedPoem.body}`,
          targetLanguage,
          context: `Poem by Tejas Purvesh Phirake (${selectedPoem.category})`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed.');
      setTranslatedText(data.translatedText);
    } catch (err) {
      setTranslateError(
        err instanceof Error ? err.message : 'Translation failed.'
      );
    } finally {
      setTranslating(false);
    }
  };

  const handleRecitePoem = async () => {
    setReciting(true);
    setReciteError(null);
    try {
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'poem-recitation',
          title: selectedPoem.title,
          language: selectedPoem.language,
          text: `${selectedPoem.title}. ${selectedPoem.body}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Recitation failed.');
      setRecitationAudio(data.audioBase64);
    } catch (err) {
      setReciteError(
        err instanceof Error ? err.message : 'Could not synthesize recitation.'
      );
    } finally {
      setReciting(false);
    }
  };

  const isSaved = savedIds.includes(selectedPoem.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#2B2823] pb-6">
        <p className="text-xs font-medium text-[#C9A45C]">
          Kavita Kaksh · {BASE_POEMS_CATALOG.length} Poems
        </p>
        <h1 className="mt-1 font-literary text-4xl font-semibold text-[#EFEAE0]">
          The Poetry Room & Song Studio
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9A9285]">
          Multilingual verses in Marathi, Hindi, and English — with spoken-word midnight recitation, literary translation, and acoustic song composition.
        </p>

        {/* Filter Controls */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[#2B2823] bg-[#141311] p-1">
              <button
                type="button"
                onClick={() => setLanguageFilter('all')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  languageFilter === 'all'
                    ? 'bg-[#C9A45C] text-[#0C0B0A]'
                    : 'text-[#9A9285] hover:text-[#EFEAE0]'
                }`}
              >
                All Languages
              </button>
              {POEM_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguageFilter(lang)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    languageFilter === lang
                      ? 'bg-[#C9A45C] text-[#0C0B0A]'
                      : 'text-[#9A9285] hover:text-[#EFEAE0]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <select
              aria-label="Filter poems by category"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'all' | PoemCategory)
              }
              className="h-10 rounded-lg border border-[#2B2823] bg-[#141311] px-3 text-xs text-[#EFEAE0] focus:border-[#C9A45C] focus:outline-none"
            >
              <option value="all">All Moods & Themes</option>
              {POEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9285]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search verse or title..."
              className="h-10 w-full rounded-lg border border-[#2B2823] bg-[#141311] pl-9 pr-3 text-xs text-[#EFEAE0] placeholder-[#9A9285] focus:border-[#C9A45C] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Split: Poem Index + Reading Desk */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left List */}
        <div className="lg:col-span-5">
          <div className="max-h-[640px] divide-y divide-[#2B2823] overflow-y-auto rounded-xl border border-[#2B2823] bg-[#141311]">
            {filteredPoems.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#9A9285]">
                No poems match your current filters.
              </div>
            ) : (
              filteredPoems.map((poem) => {
                const active = poem.id === selectedPoem.id;
                return (
                  <button
                    key={poem.id}
                    type="button"
                    onClick={() => handleSelectPoem(poem)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors ${
                      active
                        ? 'bg-[#1C1A17] text-[#DEC07C]'
                        : 'hover:bg-[#1C1A17]/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="devanagari-verse truncate font-literary text-lg font-medium text-[#EFEAE0]">
                        {poem.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#9A9285]">
                        {poem.language} · {poem.category}
                        {poem.englishSubtitle
                          ? ` · ${poem.englishSubtitle}`
                          : ''}
                      </p>
                    </div>
                    {savedIds.includes(poem.id) && (
                      <Bookmark className="mt-1 h-3.5 w-3.5 shrink-0 fill-[#C9A45C] text-[#C9A45C]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Poem Folio */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2B2823] pb-5">
              <div>
                <p className="text-xs text-[#C9A45C]">
                  {selectedPoem.language} · {selectedPoem.category}
                  {selectedPoem.sourceTitle
                    ? ` · ${selectedPoem.sourceTitle}`
                    : ''}
                </p>
                <h2 className="devanagari-verse mt-2 font-literary text-3xl font-semibold text-[#EFEAE0]">
                  {selectedPoem.title}
                </h2>
                {selectedPoem.englishSubtitle && (
                  <p className="mt-1 font-literary text-lg italic text-[#9A9285]">
                    {selectedPoem.englishSubtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSavePoem(selectedPoem.id)}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                    isSaved
                      ? 'border-[#C9A45C] bg-[#C9A45C]/15 text-[#C9A45C]'
                      : 'border-[#2B2823] bg-[#0C0B0A] text-[#9A9285] hover:text-[#EFEAE0]'
                  }`}
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`}
                  />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Verse Text */}
            <div className="devanagari-verse mt-6 whitespace-pre-line text-lg leading-[1.95] text-[#EFEAE0]">
              {selectedPoem.body}
            </div>

            <CompanionYouTubePlayer
              key={selectedPoem.slug}
              songs={selectedPoem.songs}
            />

            {/* Translation Toolbar */}
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#2B2823] pt-5">
              <span className="flex items-center gap-1.5 text-xs text-[#9A9285]">
                <Languages className="h-3.5 w-3.5 text-[#C9A45C]" />
                Translate:
              </span>
              <button
                type="button"
                disabled={translating}
                onClick={() => handleTranslate('English')}
                className="rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 py-1.5 text-xs font-medium text-[#EFEAE0] transition-colors hover:border-[#C9A45C] disabled:opacity-50"
              >
                English
              </button>
              <button
                type="button"
                disabled={translating}
                onClick={() => handleTranslate('Hindi')}
                className="rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 py-1.5 text-xs font-medium text-[#EFEAE0] transition-colors hover:border-[#C9A45C] disabled:opacity-50"
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => setShowSongStudio((prev) => !prev)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#C9A45C]/40 bg-[#C9A45C]/10 px-3 py-1.5 text-xs font-medium text-[#DEC07C] transition-colors hover:bg-[#C9A45C]/20"
              >
                <Music2 className="h-3.5 w-3.5" />
                <span>Compose Song Below</span>
              </button>
            </div>

            {translating && (
              <div className="mt-4 flex items-center gap-2 text-xs text-[#9A9285]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C9A45C]" />
                <span>Translating verse...</span>
              </div>
            )}

            {translateError && (
              <p className="mt-4 text-xs text-red-300">{translateError}</p>
            )}

            {translatedText && (
              <div className="mt-4 rounded-xl border border-[#2B2823] bg-[#0C0B0A] p-4">
                <p className="text-xs font-medium text-[#C9A45C]">
                  Literary Translation
                </p>
                <div className="devanagari-verse mt-2 whitespace-pre-line text-sm leading-relaxed text-[#EFEAE0]/90">
                  {translatedText}
                </div>
              </div>
            )}
          </div>

          <VoiceoverPlayer
            label="Realistic Spoken-Word Recitation"
            subtitle="Intimate midnight poet vocal recitation"
            audioBase64={recitationAudio}
            loading={reciting}
            error={reciteError}
            onGenerate={handleRecitePoem}
            generateLabel="Recite Poem Aloud"
            downloadName={`${selectedPoem.slug}-recitation.wav`}
          />
        </div>
      </div>

      {/* Poetry Song Studio */}
      {showSongStudio && (
        <div className="mt-12">
          <PoetrySongStudio key={selectedPoem.slug} initialPoem={selectedPoem} />
        </div>
      )}
    </div>
  );
}

export default function PoetryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-[#9A9285]">
          Loading Poetry Room...
        </div>
      }
    >
      <PoetryRoomContent />
    </Suspense>
  );
}

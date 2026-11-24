'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Drama, Feather, Headphones } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ARCHIVE_IMAGES, getBookCoverImage } from '@/lib/media';
import { BASE_BOOKS_CATALOG } from '@/lib/data/booksCatalog';
import { MOOD_DEFINITIONS } from '@/lib/data/moodCatalog';
import { MIDNIGHT_EXCERPTS } from '@/lib/data/midnightExcerpts';
import { THEATRE_VERBATIM_EXCERPTS } from '@/lib/data/theatreArchiveData';
import { STORY_ARCHIVES_DATA } from '@/lib/data/storiesArchiveData';
import type { BookPublication, MoodKey } from '@/lib/types';
import { BookFolioModal } from './BookFolioModal';
import { PoetrySongStudio } from './PoetrySongStudio';
import { VoiceoverPlayer } from './VoiceoverPlayer';

type StudioTab = 'song' | 'theatre' | 'story';

export function HomeShowcase() {
  const [selectedBook, setSelectedBook] = useState<BookPublication | null>(
    null
  );
  const [studioTab, setStudioTab] = useState<StudioTab>('song');
  const [activeMood, setActiveMood] = useState<MoodKey>('viraha');
  const [excerptLang, setExcerptLang] = useState<'orig' | 'hi' | 'en'>('orig');

  // Theatre audition state
  const [theatreAudio, setTheatreAudio] = useState<string | null>(null);
  const [theatreLoading, setTheatreLoading] = useState(false);
  const [theatreError, setTheatreError] = useState<string | null>(null);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);

  // Story audition state
  const [storyAudio, setStoryAudio] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [selectedStoryIdx, setSelectedStoryIdx] = useState(0);

  // Midnight excerpt voiceover state
  const [midnightAudio, setMidnightAudio] = useState<string | null>(null);
  const [midnightLoading, setMidnightLoading] = useState(false);
  const [midnightError, setMidnightError] = useState<string | null>(null);

  const featuredBooks = useMemo(
    () => BASE_BOOKS_CATALOG.filter((b) => b.featured).slice(0, 4),
    []
  );

  const moodExcerpt = useMemo(() => {
    const matches = MIDNIGHT_EXCERPTS.filter((e) => e.moodKey === activeMood);
    return matches[0] || MIDNIGHT_EXCERPTS[0];
  }, [activeMood]);

  const activeScene =
    THEATRE_VERBATIM_EXCERPTS[selectedSceneIdx] || THEATRE_VERBATIM_EXCERPTS[0];
  const activeStory =
    STORY_ARCHIVES_DATA[selectedStoryIdx] || STORY_ARCHIVES_DATA[0];

  const handleTheatreVoiceover = async () => {
    setTheatreLoading(true);
    setTheatreError(null);
    try {
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'theatre-dialogue',
          title: activeScene.heading,
          lines: activeScene.lines,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voiceover failed.');
      setTheatreAudio(data.audioBase64);
    } catch (err) {
      setTheatreError(
        err instanceof Error ? err.message : 'Unable to generate dialogue audio.'
      );
    } finally {
      setTheatreLoading(false);
    }
  };

  const handleStoryVoiceover = async () => {
    setStoryLoading(true);
    setStoryError(null);
    try {
      const sampleChars = activeStory.characters
        .slice(0, 2)
        .map((c) => `${c.name}: ${c.description}`)
        .join(' ');
      const passage = `${activeStory.title}. ${activeStory.subtitle}. ${activeStory.summary} ${sampleChars}`;
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'story-narration',
          title: activeStory.title,
          language: activeStory.language,
          genre: activeStory.genre,
          text: passage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Story narration failed.');
      setStoryAudio(data.audioBase64);
    } catch (err) {
      setStoryError(
        err instanceof Error ? err.message : 'Unable to generate narration.'
      );
    } finally {
      setStoryLoading(false);
    }
  };

  const handleMidnightVoiceover = async () => {
    if (!moodExcerpt) return;
    setMidnightLoading(true);
    setMidnightError(null);
    try {
      const textToRead =
        excerptLang === 'hi'
          ? moodExcerpt.translations.hi
          : excerptLang === 'en'
            ? moodExcerpt.translations.en
            : moodExcerpt.quote;
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'poem-recitation',
          title: moodExcerpt.sourceTitle,
          language: moodExcerpt.language,
          text: textToRead,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Recitation failed.');
      setMidnightAudio(data.audioBase64);
    } catch (err) {
      setMidnightError(
        err instanceof Error ? err.message : 'Unable to generate recitation.'
      );
    } finally {
      setMidnightLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* 1. Split-Screen Editorial Hero */}
      <section aria-labelledby="hero-heading">
        <div className="grid items-stretch gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-6"
          >
            <p className="text-sm font-medium text-[#C9A45C]">
              Tejas Purvesh Phirake · तेजस पुर्वेश फिरके
            </p>
            <h1
              id="hero-heading"
              className="mt-4 max-w-xl text-balance font-literary text-4xl font-semibold leading-[1.08] tracking-tight text-[#EFEAE0] sm:text-5xl lg:text-6xl"
            >
              Some feelings leave. The words stay.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9A9285]">
              Independent literary universe spanning Marathi novels, three-act stage drama, Delhi cyber-thrillers, and multilingual poetry — accompanied by studio-grade voiceovers and acoustic poetry songs.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/books"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#C9A45C] px-6 py-2.5 text-sm font-semibold text-[#0C0B0A] transition-colors hover:bg-[#DEC07C] whitespace-nowrap shrink-0"
              >
                <span>Enter the Library</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#audio-studio"
                className="inline-flex h-11 items-center gap-2 text-sm font-medium text-[#EFEAE0] underline decoration-[#C9A45C]/50 underline-offset-4 transition-colors hover:text-[#C9A45C] whitespace-nowrap shrink-0"
              >
                <Headphones className="h-4 w-4 text-[#C9A45C]" />
                <span>Listen in Studio</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#2B2823] bg-[#141311] lg:h-full lg:aspect-auto lg:min-h-[380px]">
              <Image
                src={ARCHIVE_IMAGES.heroDesk}
                alt="Nocturnal writer's desk with open manuscript notebook and warm brass lamp"
                fill
                priority
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A]/85 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="font-literary text-lg italic text-[#EFEAE0]">
                  “Because some stories end on paper, but continue to live within us.”
                </p>
                <p className="mt-1 text-xs text-[#9A9285]">
                  Marathi · Hindi · Hinglish · English
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Archive Ledger */}
        <div className="mt-10 grid grid-cols-2 divide-y divide-[#2B2823] border-y border-[#2B2823] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            { value: '11', label: 'Published Editions' },
            { value: '93', label: 'Multilingual Poems' },
            { value: '28', label: 'Stage Drama Scenes' },
            { value: '580', label: 'Preserved Pages' },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-5 sm:px-6">
              <p className="font-mono-index text-2xl font-medium text-[#EFEAE0] sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[#9A9285]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Selected Editions */}
      <section className="mt-20" aria-labelledby="featured-editions-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#2B2823] pb-5">
          <div>
            <p className="text-xs font-medium text-[#C9A45C]">
              The Library · 2024–2026
            </p>
            <h2
              id="featured-editions-heading"
              className="mt-1 font-literary text-3xl font-semibold text-[#EFEAE0]"
            >
              Selected Published Works
            </h2>
          </div>
          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C9A45C] transition-colors hover:text-[#DEC07C] whitespace-nowrap"
          >
            <span>View all 11 editions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredBooks.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => setSelectedBook(book)}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#2B2823] bg-[#141311] text-left transition-colors hover:border-[#C9A45C]/60"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0C0B0A]">
                <Image
                  src={getBookCoverImage(book.slug)}
                  alt={book.title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A] via-[#0C0B0A]/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-xs text-[#C9A45C]">
                    {book.genre} · {book.language}
                  </p>
                  <h3 className="devanagari-verse mt-1 font-literary text-xl font-semibold text-[#EFEAE0]">
                    {book.title}
                  </h3>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <p className="line-clamp-3 text-xs leading-relaxed text-[#9A9285]">
                  {book.description}
                </p>
                <p className="mt-4 font-mono-index text-xs text-[#C9A45C]">
                  {book.pageCount} pages · Open Folio
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Studio Audio: Poetry Songs, Theatre Dialogues & Story Voiceover */}
      <section
        id="audio-studio"
        className="mt-20 scroll-mt-24"
        aria-labelledby="audio-studio-heading"
      >
        <div className="flex flex-col gap-4 border-b border-[#2B2823] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-[#C9A45C]">
              Spoken Archive & Audio Studio
            </p>
            <h2
              id="audio-studio-heading"
              className="mt-1 font-literary text-3xl font-semibold text-[#EFEAE0]"
            >
              Poetry Songs, Theatre & Realistic Voiceovers
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#141311] p-1 border border-[#2B2823]">
            {(
              [
                { id: 'song', label: 'Poetry Song Studio', icon: Feather },
                { id: 'theatre', label: 'Theatre Dialogues', icon: Drama },
                { id: 'story', label: 'Story Voiceover', icon: BookOpen },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStudioTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    studioTab === tab.id
                      ? 'bg-[#C9A45C] text-[#0C0B0A]'
                      : 'text-[#9A9285] hover:text-[#EFEAE0]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {studioTab === 'song' && <PoetrySongStudio compact />}

          {studioTab === 'theatre' && (
            <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-5 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-[#2B2823] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-[#C9A45C]">
                    Multi-Speaker Stage Voiceover · मीच प्रश्न, मीच उत्तर
                  </p>
                  <h3 className="devanagari-verse mt-1 font-literary text-2xl font-semibold text-[#EFEAE0]">
                    {activeScene.heading}
                  </h3>
                  <p className="mt-1 text-xs text-[#9A9285]">
                    Dual-character dramatic stage performance with natural Marathi & Hindi cadence
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {THEATRE_VERBATIM_EXCERPTS.map((sc, idx) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setSelectedSceneIdx(idx);
                        setTheatreAudio(null);
                      }}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedSceneIdx === idx
                          ? 'border-[#C9A45C] bg-[#C9A45C]/15 text-[#DEC07C]'
                          : 'border-[#2B2823] bg-[#0C0B0A] text-[#9A9285] hover:text-[#EFEAE0]'
                      }`}
                    >
                      Scene {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-7">
                  {activeScene.lines.map((line, i) =>
                    line.type === 'stage' ? (
                      <p
                        key={i}
                        className="devanagari-verse text-sm italic text-[#9A9285]"
                      >
                        {line.text}
                      </p>
                    ) : (
                      <div
                        key={i}
                        className="rounded-lg border border-[#2B2823]/70 bg-[#0C0B0A]/60 px-4 py-3"
                      >
                        <p className="text-xs font-semibold text-[#C9A45C]">
                          {line.speaker}{' '}
                          {line.cue && (
                            <span className="font-normal text-[#9A9285]">
                              {line.cue}
                            </span>
                          )}
                        </p>
                        <p className="devanagari-verse mt-1 text-base text-[#EFEAE0]">
                          {line.text}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-[#2B2823]">
                    <Image
                      src={ARCHIVE_IMAGES.theatreStage}
                      alt="Revolving black-box theatre stage illuminated by warm overhead spotlight"
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <VoiceoverPlayer
                    label="Stage Dialogue Voiceover"
                    subtitle="Multi-speaker dramatic scene performance"
                    audioBase64={theatreAudio}
                    loading={theatreLoading}
                    error={theatreError}
                    onGenerate={handleTheatreVoiceover}
                    generateLabel="Perform Scene Dialogue"
                    downloadName={`${activeScene.id}-dialogue.wav`}
                  />
                  <Link
                    href="/theatre"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A45C] hover:text-[#DEC07C]"
                  >
                    <span>Explore full 3-act revolving stage & 28 scenes</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {studioTab === 'story' && (
            <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-5 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-[#2B2823] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-[#C9A45C]">
                    Narrative Audiobook Narration
                  </p>
                  <h3 className="devanagari-verse mt-1 font-literary text-2xl font-semibold text-[#EFEAE0]">
                    {activeStory.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#9A9285]">
                    {activeStory.genre} · {activeStory.language} · {activeStory.settingLabel}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {STORY_ARCHIVES_DATA.map((st, idx) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSelectedStoryIdx(idx);
                        setStoryAudio(null);
                      }}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedStoryIdx === idx
                          ? 'border-[#C9A45C] bg-[#C9A45C]/15 text-[#DEC07C]'
                          : 'border-[#2B2823] bg-[#0C0B0A] text-[#9A9285] hover:text-[#EFEAE0]'
                      }`}
                    >
                      {st.title.slice(0, 22)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                  <p className="devanagari-verse text-base leading-relaxed text-[#EFEAE0]">
                    {activeStory.summary}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeStory.characters.slice(0, 2).map((ch) => (
                      <div
                        key={ch.id}
                        className="rounded-lg border border-[#2B2823] bg-[#0C0B0A]/60 p-4"
                      >
                        <p className="font-literary text-lg font-medium text-[#EFEAE0]">
                          {ch.name}
                        </p>
                        <p className="text-xs text-[#C9A45C]">{ch.role}</p>
                        <p className="mt-2 text-xs leading-relaxed text-[#9A9285]">
                          {ch.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <VoiceoverPlayer
                    label="Realistic Story Voiceover"
                    subtitle="Genre-tuned cinematic audiobook narration"
                    audioBase64={storyAudio}
                    loading={storyLoading}
                    error={storyError}
                    onGenerate={handleStoryVoiceover}
                    generateLabel="Narrate Story Dossier"
                    downloadName={`${activeStory.slug}-story.wav`}
                  />
                  <Link
                    href="/stories"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A45C] hover:text-[#DEC07C]"
                  >
                    <span>Open full Story Archives & Custom Chapter Narrator</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Midnight Page & Mood Discovery */}
      <section className="mt-20" aria-labelledby="mood-heading">
        <div className="border-b border-[#2B2823] pb-5">
          <p className="text-xs font-medium text-[#C9A45C]">
            Midnight Page · Choose Your Mood
          </p>
          <h2
            id="mood-heading"
            className="mt-1 font-literary text-3xl font-semibold text-[#EFEAE0]"
          >
            Read by Emotional Resonance
          </h2>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {MOOD_DEFINITIONS.map((mood) => (
            <button
              key={mood.key}
              type="button"
              onClick={() => {
                setActiveMood(mood.key);
                setMidnightAudio(null);
              }}
              className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeMood === mood.key
                  ? 'border-[#C9A45C] bg-[#C9A45C] text-[#0C0B0A]'
                  : 'border-[#2B2823] bg-[#141311] text-[#9A9285] hover:border-[#C9A45C]/50 hover:text-[#EFEAE0]'
              }`}
            >
              {mood.devanagariLabel} · {mood.title}
            </button>
          ))}
        </div>

        {moodExcerpt && (
          <div className="mt-6 rounded-2xl border border-[#2B2823] bg-[#141311] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2823] pb-4">
              <p className="text-xs text-[#9A9285]">
                {moodExcerpt.sourceTitle} · {moodExcerpt.language}
                {moodExcerpt.pageLabel ? ` · ${moodExcerpt.pageLabel}` : ''}
              </p>

              <div className="flex items-center gap-1 rounded-lg bg-[#0C0B0A] p-1 border border-[#2B2823]">
                {(
                  [
                    { key: 'orig', label: 'Original' },
                    { key: 'hi', label: 'हिंदी' },
                    { key: 'en', label: 'English' },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setExcerptLang(l.key)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      excerptLang === l.key
                        ? 'bg-[#C9A45C] text-[#0C0B0A]'
                        : 'text-[#9A9285] hover:text-[#EFEAE0]'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <blockquote className="devanagari-verse mt-6 max-w-3xl font-literary text-2xl leading-relaxed text-[#EFEAE0] sm:text-3xl">
              “
              {excerptLang === 'hi'
                ? moodExcerpt.translations.hi
                : excerptLang === 'en'
                  ? moodExcerpt.translations.en
                  : moodExcerpt.quote}
              ”
            </blockquote>

            <div className="mt-6 max-w-xl">
              <VoiceoverPlayer
                label="Midnight Recitation"
                subtitle="Intimate midnight literary recitation"
                audioBase64={midnightAudio}
                loading={midnightLoading}
                error={midnightError}
                onGenerate={handleMidnightVoiceover}
                generateLabel="Listen to Excerpt"
                downloadName={`midnight-${moodExcerpt.id}.wav`}
              />
            </div>
          </div>
        )}
      </section>

      <BookFolioModal
        key={selectedBook?.slug ?? 'closed'}
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}

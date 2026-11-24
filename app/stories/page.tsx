'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Link2, Users } from 'lucide-react';
import { STORY_ARCHIVES_DATA } from '@/lib/data/storiesArchiveData';
import { STORY_CASE_BOARDS } from '@/lib/data/caseConnectionsData';
import type { StoryArchiveDossier } from '@/lib/types';
import { VoiceoverPlayer } from '@/components/VoiceoverPlayer';

function StoriesArchiveContent() {
  const searchParams = useSearchParams();
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    const slug = searchParams.get('story');
    if (slug && STORY_ARCHIVES_DATA.some((s) => s.slug === slug)) {
      return slug;
    }
    return STORY_ARCHIVES_DATA[0].slug;
  });
  const [narratorVoice, setNarratorVoice] = useState<
    'default' | 'warm-female'
  >('default');
  const [customPassage, setCustomPassage] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStory: StoryArchiveDossier = useMemo(
    () =>
      STORY_ARCHIVES_DATA.find((s) => s.slug === selectedSlug) ||
      STORY_ARCHIVES_DATA[0],
    [selectedSlug]
  );

  const activeBoard = useMemo(
    () =>
      STORY_CASE_BOARDS.find((b) => b.storySlug === activeStory.slug) ||
      STORY_CASE_BOARDS[0],
    [activeStory.slug]
  );

  const handleNarrate = async (overrideText?: string) => {
    setLoading(true);
    setError(null);
    try {
      const textToNarrate =
        (overrideText ?? customPassage).trim() ||
        `${activeStory.title}. ${activeStory.subtitle}. ${activeStory.summary} Key characters: ${activeStory.characters
          .slice(0, 3)
          .map((c) => `${c.name}, ${c.role}. ${c.description}`)
          .join(' ')}`;

      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'story-narration',
          title: activeStory.title,
          language: activeStory.language,
          genre: activeStory.genre,
          voiceStyle: narratorVoice,
          text: textToNarrate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Story voiceover failed.');
      setAudioBase64(data.audioBase64);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to synthesize narration.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header & Story Selector */}
      <div className="flex flex-col gap-5 border-b border-[#2B2823] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#C9A45C]">
            Story Archives · Dossiers & Audiobook Narration
          </p>
          <h1 className="mt-1 font-literary text-4xl font-semibold text-[#EFEAE0]">
            Narrative Worlds & Case Boards
          </h1>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-[#2B2823] bg-[#141311] p-1">
          {STORY_ARCHIVES_DATA.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setSelectedSlug(st.slug);
                setAudioBase64(null);
                setCustomPassage('');
              }}
              className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                selectedSlug === st.slug
                  ? 'bg-[#C9A45C] text-[#0C0B0A]'
                  : 'text-[#9A9285] hover:text-[#EFEAE0]'
              }`}
            >
              {st.title}
            </button>
          ))}
        </div>
      </div>

      {/* Story Dossier + Realistic Voiceover */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-6">
            <p className="text-xs text-[#C9A45C]">
              {activeStory.genre} · {activeStory.language} ·{' '}
              {activeStory.settingLabel}
            </p>
            <h2 className="devanagari-verse mt-2 font-literary text-3xl font-semibold text-[#EFEAE0]">
              {activeStory.title}
            </h2>
            <p className="devanagari-verse mt-1 text-sm text-[#9A9285]">
              {activeStory.subtitle}
            </p>
            <p className="devanagari-verse mt-4 text-base leading-relaxed text-[#EFEAE0]/90">
              {activeStory.summary}
            </p>
          </div>

          {/* Custom / Chapter Story Voiceover Editor */}
          <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-literary text-2xl font-semibold text-[#EFEAE0]">
                  Realistic Story Voiceover Studio
                </h3>
                <p className="mt-0.5 text-xs text-[#9A9285]">
                  Narrates the dossier above or any custom chapter excerpt in natural studio voice.
                </p>
              </div>
              <select
                aria-label="Narrator voice style"
                value={narratorVoice}
                onChange={(e) =>
                  setNarratorVoice(
                    e.target.value as 'default' | 'warm-female'
                  )
                }
                className="h-9 rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 text-xs text-[#EFEAE0] focus:border-[#C9A45C] focus:outline-none"
              >
                <option value="default">
                  Genre Narrator (Noir / Literary Baritone)
                </option>
                <option value="warm-female">
                  Warm Storyteller Female (Kore)
                </option>
              </select>
            </div>

            <textarea
              rows={4}
              value={customPassage}
              onChange={(e) => setCustomPassage(e.target.value)}
              placeholder="Optional: Paste any chapter paragraph, Hinglish thriller scene, or Marathi monologue to hear a realistic studio audiobook narration (leave blank to narrate the full story dossier)..."
              className="devanagari-verse mt-4 w-full rounded-lg border border-[#2B2823] bg-[#0C0B0A] p-3 text-sm text-[#EFEAE0] placeholder-[#9A9285]/60 focus:border-[#C9A45C] focus:outline-none"
            />

            <div className="mt-4">
              <VoiceoverPlayer
                label="Audiobook Narration"
                subtitle="Genre-tuned cinematic studio narration"
                audioBase64={audioBase64}
                loading={loading}
                error={error}
                onGenerate={() => handleNarrate()}
                generateLabel={
                  customPassage.trim()
                    ? 'Narrate Custom Passage'
                    : 'Narrate Story Dossier'
                }
                downloadName={`${activeStory.slug}-voiceover.wav`}
              />
            </div>
          </div>
        </div>

        {/* Chapter Index */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-6">
            <div className="flex items-center gap-2 border-b border-[#2B2823] pb-3">
              <BookOpen className="h-4 w-4 text-[#C9A45C]" />
              <h3 className="font-literary text-xl font-semibold text-[#EFEAE0]">
                Chapter Index ({activeStory.chapters.length})
              </h3>
            </div>
            <div className="mt-3 max-h-[460px] divide-y divide-[#2B2823]/70 overflow-y-auto">
              {activeStory.chapters.map((ch) => (
                <button
                  key={`${ch.numberLabel}-${ch.title}`}
                  type="button"
                  onClick={() => {
                    const line = `${activeStory.title}, Chapter ${ch.numberLabel}: ${ch.title}. ${ch.partLabel || ''} ${ch.note || ''}`;
                    setCustomPassage(line);
                    void handleNarrate(line);
                  }}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:text-[#DEC07C]"
                >
                  <div className="min-w-0">
                    <p className="devanagari-verse truncate text-sm text-[#EFEAE0]">
                      <span className="font-mono-index mr-2 text-xs text-[#C9A45C]">
                        {ch.numberLabel}
                      </span>
                      {ch.title}
                    </p>
                    {ch.partLabel && (
                      <p className="truncate text-xs text-[#9A9285]">
                        {ch.partLabel}
                      </p>
                    )}
                  </div>
                  <span className="font-mono-index shrink-0 text-xs text-[#9A9285]">
                    p.{ch.page}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Character Profiles */}
      <section className="mt-14">
        <div className="flex items-center gap-2 border-b border-[#2B2823] pb-4">
          <Users className="h-5 w-5 text-[#C9A45C]" />
          <h2 className="font-literary text-3xl font-semibold text-[#EFEAE0]">
            Character Dossiers
          </h2>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeStory.characters.map((char) => (
            <div
              key={char.id}
              className="rounded-xl border border-[#2B2823] bg-[#141311] p-5"
            >
              <p className="text-xs font-medium text-[#C9A45C]">
                {char.role} · {char.appearanceLabel}
              </p>
              <h3 className="devanagari-verse mt-1 font-literary text-2xl font-semibold text-[#EFEAE0]">
                {char.name}
              </h3>
              <p className="devanagari-verse mt-2 text-xs leading-relaxed text-[#9A9285]">
                {char.description}
              </p>
              {char.quote && (
                <p className="devanagari-verse mt-3 border-t border-[#2B2823] pt-3 font-literary text-sm italic text-[#EFEAE0]/90">
                  {char.quote}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Investigation / Narrative Connection Board */}
      {activeBoard && (
        <section className="mt-14">
          <div className="flex items-center gap-2 border-b border-[#2B2823] pb-4">
            <Link2 className="h-5 w-5 text-[#C9A45C]" />
            <div>
              <h2 className="font-literary text-3xl font-semibold text-[#EFEAE0]">
                {activeBoard.title}
              </h2>
              <p className="text-xs text-[#9A9285]">{activeBoard.subtitle}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeBoard.connections.map((conn, i) => {
              const fromNode = activeBoard.nodes.find(
                (n) => n.id === conn.fromId
              );
              const toNode = activeBoard.nodes.find((n) => n.id === conn.toId);
              if (!fromNode || !toNode) return null;
              return (
                <div
                  key={`${conn.fromId}-${conn.toId}-${i}`}
                  className="rounded-xl border border-[#2B2823] bg-[#141311] p-4"
                >
                  <p className="text-xs font-medium text-[#C9A45C]">
                    {fromNode.name} → {toNode.name}
                  </p>
                  <p className="devanagari-verse mt-1.5 text-sm text-[#EFEAE0]">
                    {conn.relation}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default function StoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-[#9A9285]">
          Loading Story Archives...
        </div>
      }
    >
      <StoriesArchiveContent />
    </Suspense>
  );
}

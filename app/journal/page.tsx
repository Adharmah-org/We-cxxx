'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Languages, Loader2 } from 'lucide-react';
import { BASE_JOURNAL_POSTS } from '@/lib/data/journalSeed';
import { VoiceoverPlayer } from '@/components/VoiceoverPlayer';

function JournalContent() {
  const searchParams = useSearchParams();
  const [selectedSlug, setSelectedSlug] = useState<string>(
    () => searchParams.get('entry') || BASE_JOURNAL_POSTS[0].slug
  );
  const selectedPost = useMemo(
    () =>
      BASE_JOURNAL_POSTS.find((j) => j.slug === selectedSlug) ||
      BASE_JOURNAL_POSTS[0],
    [selectedSlug]
  );
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async (targetLanguage: 'English' | 'Hindi') => {
    setTranslating(true);
    setError(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${selectedPost.title}\n\n${selectedPost.content}`,
          targetLanguage,
          context: selectedPost.sourceLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed.');
      setTranslated(data.translatedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  const handleVoiceover = async () => {
    setLoadingAudio(true);
    setError(null);
    try {
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'story-narration',
          title: selectedPost.title,
          language: selectedPost.language,
          text: `${selectedPost.title}. ${selectedPost.content}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voiceover failed.');
      setAudioBase64(data.audioBase64);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not synthesize voiceover.'
      );
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#2B2823] pb-6">
        <p className="text-xs font-medium text-[#C9A45C]">
          Unsaid Journal · Author’s Archive (2024–2026)
        </p>
        <h1 className="mt-1 font-literary text-4xl font-semibold text-[#EFEAE0]">
          Prefaces, Reflections & Author’s Notes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9A9285]">
          Personal introductions, midnight notes, and literary prefaces by Tejas Purvesh Phirake (TEJAS · BENIYAAZ.ROOH).
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-4">
          {BASE_JOURNAL_POSTS.map((post) => {
            const active = post.id === selectedPost.id;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => {
                  setSelectedSlug(post.slug);
                  setTranslated(null);
                  setAudioBase64(null);
                  setError(null);
                }}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-[#C9A45C] bg-[#1C1A17]'
                    : 'border-[#2B2823] bg-[#141311] hover:border-[#C9A45C]/40'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-[#C9A45C]">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{post.language}</span>
                  <span>·</span>
                  <span>{post.publishedAt}</span>
                </div>
                <h2 className="devanagari-verse mt-1.5 font-literary text-lg font-semibold text-[#EFEAE0]">
                  {post.title}
                </h2>
                <p className="devanagari-verse mt-1 line-clamp-2 text-xs text-[#9A9285]">
                  {post.excerpt}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-6 lg:col-span-8">
          <article className="rounded-xl border border-[#2B2823] bg-[#141311] p-6 sm:p-8">
            <p className="text-xs font-medium text-[#C9A45C]">
              {selectedPost.sourceLabel} · {selectedPost.publishedAt}
            </p>
            <h2 className="devanagari-verse mt-2 font-literary text-3xl font-semibold text-[#EFEAE0]">
              {selectedPost.title}
            </h2>
            <div className="devanagari-verse mt-6 whitespace-pre-line text-base leading-relaxed text-[#EFEAE0]/90">
              {selectedPost.content}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#2B2823] pt-5">
              <span className="flex items-center gap-1.5 text-xs text-[#9A9285]">
                <Languages className="h-3.5 w-3.5 text-[#C9A45C]" />
                Translate Note:
              </span>
              <button
                type="button"
                disabled={translating}
                onClick={() => handleTranslate('English')}
                className="rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 py-1.5 text-xs font-medium text-[#EFEAE0] hover:border-[#C9A45C] disabled:opacity-50"
              >
                English
              </button>
              <button
                type="button"
                disabled={translating}
                onClick={() => handleTranslate('Hindi')}
                className="rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 py-1.5 text-xs font-medium text-[#EFEAE0] hover:border-[#C9A45C] disabled:opacity-50"
              >
                हिंदी
              </button>
            </div>

            {translating && (
              <div className="mt-4 flex items-center gap-2 text-xs text-[#9A9285]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C9A45C]" />
                <span>Translating author’s note...</span>
              </div>
            )}

            {translated && (
              <div className="mt-4 rounded-xl border border-[#2B2823] bg-[#0C0B0A] p-4">
                <p className="text-xs font-medium text-[#C9A45C]">
                  Translated Reflection
                </p>
                <div className="devanagari-verse mt-2 whitespace-pre-line text-sm leading-relaxed text-[#EFEAE0]/90">
                  {translated}
                </div>
              </div>
            )}
          </article>

          <VoiceoverPlayer
            label="Author’s Note Voiceover"
            subtitle="Intimate reflective reading of the author’s note"
            audioBase64={audioBase64}
            loading={loadingAudio}
            error={error}
            onGenerate={handleVoiceover}
            generateLabel="Listen to Author’s Note"
            downloadName={`${selectedPost.slug}.wav`}
          />
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-[#9A9285]">
          Loading Unsaid Journal...
        </div>
      }
    >
      <JournalContent />
    </Suspense>
  );
}

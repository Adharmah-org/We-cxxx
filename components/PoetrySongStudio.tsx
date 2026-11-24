'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Disc3,
  Download,
  Loader2,
  Music2,
  Pause,
  Play,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react';
import { AcousticScorePlayer } from '@/lib/acousticSynth';
import type { PoemEntry, PoetrySongComposition } from '@/lib/types';
import { BASE_POEMS_CATALOG } from '@/lib/data/poemsIndex';
import { CompanionYouTubePlayer } from './CompanionYouTubePlayer';

interface PoetrySongStudioProps {
  initialPoem?: PoemEntry;
  compact?: boolean;
}

export function PoetrySongStudio({
  initialPoem,
  compact = false,
}: PoetrySongStudioProps) {
  const featuredPoems = BASE_POEMS_CATALOG.slice(0, 18);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialPoem?.slug || featuredPoems[0]?.slug || 'nasleli-ti'
  );
  const [vocalTone, setVocalTone] = useState<
    'intimate-male' | 'warm-female' | 'deep-baritone'
  >('intimate-male');
  const [direction, setDirection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composition, setComposition] = useState<PoetrySongComposition | null>(
    null
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [mixMode, setMixMode] = useState<'both' | 'vocals' | 'music'>('both');
  const [musicVolume, setMusicVolume] = useState(0.24);
  const [vocalVolume, setVocalVolume] = useState(0.95);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<AcousticScorePlayer | null>(null);

  useEffect(() => {
    return () => {
      synthRef.current?.stop();
    };
  }, []);

  const activePoem =
    BASE_POEMS_CATALOG.find((p) => p.slug === selectedSlug) ||
    initialPoem ||
    featuredPoems[0];

  const stopAllPlayback = () => {
    setIsPlaying(false);
    synthRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleCompose = async () => {
    if (!activePoem) return;
    stopAllPlayback();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/poetry-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activePoem.title,
          language: activePoem.language,
          category: activePoem.category,
          poemBody: activePoem.body,
          vocalTone,
          customPrompt: direction.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not compose poetry song.');
      }
      setComposition(data as PoetrySongComposition);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to compose poetry song.'
      );
    } finally {
      setLoading(false);
    }
  };

  const startPlayback = (modeOverride?: 'both' | 'vocals' | 'music') => {
    if (!composition) return;
    const mode = modeOverride ?? mixMode;
    stopAllPlayback();
    setIsPlaying(true);

    if (mode === 'both' || mode === 'music') {
      if (!synthRef.current) {
        synthRef.current = new AcousticScorePlayer();
      }
      synthRef.current.start({
        tempoBpm: composition.tempoBpm || 74,
        rootMidi: composition.rootMidi || 48,
        scaleIntervals: composition.scaleIntervals || [0, 2, 4, 7, 9],
        volume: musicVolume,
      });
    }

    if ((mode === 'both' || mode === 'vocals') && audioRef.current) {
      audioRef.current.volume = vocalVolume;
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {
        // user gesture handled by click
      });
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAllPlayback();
    } else {
      startPlayback();
    }
  };

  const handleMusicVolume = (val: number) => {
    setMusicVolume(val);
    synthRef.current?.setVolume(val);
  };

  const handleVocalVolume = (val: number) => {
    setVocalVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const vocalSrc =
    composition?.vocalAudioBase64 && composition.vocalMimeType
      ? `data:${composition.vocalMimeType};base64,${composition.vocalAudioBase64}`
      : null;

  return (
    <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#2B2823] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#C9A45C]">
            Poetry Song Studio
          </p>
          <h3 className="mt-1 font-literary text-2xl font-semibold text-[#EFEAE0] sm:text-3xl">
            Lyrics, Raga Score & Studio Vocals
          </h3>
          <p className="mt-1.5 max-w-2xl text-sm text-[#9A9285]">
            Transforms Tejas’s poems into original sung verses paired with a live acoustic score and studio vocal delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCompose}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#C9A45C] px-5 py-2.5 text-sm font-semibold text-[#0C0B0A] transition-colors hover:bg-[#DEC07C] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Composing Song & Vocals...</span>
            </>
          ) : (
            <>
              <Music2 className="h-4 w-4" />
              <span>
                {composition ? 'Recompose Song' : 'Compose Lyrics & Music'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Controls */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="song-poem-select"
            className="block text-xs font-medium text-[#9A9285]"
          >
            Source Poem
          </label>
          <select
            id="song-poem-select"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 text-sm text-[#EFEAE0] focus:border-[#C9A45C] focus:outline-none"
          >
            {featuredPoems.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.title} ({p.language} · {p.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="song-voice-tone"
            className="block text-xs font-medium text-[#9A9285]"
          >
            Vocal Persona
          </label>
          <select
            id="song-voice-tone"
            value={vocalTone}
            onChange={(e) =>
              setVocalTone(
                e.target.value as
                  | 'intimate-male'
                  | 'warm-female'
                  | 'deep-baritone'
              )
            }
            className="mt-1.5 h-11 w-full rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 text-sm text-[#EFEAE0] focus:border-[#C9A45C] focus:outline-none"
          >
            <option value="intimate-male">Intimate Acoustic Male (Charon)</option>
            <option value="warm-female">Warm Lyricist Female (Kore)</option>
            <option value="deep-baritone">Deep Ghazal Baritone (Fenrir)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="song-direction"
            className="block text-xs font-medium text-[#9A9285]"
          >
            Musical Direction (Optional)
          </label>
          <input
            id="song-direction"
            type="text"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="e.g. Rainy midnight acoustic ghazal, slow tempo"
            className="mt-1.5 h-11 w-full rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 text-sm text-[#EFEAE0] placeholder-[#9A9285]/60 focus:border-[#C9A45C] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {activePoem?.songs && activePoem.songs.length > 0 && (
        <div className="mt-5">
          <CompanionYouTubePlayer
            key={`studio-${activePoem.slug}`}
            songs={activePoem.songs}
            compact
          />
        </div>
      )}

      {/* Result Stage */}
      {composition ? (
        <div className="mt-6 grid gap-6 border-t border-[#2B2823] pt-6 lg:grid-cols-12">
          {/* Lyrics Sheet */}
          <div className={compact ? 'lg:col-span-7' : 'lg:col-span-7'}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-literary text-2xl font-semibold text-[#EFEAE0]">
                {composition.songTitle}
              </h4>
              <span className="font-mono-index text-xs text-[#C9A45C]">
                {composition.tempoBpm} BPM · {composition.chordProgression.join(' – ')}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#9A9285]">
              {composition.ragaMood} · {composition.styleTag}
            </p>

            <div className="mt-5 space-y-5">
              {composition.sections.map((section, idx) => (
                <div
                  key={`${section.label}-${idx}`}
                  className="border-t border-[#2B2823]/70 pt-3"
                >
                  <p className="text-xs font-medium text-[#C9A45C]">
                    {section.label}
                  </p>
                  <div className="devanagari-verse mt-1.5 space-y-1 text-base text-[#EFEAE0]">
                    {section.lines.map((line, lIdx) => (
                      <p key={lIdx}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acoustic Studio Mixer */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-[#2B2823] bg-[#0C0B0A] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Disc3
                    className={`h-5 w-5 text-[#C9A45C] ${
                      isPlaying ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="text-sm font-medium text-[#EFEAE0]">
                    Studio Mix Console
                  </span>
                </div>
                {vocalSrc && (
                  <a
                    href={vocalSrc}
                    download={`${activePoem.slug}-song-vocals.wav`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C9A45C] hover:text-[#DEC07C]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Save Vocal WAV</span>
                  </a>
                )}
              </div>

              {/* Mix Mode Segmented Control */}
              <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-[#141311] p-1">
                {(
                  [
                    { key: 'both', label: 'Full Mix' },
                    { key: 'vocals', label: 'Vocals Only' },
                    { key: 'music', label: 'Score Only' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setMixMode(m.key);
                      if (isPlaying) startPlayback(m.key);
                    }}
                    className={`rounded-md px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      mixMode === m.key
                        ? 'bg-[#C9A45C] text-[#0C0B0A]'
                        : 'text-[#9A9285] hover:text-[#EFEAE0]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={togglePlay}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#C9A45C]/50 bg-[#1C1A17] text-sm font-medium text-[#EFEAE0] transition-colors hover:bg-[#C9A45C] hover:text-[#0C0B0A]"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>Stop Performance</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Play Poetry Song</span>
                  </>
                )}
              </button>

              {/* Volume Sliders */}
              <div className="mt-5 space-y-3 border-t border-[#2B2823] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-[#9A9285]">
                    <Volume2 className="h-3.5 w-3.5 text-[#C9A45C]" />
                    Vocals
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={vocalVolume}
                    onChange={(e) => handleVocalVolume(Number(e.target.value))}
                    aria-label="Vocal volume"
                    className="h-1.5 w-36 cursor-pointer accent-[#C9A45C]"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-[#9A9285]">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#C9A45C]" />
                    Acoustic Score
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.45}
                    step={0.02}
                    value={musicVolume}
                    onChange={(e) => handleMusicVolume(Number(e.target.value))}
                    aria-label="Acoustic score volume"
                    className="h-1.5 w-36 cursor-pointer accent-[#C9A45C]"
                  />
                </div>
              </div>

              {vocalSrc && (
                <audio
                  ref={audioRef}
                  src={vocalSrc}
                  onEnded={() => {
                    // Let acoustic score trail gently for 1.5s then fade stop
                    window.setTimeout(() => stopAllPlayback(), 1500);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        activePoem && (
          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-[#2B2823] pt-5 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-xs text-[#9A9285]">
                Selected Poem · {activePoem.language} · {activePoem.category}
              </p>
              <p className="devanagari-verse mt-1 truncate font-literary text-lg text-[#EFEAE0]">
                {activePoem.title}
                {activePoem.englishSubtitle
                  ? ` — ${activePoem.englishSubtitle}`
                  : ''}
              </p>
            </div>
            <p className="text-xs text-[#9A9285] shrink-0">
              Click “Compose Lyrics & Music” to generate original song lyrics and studio vocals.
            </p>
          </div>
        )
      )}
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Drama, Plus, RotateCw, Trash2 } from 'lucide-react';
import { ARCHIVE_IMAGES } from '@/lib/media';
import {
  DIRECTOR_NOTES,
  THEATRE_ACT_QUESTIONS,
  THEATRE_ACTS,
  THEATRE_CAST,
  THEATRE_PLAY_META,
  THEATRE_STAGE_STOPS,
  THEATRE_VERBATIM_EXCERPTS,
} from '@/lib/data/theatreArchiveData';
import type { TheatreExcerptLine } from '@/lib/types';
import { VoiceoverPlayer } from '@/components/VoiceoverPlayer';

export default function TheatrePage() {
  const [stageStopIdx, setStageStopIdx] = useState(0);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [mode, setMode] = useState<'excerpts' | 'custom'>('excerpts');

  // Custom dialogue rehearsal lines
  const [customLines, setCustomLines] = useState<TheatreExcerptLine[]>([
    {
      type: 'dialogue',
      speaker: 'अर्जुन',
      cue: '(शांतपणे)',
      text: 'सगळे विचारतात किती मार्क पडले. कुणीच विचारत नाही मला कसं वाटतंय.',
    },
    {
      type: 'dialogue',
      speaker: 'आवाज',
      cue: '(हळूवार)',
      text: 'आणि तू स्वतःला कधी विचारलंस का, तुला काय हवंय?',
    },
  ]);

  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStop = THEATRE_STAGE_STOPS[stageStopIdx] || THEATRE_STAGE_STOPS[0];
  const activeScene =
    THEATRE_VERBATIM_EXCERPTS[selectedSceneIdx] || THEATRE_VERBATIM_EXCERPTS[0];

  const handlePerformDialogue = async () => {
    setLoading(true);
    setError(null);
    try {
      const linesToPerform =
        mode === 'excerpts' ? activeScene.lines : customLines;
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'theatre-dialogue',
          title:
            mode === 'excerpts' ? activeScene.heading : 'Custom Stage Rehearsal',
          lines: linesToPerform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Theatre voiceover failed.');
      setAudioBase64(data.audioBase64);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to synthesize stage dialogue.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCustomLine = (
    idx: number,
    patch: Partial<TheatreExcerptLine>
  ) => {
    setCustomLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  };

  const addCustomLine = () => {
    setCustomLines((prev) => [
      ...prev,
      {
        type: 'dialogue',
        speaker: prev.length % 2 === 0 ? 'अर्जुन' : 'आवाज',
        text: '',
      },
    ]);
  };

  const removeCustomLine = (idx: number) => {
    if (customLines.length <= 1) return;
    setCustomLines((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="grid items-stretch gap-8 border-b border-[#2B2823] pb-10 lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="text-xs font-medium text-[#C9A45C]">
            The Theatre · {THEATRE_PLAY_META.pageCount} Pages · 3 Acts · 28 Scenes
          </p>
          <h1 className="devanagari-verse mt-2 font-literary text-4xl font-semibold text-[#EFEAE0]">
            {THEATRE_PLAY_META.title}
          </h1>
          <p className="devanagari-verse mt-2 text-base text-[#9A9285]">
            {THEATRE_PLAY_META.subtitle} · {THEATRE_PLAY_META.authorCredit}
          </p>
          <p className="devanagari-verse mt-4 text-sm leading-relaxed text-[#EFEAE0]/90">
            {THEATRE_PLAY_META.stageArchitecture}
          </p>
          <p className="mt-3 font-mono-index text-xs text-[#C9A45C]">
            {THEATRE_PLAY_META.approximateRuntime}
          </p>
        </div>

        <div className="lg:col-span-5">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#2B2823] lg:h-full">
            <Image
              src={ARCHIVE_IMAGES.theatreStage}
              alt="Minimalist revolving theatre stage under warm spotlight"
              fill
              referrerPolicy="no-referrer"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="devanagari-verse text-xs text-[#EFEAE0]">
                {THEATRE_PLAY_META.musicNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Speaker Theatre Dialogue Voiceover Studio */}
      <section className="mt-12" aria-labelledby="dialogue-studio-heading">
        <div className="flex flex-col gap-4 border-b border-[#2B2823] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-[#C9A45C]">
              Multi-Speaker Stage Voiceover · Three-Act Rehearsal Studio
            </p>
            <h2
              id="dialogue-studio-heading"
              className="mt-1 font-literary text-3xl font-semibold text-[#EFEAE0]"
            >
              Stage Dialogue Performance Studio
            </h2>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#2B2823] bg-[#141311] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('excerpts');
                setAudioBase64(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'excerpts'
                  ? 'bg-[#C9A45C] text-[#0C0B0A]'
                  : 'text-[#9A9285] hover:text-[#EFEAE0]'
              }`}
            >
              Script Excerpts
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('custom');
                setAudioBase64(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'custom'
                  ? 'bg-[#C9A45C] text-[#0C0B0A]'
                  : 'text-[#9A9285] hover:text-[#EFEAE0]'
              }`}
            >
              Custom Dialogue Rehearsal
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            {mode === 'excerpts' ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {THEATRE_VERBATIM_EXCERPTS.map((sc, idx) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setSelectedSceneIdx(idx);
                        setAudioBase64(null);
                      }}
                      className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedSceneIdx === idx
                          ? 'border-[#C9A45C] bg-[#C9A45C]/15 text-[#DEC07C]'
                          : 'border-[#2B2823] bg-[#141311] text-[#9A9285] hover:text-[#EFEAE0]'
                      }`}
                    >
                      {sc.heading}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 rounded-xl border border-[#2B2823] bg-[#141311] p-5">
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
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-[#2B2823] bg-[#141311] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#9A9285]">
                    Edit or add Marathi, Hindi, or English dialogue lines for two stage voices.
                  </p>
                  <button
                    type="button"
                    onClick={addCustomLine}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#2B2823] bg-[#0C0B0A] px-3 py-1.5 text-xs font-medium text-[#C9A45C] hover:border-[#C9A45C]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Line</span>
                  </button>
                </div>

                {customLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 rounded-lg border border-[#2B2823] bg-[#0C0B0A] p-3 sm:grid-cols-12"
                  >
                    <input
                      type="text"
                      value={line.speaker || ''}
                      onChange={(e) =>
                        updateCustomLine(idx, { speaker: e.target.value })
                      }
                      placeholder="Character"
                      className="h-9 rounded border border-[#2B2823] bg-[#141311] px-2.5 text-xs text-[#C9A45C] focus:border-[#C9A45C] focus:outline-none sm:col-span-3"
                    />
                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) =>
                        updateCustomLine(idx, { text: e.target.value })
                      }
                      placeholder="Dialogue line..."
                      className="h-9 rounded border border-[#2B2823] bg-[#141311] px-2.5 text-sm text-[#EFEAE0] focus:border-[#C9A45C] focus:outline-none sm:col-span-8"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomLine(idx)}
                      aria-label="Remove line"
                      className="inline-flex h-9 items-center justify-center rounded border border-[#2B2823] text-[#9A9285] hover:text-red-300 sm:col-span-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-5">
            <VoiceoverPlayer
              label="Multi-Speaker Dramatic Voiceover"
              subtitle="Realistic dual-character Marathi/Hindi dialogue performance"
              audioBase64={audioBase64}
              loading={loading}
              error={error}
              onGenerate={handlePerformDialogue}
              generateLabel="Synthesize Stage Dialogue"
              downloadName="tejas-theatre-dialogue.wav"
            />

            <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-[#C9A45C]">
                <Drama className="h-4 w-4" />
                <span>Director’s Notes</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#9A9285]">
                {DIRECTOR_NOTES.map((note, i) => (
                  <li key={i} className="devanagari-verse">
                    · {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Revolving 5-Stop Stage Visualizer */}
      <section className="mt-16" aria-labelledby="revolving-stage-heading">
        <div className="border-b border-[#2B2823] pb-4">
          <p className="text-xs font-medium text-[#C9A45C]">
            गोल फिरता मंच · Revolving Stage Architecture
          </p>
          <h2
            id="revolving-stage-heading"
            className="mt-1 font-literary text-3xl font-semibold text-[#EFEAE0]"
          >
            Five Stage Positions
          </h2>
        </div>

        <div className="mt-6 grid items-center gap-8 rounded-2xl border border-[#2B2823] bg-[#141311] p-6 lg:grid-cols-12">
          <div className="flex flex-col items-center justify-center lg:col-span-4">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[#C9A45C]/40 bg-[#0C0B0A]">
              <div
                style={{ transform: `rotate(${activeStop.angle}deg)` }}
                className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-[#C9A45C]/60 transition-transform duration-500"
              >
                <div className="h-3 w-3 -translate-y-20 rounded-full bg-[#C9A45C]" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <RotateCw className="h-5 w-5 text-[#C9A45C]" />
                <p className="devanagari-verse mt-2 font-literary text-lg font-semibold text-[#EFEAE0]">
                  {activeStop.label}
                </p>
                <p className="font-mono-index text-xs text-[#9A9285]">
                  {activeStop.angle}° · Page {activeStop.page}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-8">
            <div className="flex flex-wrap gap-2">
              {THEATRE_STAGE_STOPS.map((stop, idx) => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => setStageStopIdx(idx)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    stageStopIdx === idx
                      ? 'border-[#C9A45C] bg-[#C9A45C] text-[#0C0B0A]'
                      : 'border-[#2B2823] bg-[#0C0B0A] text-[#9A9285] hover:text-[#EFEAE0]'
                  }`}
                >
                  {stop.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 border-t border-[#2B2823] pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-[#C9A45C]">Scene & Props</p>
                <p className="devanagari-verse mt-1 text-sm text-[#EFEAE0]">
                  {activeStop.sceneRef}
                </p>
                <p className="devanagari-verse mt-1 text-xs text-[#9A9285]">
                  {activeStop.props.join(' · ')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#C9A45C]">
                  Lighting & Sound Cue
                </p>
                <p className="devanagari-verse mt-1 text-xs leading-relaxed text-[#EFEAE0]/90">
                  {activeStop.lighting}
                </p>
                <p className="devanagari-verse mt-1 text-xs text-[#9A9285]">
                  {activeStop.soundCue}
                </p>
              </div>
            </div>
            <p className="devanagari-verse text-sm text-[#9A9285]">
              {activeStop.atmosphere}
            </p>
          </div>
        </div>
      </section>

      {/* Acts, Scenes & Cast */}
      <section className="mt-16 grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <h2 className="font-literary text-3xl font-semibold text-[#EFEAE0]">
            Complete 3-Act Scene Index
          </h2>
          {THEATRE_ACTS.map((act, idx) => {
            const silentQ = THEATRE_ACT_QUESTIONS.find((q) => q.actIndex === idx);
            return (
              <div
                key={act.actNumber}
                className="rounded-xl border border-[#2B2823] bg-[#141311] p-5"
              >
                <div className="flex items-baseline justify-between border-b border-[#2B2823] pb-3">
                  <h3 className="devanagari-verse font-literary text-2xl font-semibold text-[#EFEAE0]">
                    {act.actNumber} · {act.title}
                  </h3>
                  <span className="font-mono-index text-xs text-[#C9A45C]">
                    Page {act.actPage}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {act.scenes.map((sc) => (
                    <div
                      key={sc.sceneNumber}
                      className="flex items-center justify-between rounded-lg border border-[#2B2823]/60 bg-[#0C0B0A]/50 px-3 py-2 text-xs"
                    >
                      <span className="devanagari-verse text-[#EFEAE0]">
                        {sc.sceneNumber}: {sc.title}
                      </span>
                      <span className="font-mono-index text-[#9A9285]">
                        p.{sc.page}
                      </span>
                    </div>
                  ))}
                </div>
                {silentQ && (
                  <div className="mt-4 border-t border-[#2B2823] pt-3">
                    <p className="text-xs font-medium text-[#C9A45C]">
                      {silentQ.heading} ({silentQ.instruction})
                    </p>
                    <p className="devanagari-verse mt-1 text-sm italic text-[#EFEAE0]/90">
                      “{silentQ.promptMarathi}”
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <h2 className="font-literary text-3xl font-semibold text-[#EFEAE0]">
            Cast Directory
          </h2>
          <div className="mt-6 divide-y divide-[#2B2823] rounded-xl border border-[#2B2823] bg-[#141311]">
            {THEATRE_CAST.map((c) => (
              <div key={c.name} className="px-4 py-3.5">
                <p className="devanagari-verse font-literary text-lg font-medium text-[#EFEAE0]">
                  {c.name}
                </p>
                <p className="devanagari-verse mt-0.5 text-xs text-[#9A9285]">
                  {c.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

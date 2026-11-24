'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BookOpen, Download, ExternalLink, FileText, X } from 'lucide-react';
import { getBookCoverImage } from '@/lib/media';
import type { BookPublication } from '@/lib/types';
import { VoiceoverPlayer } from './VoiceoverPlayer';

interface BookFolioModalProps {
  book: BookPublication | null;
  onClose: () => void;
}

type SurfaceTheme = 'midnight' | 'warm-paper' | 'sepia' | 'daylight';
type FolioTab = 'pdf' | 'overview';

const SURFACE_CLASSES: Record<SurfaceTheme, string> = {
  midnight: 'bg-[#141311] text-[#EFEAE0] border-[#2B2823]',
  'warm-paper': 'bg-[#F4EFE6] text-[#1D1915] border-[#D8CEBE]',
  sepia: 'bg-[#ECE0CB] text-[#2A2016] border-[#CDBEA5]',
  daylight: 'bg-[#FFFFFF] text-[#141413] border-[#E4E4E7]',
};

export function BookFolioModal({ book, onClose }: BookFolioModalProps) {
  const [surface, setSurface] = useState<SurfaceTheme>('warm-paper');
  const [tab, setTab] = useState<FolioTab>('pdf');
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!book) return null;

  const isLight = surface !== 'midnight';
  const coverImage = getBookCoverImage(book.slug);

  const handleGenerateNarration = async () => {
    setLoading(true);
    setError(null);
    try {
      const passage = `${book.title}. ${book.subtitle ? book.subtitle + '. ' : ''}${book.description} ${book.structureHighlights.join('. ')}`;
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'story-narration',
          title: book.title,
          language: book.language,
          genre: book.genre,
          text: passage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voiceover failed.');
      setAudioBase64(data.audioBase64);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to generate voiceover.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={book.title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border p-4 shadow-2xl transition-colors sm:p-6 ${SURFACE_CLASSES[surface]}`}
      >
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/15 pb-3">
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium opacity-85">
            <BookOpen className="h-4 w-4 shrink-0 text-[#C9A45C]" />
            <span className="truncate">
              {book.title} · {book.language} · {book.pageCount}{' '}
              {book.pageCount === 1 ? 'page' : 'pages'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PDF / Overview Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-current/15 p-1">
              <button
                type="button"
                onClick={() => setTab('pdf')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  tab === 'pdf'
                    ? 'bg-[#C9A45C] text-[#0C0B0A]'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>PDF Reader</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('overview')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  tab === 'overview'
                    ? 'bg-[#C9A45C] text-[#0C0B0A]'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                Synopsis & Audio
              </button>
            </div>

            {/* Reading Paper Surface */}
            <div className="flex items-center gap-1 rounded-lg border border-current/15 p-1">
              {(
                [
                  { id: 'midnight', label: 'Midnight' },
                  { id: 'warm-paper', label: 'Paper' },
                  { id: 'sepia', label: 'Sepia' },
                  { id: 'daylight', label: 'Day' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSurface(m.id)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    surface === m.id
                      ? 'bg-[#C9A45C] text-[#0C0B0A]'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Actions: Open Tab, Download */}
            <a
              href={book.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-current/20 px-3 text-xs font-medium transition-colors hover:border-[#C9A45C] whitespace-nowrap"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#C9A45C]" />
              <span>Open PDF in Tab</span>
            </a>

            <a
              href={book.pdfUrl}
              download={book.originalFilename}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-current/20 px-3 text-xs font-medium transition-colors hover:border-[#C9A45C] whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-[#C9A45C]" />
              <span>Download</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close folio reader"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-current/15 transition-colors hover:border-[#C9A45C]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="mt-4 flex flex-1 flex-col overflow-hidden">
          {tab === 'pdf' ? (
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-current/20 bg-[#1C1A17]">
              <div className="flex items-center justify-between border-b border-current/15 bg-current/5 px-4 py-2 text-xs opacity-80">
                <span>Reading: {book.originalFilename} ({book.pageCount} pages)</span>
                <a
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#C9A45C] underline hover:text-[#DEC07C]"
                >
                  Open full screen viewer ↗
                </a>
              </div>
              <div className="relative flex-1 bg-white">
                <iframe
                  title={`${book.title} PDF Document Viewer`}
                  src={`${book.pdfUrl}#view=FitH`}
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-8 overflow-y-auto py-2 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-current/15 bg-[#0C0B0A]">
                  <Image
                    src={coverImage}
                    alt={book.title}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-[#EFEAE0]">
                    <p className="text-xs text-[#C9A45C]">
                      {book.editionLabel || book.genre}
                    </p>
                    <p className="mt-1 font-literary text-lg font-semibold leading-snug">
                      {book.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 md:col-span-8">
                <div>
                  <p className="text-xs font-medium text-[#C9A45C]">
                    {book.authorCreditLabel || book.author}
                  </p>
                  <h2 className="mt-1 font-literary text-3xl font-semibold leading-tight">
                    {book.title}
                  </h2>
                  {book.subtitle && (
                    <p
                      className={`mt-1 text-base ${
                        isLight ? 'opacity-75' : 'text-[#9A9285]'
                      }`}
                    >
                      {book.subtitle}
                    </p>
                  )}
                </div>

                <p className="devanagari-verse text-base leading-relaxed">
                  {book.description}
                </p>

                <div className="border-t border-current/15 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A45C]">
                    Edition Architecture & Contents
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {book.structureHighlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-mono-index mt-0.5 text-xs text-[#C9A45C]">
                          0{idx + 1}.
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <VoiceoverPlayer
                    label="Realistic Literary Narration"
                    subtitle="Studio audiobook voiceover for this edition"
                    audioBase64={audioBase64}
                    loading={loading}
                    error={error}
                    onGenerate={handleGenerateNarration}
                    generateLabel="Listen to Edition Introduction"
                    downloadName={`${book.slug}-narration.wav`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

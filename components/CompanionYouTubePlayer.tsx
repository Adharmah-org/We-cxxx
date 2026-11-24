'use client';

import { useState } from 'react';
import { ExternalLink, Music, Play, X } from 'lucide-react';
import type { PoemSong } from '@/lib/types';

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null;
    }
    const v = u.searchParams.get('v');
    if (v) return v;
    const parts = u.pathname.split('/').filter(Boolean);
    const embedIdx = parts.indexOf('embed');
    if (embedIdx !== -1 && parts[embedIdx + 1]) {
      return parts[embedIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export function CompanionYouTubePlayer({
  songs,
  compact = false,
}: {
  songs?: PoemSong[];
  compact?: boolean;
}) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('');

  if (!songs || songs.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-[#2B2823] bg-[#0C0B0A]/80 ${
        compact ? 'p-4' : 'mt-6 p-5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[#C9A45C]">
          <Music className="h-3.5 w-3.5 shrink-0" />
          <span>Author’s Companion Song (YouTube)</span>
        </div>
        {activeVideoId && (
          <button
            type="button"
            onClick={() => setActiveVideoId(null)}
            className="inline-flex items-center gap-1 rounded-md border border-[#2B2823] px-2 py-1 text-xs text-[#9A9285] transition-colors hover:text-[#EFEAE0]"
          >
            <X className="h-3 w-3" />
            <span>Hide Player</span>
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2.5">
        {songs.map((song, idx) => {
          const videoId = extractYouTubeId(song.youtubeUrl);
          const isOpen = Boolean(videoId && activeVideoId === videoId);
          return (
            <div
              key={`${song.title}-${idx}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2B2823] bg-[#141311] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="devanagari-verse truncate text-sm font-medium text-[#EFEAE0]">
                  {song.title}
                </p>
                {song.artist && (
                  <p className="truncate text-xs text-[#9A9285]">{song.artist}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {videoId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isOpen) {
                        setActiveVideoId(null);
                      } else {
                        setActiveVideoId(videoId);
                        setActiveTitle(song.title);
                      }
                    }}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                      isOpen
                        ? 'bg-[#C9A45C] text-[#0C0B0A]'
                        : 'border border-[#C9A45C]/45 bg-[#C9A45C]/10 text-[#DEC07C] hover:bg-[#C9A45C] hover:text-[#0C0B0A]'
                    }`}
                  >
                    <Play className="h-3 w-3" />
                    <span>{isOpen ? 'Playing Below' : 'Play in Archive'}</span>
                  </button>
                )}

                {song.youtubeUrl && (
                  <a
                    href={song.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[#2B2823] bg-[#0C0B0A] px-2.5 text-xs text-[#9A9285] transition-colors hover:border-[#C9A45C] hover:text-[#EFEAE0] whitespace-nowrap"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeVideoId && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[#2B2823] bg-black">
          <div className="aspect-video w-full">
            <iframe
              title={`YouTube player: ${activeTitle}`}
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

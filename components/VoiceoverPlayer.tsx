'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Pause, Play, Volume2 } from 'lucide-react';

interface VoiceoverPlayerProps {
  label: string;
  subtitle?: string;
  audioBase64: string | null;
  mimeType?: string;
  loading?: boolean;
  error?: string | null;
  onGenerate?: () => void;
  generateLabel?: string;
  downloadName?: string;
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AudioTrackBar({ audioSrc }: { audioSrc: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.load();
    void el.play().catch(() => {
      // autoplay blocked until user gesture
    });
  }, [audioSrc]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  return (
    <div className="mt-4 flex items-center gap-3 border-t border-[#2B2823] pt-3">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause voiceover' : 'Play voiceover'}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A45C]/40 bg-[#1C1A17] text-[#C9A45C] transition-colors hover:bg-[#C9A45C] hover:text-[#0C0B0A]"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <input
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        value={currentTime}
        onChange={handleSeek}
        aria-label="Audio playback position"
        className="h-1.5 w-full cursor-pointer accent-[#C9A45C]"
      />

      <span className="font-mono-index shrink-0 text-xs text-[#9A9285]">
        {formatSeconds(currentTime)} / {formatSeconds(duration)}
      </span>

      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

export function VoiceoverPlayer({
  label,
  subtitle,
  audioBase64,
  mimeType = 'audio/wav',
  loading = false,
  error = null,
  onGenerate,
  generateLabel = 'Generate Studio Voiceover',
  downloadName = 'tejas-voiceover.wav',
}: VoiceoverPlayerProps) {
  const audioSrc = audioBase64 ? `data:${mimeType};base64,${audioBase64}` : null;

  return (
    <div className="rounded-xl border border-[#2B2823] bg-[#141311] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-[#EFEAE0]">
            <Volume2 className="h-4 w-4 shrink-0 text-[#C9A45C]" />
            <span className="truncate">{label}</span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-[#9A9285]">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#C9A45C] px-4 py-2 text-xs font-semibold text-[#0C0B0A] transition-colors hover:bg-[#DEC07C] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing Voiceover...</span>
                </>
              ) : (
                <span>{audioSrc ? 'Regenerate Voice' : generateLabel}</span>
              )}
            </button>
          )}

          {audioSrc && (
            <a
              href={audioSrc}
              download={downloadName}
              aria-label="Download audio WAV"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2B2823] bg-[#1C1A17] text-[#EFEAE0] transition-colors hover:border-[#C9A45C]/60 hover:text-[#C9A45C]"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {audioSrc && <AudioTrackBar key={audioSrc} audioSrc={audioSrc} />}
    </div>
  );
}

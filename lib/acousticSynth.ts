// Polyphonic acoustic accompaniment synthesizer tuned to Gemini's raga scale & BPM.
// Pairs seamlessly with Gemini 3.8 TTS vocal WAV playback without synthetic speech artifacts.

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class AcousticScorePlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private timerId: number | null = null;
  private step = 0;
  private isPlaying = false;

  public start(options: {
    tempoBpm: number;
    rootMidi: number;
    scaleIntervals: number[];
    volume?: number;
  }) {
    this.stop();

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;
    this.isPlaying = true;
    this.step = 0;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(
      Math.max(0.02, Math.min(0.45, options.volume ?? 0.22)),
      ctx.currentTime + 1.2
    );

    // Warm room lowpass filter
    const warmFilter = ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(1650, ctx.currentTime);
    warmFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    warmFilter.connect(master);
    master.connect(ctx.destination);
    this.masterGain = master;

    // 1. Tanpura-inspired warm drone (Root + Fifth + Octave)
    const rootFreq = midiToFreq(options.rootMidi);
    const fifthFreq = midiToFreq(options.rootMidi + 7);
    const octaveFreq = midiToFreq(options.rootMidi + 12);

    const droneConfigs = [
      { freq: rootFreq, type: 'triangle' as OscillatorType, gain: 0.14 },
      { freq: fifthFreq, type: 'sine' as OscillatorType, gain: 0.08 },
      { freq: octaveFreq, type: 'sine' as OscillatorType, gain: 0.05 },
    ];

    for (const d of droneConfigs) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = d.type;
      osc.frequency.setValueAtTime(d.freq, ctx.currentTime);
      g.gain.setValueAtTime(d.gain, ctx.currentTime);
      osc.connect(g);
      g.connect(warmFilter);
      osc.start();
      this.droneOscs.push(osc);
    }

    // 2. Gentle acoustic pluck / felt-piano arpeggio synced to BPM & raga intervals
    const intervals =
      options.scaleIntervals && options.scaleIntervals.length > 0
        ? options.scaleIntervals
        : [0, 2, 4, 7, 9];
    const pattern = [0, 2, 4, 3, 1, 2, 4, 0];
    const beatMs = Math.max(320, Math.round((60 / (options.tempoBpm || 72)) * 1000));

    const playNote = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const idx = pattern[this.step % pattern.length] % intervals.length;
      const octaveLift = this.step % 8 === 6 ? 24 : 12;
      const midi = options.rootMidi + intervals[idx] + octaveLift;
      const freq = midiToFreq(midi);

      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const env = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 2, now);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.18, now);

      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.18, now + 0.035);
      env.gain.exponentialRampToValueAtTime(0.0008, now + 1.85);

      osc.connect(env);
      subOsc.connect(subGain);
      subGain.connect(env);
      env.connect(warmFilter);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 1.9);
      subOsc.stop(now + 1.9);

      this.step += 1;
    };

    playNote();
    this.timerId = window.setInterval(playNote, beatMs);
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        Math.max(0.001, Math.min(0.45, volume)),
        this.ctx.currentTime,
        0.08
      );
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    for (const osc of this.droneOscs) {
      try {
        osc.stop();
      } catch {
        // ignore already stopped
      }
    }
    this.droneOscs = [];
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
    this.masterGain = null;
  }
}

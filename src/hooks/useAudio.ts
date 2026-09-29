import { useEffect, useRef } from "react";

type Tone = {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

function playTones(ctx: AudioContext, masterVolume: number, tones: Tone[]) {
  const now = ctx.currentTime;
  for (const { freq, start, duration, type = "sine", gain = 0.25 } of tones) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(ctx.destination);

    const t0 = now + start;
    const peak = Math.max(0, Math.min(1, gain * masterVolume));
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(peak, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }
}

export type BgmTrack =
  | "cyber"
  | "tropical"
  | "arcade"
  | "tokyo_night"
  | "spark_hyper"
  | "neon_funk"
  | "okinawa_wave";

export const BGM_TRACKS: Array<{ id: BgmTrack; label: string; baseBpm: number }> = [
  { id: "cyber", label: "Cyber Pop", baseBpm: 126 },
  { id: "tropical", label: "Tropical Party", baseBpm: 122 },
  { id: "arcade", label: "Arcade Beat", baseBpm: 132 },
  { id: "tokyo_night", label: "Tokyo Night", baseBpm: 124 },
  { id: "spark_hyper", label: "Hyper Spark", baseBpm: 138 },
  { id: "neon_funk", label: "Neon Funk", baseBpm: 120 },
  { id: "okinawa_wave", label: "Ryukyu Wave", baseBpm: 128 },
];

type ChordStep = {
  bass: number;
  chord: number[];
  lead: number[];
};

// Track 1: Cyber Pop (王道ポップス / エモ系) FM7 - G7 - Em7 - Am7
const PROGRESSION_CYBER: ChordStep[] = [
  { bass: 87.31, chord: [349.23, 440.0, 523.25, 659.25], lead: [659.25, 523.25, 659.25, 783.99] },
  { bass: 98.0, chord: [392.0, 493.88, 587.33, 698.46], lead: [783.99, 698.46, 587.33, 493.88] },
  { bass: 82.41, chord: [329.63, 392.0, 493.88, 587.33], lead: [587.33, 493.88, 587.33, 659.25] },
  { bass: 110.0, chord: [440.0, 523.25, 659.25, 783.99], lead: [880.0, 783.99, 659.25, 523.25] },
];

// Track 2: Tropical Party (明るく爽やかなトロピカルハウス風) C - G - Am - F
const PROGRESSION_TROPICAL: ChordStep[] = [
  { bass: 130.81, chord: [523.25, 659.25, 783.99, 1046.5], lead: [1046.5, 783.99, 880.0, 1046.5] },
  { bass: 98.0, chord: [392.0, 493.88, 587.33, 783.99], lead: [783.99, 587.33, 659.25, 783.99] },
  { bass: 110.0, chord: [440.0, 523.25, 659.25, 880.0], lead: [880.0, 659.25, 783.99, 880.0] },
  { bass: 87.31, chord: [349.23, 440.0, 523.25, 698.46], lead: [698.46, 523.25, 659.25, 783.99] },
];

// Track 3: Arcade Beat (チップチューン・ダンサブルなユーロビート風) Dm - Bb - C - F
const PROGRESSION_ARCADE: ChordStep[] = [
  { bass: 146.83, chord: [587.33, 698.46, 880.0], lead: [880.0, 1046.5, 880.0, 698.46] },
  { bass: 116.54, chord: [466.16, 587.33, 698.46], lead: [698.46, 880.0, 698.46, 587.33] },
  { bass: 130.81, chord: [523.25, 659.25, 783.99], lead: [783.99, 1046.5, 783.99, 659.25] },
  { bass: 110.0, chord: [440.0, 554.37, 659.25], lead: [880.0, 1108.73, 880.0, 659.25] },
];

// Track 4: Tokyo Night (ディープで大人っぽいフューチャーファンク / シティポップ風) Dm9 - G13 - Cmaj7 - A7
const PROGRESSION_TOKYO_NIGHT: ChordStep[] = [
  { bass: 73.42, chord: [293.66, 349.23, 440.0, 523.25, 659.25], lead: [659.25, 587.33, 523.25, 440.0] },
  { bass: 98.0, chord: [392.0, 493.88, 587.33, 659.25], lead: [587.33, 659.25, 783.99, 659.25] },
  { bass: 65.41, chord: [261.63, 329.63, 392.0, 493.88, 587.33], lead: [587.33, 493.88, 392.0, 329.63] },
  { bass: 110.0, chord: [440.0, 554.37, 659.25, 830.61], lead: [830.61, 659.25, 554.37, 440.0] },
];

// Track 5: Hyper Spark (ハイテンション・高速テクノポップ) F#m - D - A - E
const PROGRESSION_SPARK_HYPER: ChordStep[] = [
  { bass: 92.5, chord: [370.0, 440.0, 554.37, 740.0], lead: [740.0, 880.0, 740.0, 554.37] },
  { bass: 146.83, chord: [587.33, 740.0, 880.0, 1108.73], lead: [1108.73, 880.0, 740.0, 880.0] },
  { bass: 110.0, chord: [440.0, 554.37, 659.25, 880.0], lead: [880.0, 1108.73, 880.0, 659.25] },
  { bass: 82.41, chord: [329.63, 415.3, 493.88, 659.25], lead: [659.25, 830.61, 987.77, 1108.73] },
];

// Track 6: Neon Funk (グルーヴィーなディスコファンク) E9 - A13 - F#m7 - B7
const PROGRESSION_NEON_FUNK: ChordStep[] = [
  { bass: 82.41, chord: [329.63, 392.0, 493.88, 587.33, 740.0], lead: [740.0, 587.33, 493.88, 392.0] },
  { bass: 110.0, chord: [440.0, 554.37, 659.25, 880.0], lead: [880.0, 740.0, 659.25, 554.37] },
  { bass: 92.5, chord: [370.0, 440.0, 554.37, 740.0], lead: [740.0, 880.0, 987.77, 740.0] },
  { bass: 123.47, chord: [493.88, 622.25, 740.0, 987.77], lead: [987.77, 740.0, 622.25, 493.88] },
];

// Track 7: Ryukyu Wave (沖縄音階・南国トロピカルディスコ) C - E - F - G (ドミファソシ)
const PROGRESSION_OKINAWA: ChordStep[] = [
  { bass: 130.81, chord: [523.25, 659.25, 783.99, 987.77], lead: [987.77, 783.99, 659.25, 523.25] },
  { bass: 82.41, chord: [329.63, 523.25, 659.25, 783.99], lead: [659.25, 783.99, 987.77, 1046.5] },
  { bass: 87.31, chord: [349.23, 523.25, 698.46, 880.0], lead: [698.46, 783.99, 659.25, 523.25] },
  { bass: 98.0, chord: [392.0, 493.88, 587.33, 783.99], lead: [783.99, 987.77, 1046.5, 1318.5] },
];

export function getRandomTrack(): BgmTrack {
  const list: BgmTrack[] = [
    "cyber",
    "tropical",
    "arcade",
    "tokyo_night",
    "spark_hyper",
    "neon_funk",
    "okinawa_wave",
  ];
  return list[Math.floor(Math.random() * list.length)];
}

export function useAudio(
  volume: number,
  bgmEnabled: boolean = true,
  trackId: BgmTrack = "cyber",
  score: number = 0,
  combo: number = 0
) {
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const bgmEnabledRef = useRef(bgmEnabled);
  bgmEnabledRef.current = bgmEnabled;
  const trackIdRef = useRef(trackId);
  trackIdRef.current = trackId;

  // Dynamic BPM calculation: climbs with progress (score & combo) up to +36 BPM
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const comboRef = useRef(combo);
  comboRef.current = combo;

  const ctxRef = useRef<AudioContext | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);
  const bgmTimerRef = useRef<number | null>(null);
  const stepRef = useRef<number>(0);
  const nextNoteTimeRef = useRef<number>(0);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  // Reset BGM playback position to beginning (Step 0)
  const resetBgmPosition = () => {
    stepRef.current = 0;
    const ctx = getCtx();
    if (ctx) {
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
    }
  };

  // Setup BGM Master Gain
  useEffect(() => {
    if (bgmGainRef.current && ctxRef.current) {
      const targetGain = bgmEnabled ? volume * 0.18 : 0;
      bgmGainRef.current.gain.setTargetAtTime(targetGain, ctxRef.current.currentTime, 0.05);
    }
  }, [volume, bgmEnabled]);

  // BGM scheduler loop
  useEffect(() => {
    if (!bgmEnabled) {
      if (bgmTimerRef.current) {
        clearInterval(bgmTimerRef.current);
        bgmTimerRef.current = null;
      }
      return;
    }

    const scheduleBGM = () => {
      const ctx = getCtx();
      if (!bgmGainRef.current) {
        const bgmGain = ctx.createGain();
        bgmGain.gain.setValueAtTime(volumeRef.current * 0.18, ctx.currentTime);
        bgmGain.connect(ctx.destination);
        bgmGainRef.current = bgmGain;
      }

      const activeTrack = trackIdRef.current;
      let progression = PROGRESSION_CYBER;
      if (activeTrack === "tropical") progression = PROGRESSION_TROPICAL;
      else if (activeTrack === "arcade") progression = PROGRESSION_ARCADE;
      else if (activeTrack === "tokyo_night") progression = PROGRESSION_TOKYO_NIGHT;
      else if (activeTrack === "spark_hyper") progression = PROGRESSION_SPARK_HYPER;
      else if (activeTrack === "neon_funk") progression = PROGRESSION_NEON_FUNK;
      else if (activeTrack === "okinawa_wave") progression = PROGRESSION_OKINAWA;

      const trackInfo = BGM_TRACKS.find((t) => t.id === activeTrack) || BGM_TRACKS[0];

      // Dynamic Speed: Starts at baseBpm and scales up gradually with score & combo
      const speedBoost = Math.min(
        36,
        Math.floor(scoreRef.current / 300) * 2 + Math.min(comboRef.current, 15)
      );
      const bpm = trackInfo.baseBpm + speedBoost;
      const secondsPerBeat = 60.0 / bpm;
      const secondsPer16th = secondsPerBeat / 4;
      const lookahead = 0.2;

      if (nextNoteTimeRef.current < ctx.currentTime) {
        nextNoteTimeRef.current = ctx.currentTime + 0.05;
      }

      while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
        const t = nextNoteTimeRef.current;
        const currentStep = stepRef.current;
        const chordIndex = Math.floor(currentStep / 16) % progression.length;
        const stepInBar = currentStep % 16;
        const chordData = progression[chordIndex];

        // 1. Bassline
        if (stepInBar % 2 === 0) {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(
            activeTrack === "arcade" || activeTrack === "spark_hyper" ? 900 : 600,
            t
          );
          filter.frequency.exponentialRampToValueAtTime(150, t + secondsPer16th * 1.8);

          osc.type =
            activeTrack === "arcade"
              ? "square"
              : activeTrack === "tokyo_night" || activeTrack === "neon_funk"
              ? "triangle"
              : "sawtooth";
          osc.frequency.setValueAtTime(chordData.bass, t);
          osc.connect(filter);
          filter.connect(env);
          env.connect(bgmGainRef.current);

          const bassGain = activeTrack === "arcade" ? 0.35 : 0.45;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(bassGain, t + 0.01);
          env.gain.exponentialRampToValueAtTime(0.001, t + secondsPer16th * 1.8);

          osc.start(t);
          osc.stop(t + secondsPer16th * 2);
        }

        // 2. Chords pad
        if (stepInBar % 4 === 2) {
          chordData.chord.forEach((freq) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type =
              activeTrack === "tropical" ||
              activeTrack === "tokyo_night" ||
              activeTrack === "okinawa_wave"
                ? "sine"
                : "triangle";
            osc.frequency.setValueAtTime(freq, t);
            osc.connect(env);
            env.connect(bgmGainRef.current!);

            const chordGain = 0.11;
            env.gain.setValueAtTime(0, t);
            env.gain.linearRampToValueAtTime(chordGain, t + 0.015);
            env.gain.exponentialRampToValueAtTime(0.001, t + secondsPer16th * 1.5);

            osc.start(t);
            osc.stop(t + secondsPer16th * 1.6);
          });
        }

        // 3. Lead melody
        if (stepInBar % 4 === 0) {
          const noteIndex = Math.floor(stepInBar / 4);
          const leadFreq = chordData.lead[noteIndex];
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type =
            activeTrack === "arcade"
              ? "square"
              : activeTrack === "spark_hyper" || activeTrack === "neon_funk"
              ? "sawtooth"
              : "sine";
          osc.frequency.setValueAtTime(leadFreq, t);
          osc.connect(env);
          env.connect(bgmGainRef.current!);

          const leadGain =
            activeTrack === "arcade" ? 0.12 : activeTrack === "spark_hyper" ? 0.15 : 0.2;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(leadGain, t + 0.01);
          env.gain.exponentialRampToValueAtTime(0.001, t + secondsPer16th * 2.8);

          osc.start(t);
          osc.stop(t + secondsPer16th * 3);
        }

        // 4. Percussion / Hi-hat
        if (stepInBar % 2 === 1) {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(4500 + Math.random() * 500, t);
          osc.connect(env);
          env.connect(bgmGainRef.current!);

          const hhGain = speedBoost > 15 ? 0.045 : 0.03;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(hhGain, t + 0.003);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

          osc.start(t);
          osc.stop(t + 0.04);
        }

        nextNoteTimeRef.current += secondsPer16th;
        stepRef.current = (currentStep + 1) % 64;
      }
    };

    bgmTimerRef.current = window.setInterval(scheduleBGM, 50);

    return () => {
      if (bgmTimerRef.current) {
        clearInterval(bgmTimerRef.current);
        bgmTimerRef.current = null;
      }
    };
  }, [bgmEnabled, trackId]);

  const playTap = () => {
    playTones(getCtx(), volumeRef.current, [
      { freq: 920, start: 0, duration: 0.07, type: "sine", gain: 0.15 },
    ]);
  };

  const playCorrect = (comboCount: number) => {
    const ctx = getCtx();
    const shift = 1 + Math.sqrt(comboCount) * 0.15;
    const notes = [523.25, 659.25, 784.0].map((f) => f * shift);
    playTones(
      ctx,
      volumeRef.current,
      notes.map((freq, i) => ({
        freq,
        start: i * 0.07,
        duration: 0.22,
        type: "sine" as OscillatorType,
        gain: 0.22,
      }))
    );
    playTones(ctx, volumeRef.current, [
      {
        freq: notes[notes.length - 1] * 2,
        start: notes.length * 0.07 - 0.02,
        duration: 0.18,
        type: "sine",
        gain: 0.08,
      },
    ]);
  };

  const playWrong = () => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    osc.connect(env);
    env.connect(ctx.destination);
    const peak = Math.max(0, Math.min(1, 0.2 * volumeRef.current));
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.24);
  };

  const playCountdown = () => {
    playTones(getCtx(), volumeRef.current, [
      { freq: 1400, start: 0, duration: 0.05, type: "square", gain: 0.08 },
    ]);
  };

  return {
    playCorrect,
    playWrong,
    playTap,
    playCountdown,
    initAudio: getCtx,
    resetBgmPosition,
  };
}

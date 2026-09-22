import { useRef } from "react";

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

export function useAudio(volume: number) {
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const playTap = () => {
    playTones(getCtx(), volumeRef.current, [
      { freq: 920, start: 0, duration: 0.07, type: "sine", gain: 0.15 },
    ]);
  };

  const playCorrect = (combo: number) => {
    const ctx = getCtx();
    const shift = 1 + Math.min(combo, 10) * 0.04;
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
    // sparkly overtone on the last note for a "cute chime" finish
    playTones(ctx, volumeRef.current, [
      { freq: notes[notes.length - 1] * 2, start: notes.length * 0.07 - 0.02, duration: 0.18, type: "sine", gain: 0.08 },
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

  return { playCorrect, playWrong, playTap, playCountdown };
}

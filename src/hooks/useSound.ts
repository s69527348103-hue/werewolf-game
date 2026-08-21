import { useCallback } from 'react';
import { create } from 'zustand';

type SoundName = 'click' | 'phaseNight' | 'phaseDay' | 'reveal' | 'vote' | 'eliminate' | 'winVillager' | 'winWerewolf' | 'tick';

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  return sharedCtx;
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, gain: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

const RECIPES: Record<SoundName, (ctx: AudioContext) => void> = {
  click: (ctx) => tone(ctx, 520, 0, 0.06, 'sine', 0.08),
  tick: (ctx) => tone(ctx, 900, 0, 0.04, 'square', 0.04),
  phaseNight: (ctx) => {
    tone(ctx, 220, 0, 0.9, 'sine', 0.1);
    tone(ctx, 165, 0.1, 1.1, 'sine', 0.08);
  },
  phaseDay: (ctx) => {
    tone(ctx, 440, 0, 0.3, 'triangle', 0.1);
    tone(ctx, 660, 0.12, 0.4, 'triangle', 0.1);
    tone(ctx, 880, 0.24, 0.5, 'triangle', 0.1);
  },
  reveal: (ctx) => {
    tone(ctx, 300, 0, 0.2, 'sine', 0.09);
    tone(ctx, 500, 0.1, 0.3, 'sine', 0.09);
  },
  vote: (ctx) => tone(ctx, 700, 0, 0.1, 'square', 0.06),
  eliminate: (ctx) => {
    tone(ctx, 200, 0, 0.4, 'sawtooth', 0.08);
    tone(ctx, 120, 0.15, 0.6, 'sawtooth', 0.08);
  },
  winVillager: (ctx) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.12, 0.5, 'triangle', 0.09));
  },
  winWerewolf: (ctx) => {
    [220, 196, 174, 130].forEach((f, i) => tone(ctx, f, i * 0.15, 0.6, 'sawtooth', 0.08));
  },
};

interface SoundStore {
  muted: boolean;
  toggleMuted: () => void;
}

export const useSoundStore = create<SoundStore>((set) => ({
  muted: false,
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));

export function useSound() {
  const muted = useSoundStore((s) => s.muted);
  const toggleMuted = useSoundStore((s) => s.toggleMuted);

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      try {
        RECIPES[name](ctx);
      } catch {
        // Audio is best-effort; never let it break gameplay.
      }
    },
    [muted],
  );

  return { play, muted, toggleMuted };
}

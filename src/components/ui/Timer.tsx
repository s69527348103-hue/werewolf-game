import { useEffect, useRef, useState } from 'react';
import { useSound } from '../../hooks/useSound';

interface TimerProps {
  seconds: number;
  onComplete: () => void;
  paused?: boolean;
}

export function Timer({ seconds, onComplete, paused }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const { play } = useSound();

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) {
      onCompleteRef.current();
      return;
    }
    const id = setTimeout(() => {
      setRemaining((r) => {
        if (r <= 11 && r > 1) play('tick');
        return r - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [remaining, paused, play]);

  const mm = Math.floor(Math.max(0, remaining) / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.max(0, remaining % 60)
    .toString()
    .padStart(2, '0');
  const urgent = remaining <= 10;

  return (
    <div className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${urgent ? 'text-werewolf animate-pulse-slow' : 'text-gold'}`}>
      {mm}:{ss}
    </div>
  );
}

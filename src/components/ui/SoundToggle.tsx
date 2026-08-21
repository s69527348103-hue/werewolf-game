import { useSound } from '../../hooks/useSound';

export function SoundToggle({ dark }: { dark?: boolean }) {
  const { muted, toggleMuted } = useSound();
  return (
    <button
      onClick={toggleMuted}
      aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
      className={`fixed top-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur
        ${dark ? 'bg-day-100/60 border-day-700/40 text-day-950' : 'bg-night-800/70 border-night-600 text-parchment'}`}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

import { motion } from 'framer-motion';
import type { Player } from '../../engine/types';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showVoteCount?: number;
  subtitle?: string;
  highlight?: 'werewolf' | 'doctor' | 'seer' | 'villagerRole' | null;
}

const HIGHLIGHT_RING: Record<string, string> = {
  werewolf: 'ring-werewolf',
  doctor: 'ring-doctor',
  seer: 'ring-seer',
  villagerRole: 'ring-villagerRole',
};

export function PlayerCard({ player, onClick, selected, disabled, showVoteCount, subtitle, highlight }: PlayerCardProps) {
  const clickable = !!onClick && !disabled && player.isAlive;
  const ringColor = highlight ? HIGHLIGHT_RING[highlight] : 'ring-transparent';

  return (
    <motion.button
      type="button"
      whileTap={clickable ? { scale: 0.96 } : undefined}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all
        ${player.isAlive ? 'bg-night-800/80 border-night-600' : 'bg-night-900/60 border-night-700 opacity-50'}
        ${selected ? 'border-gold ring-2 ring-gold shadow-[0_0_18px_rgba(212,175,55,0.4)]' : `ring-2 ${ringColor}`}
        ${clickable ? 'cursor-pointer hover:border-gold/60' : 'cursor-default'}
      `}
    >
      {!player.isAlive && (
        <span className="absolute -top-2 -right-2 rounded-full bg-night-950 border border-werewolf/60 text-werewolf text-xs px-1.5 py-0.5">
          💀
        </span>
      )}
      {player.isBot && (
        <span className="absolute top-1 left-1 text-[10px] rounded-full bg-white/10 px-1.5 py-0.5">AI</span>
      )}
      <div className="text-3xl leading-none">{player.avatar}</div>
      <div className="text-xs sm:text-sm font-medium truncate max-w-[6rem]">{player.name}</div>
      {subtitle && <div className="text-[10px] text-parchment/60">{subtitle}</div>}
      {typeof showVoteCount === 'number' && showVoteCount > 0 && (
        <span className="absolute -bottom-2 rounded-full bg-gold text-night-950 text-xs font-bold px-2 py-0.5">
          {showVoteCount}
        </span>
      )}
    </motion.button>
  );
}

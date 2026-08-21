import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useSound } from '../../hooks/useSound';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

const VARIANTS: Record<string, string> = {
  primary:
    'bg-gradient-to-b from-gold to-day-700 text-night-950 shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-night-700 text-parchment border border-night-500 hover:bg-night-600 active:bg-night-800',
  danger:
    'bg-gradient-to-b from-werewolf to-werewolf-dim text-parchment shadow-[0_0_20px_rgba(220,59,59,0.35)] hover:brightness-110',
  ghost: 'bg-transparent text-parchment/80 border border-white/15 hover:bg-white/5',
};

export function Button({ children, variant = 'primary', fullWidth, className = '', onClick, ...rest }: ButtonProps) {
  const { play } = useSound();
  return (
    <button
      {...rest}
      onClick={(e) => {
        play('click');
        onClick?.(e);
      }}
      className={`font-display font-semibold rounded-xl px-5 py-3 text-sm sm:text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

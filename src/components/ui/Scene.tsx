import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { SoundToggle } from './SoundToggle';

interface SceneProps {
  variant: 'night' | 'day' | 'menu';
  children: ReactNode;
  showSoundToggle?: boolean;
}

const BG: Record<SceneProps['variant'], string> = {
  night: 'bg-night-950 bg-stars',
  day: 'bg-gradient-to-b from-day-300 via-day-500 to-day-800',
  menu: 'bg-night-950 bg-stars',
};

const TEXT: Record<SceneProps['variant'], string> = {
  night: 'text-parchment',
  day: 'text-day-950',
  menu: 'text-parchment',
};

export function Scene({ variant, children, showSoundToggle = true }: SceneProps) {
  return (
    <motion.div
      key={variant}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-dvh w-full ${BG[variant]} ${TEXT[variant]} relative overflow-x-hidden`}
    >
      {showSoundToggle && <SoundToggle dark={variant === 'day'} />}
      {children}
    </motion.div>
  );
}

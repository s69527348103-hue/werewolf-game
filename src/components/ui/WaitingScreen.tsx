import { Scene } from './Scene';

interface WaitingScreenProps {
  icon?: string;
  text: string;
  variant?: 'night' | 'day';
}

export function WaitingScreen({ icon = '⏳', text, variant = 'night' }: WaitingScreenProps) {
  return (
    <Scene variant={variant}>
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4 animate-pulse-slow">{icon}</div>
        <p className={variant === 'day' ? 'text-day-950/80' : 'text-parchment/70'}>{text}</p>
      </div>
    </Scene>
  );
}

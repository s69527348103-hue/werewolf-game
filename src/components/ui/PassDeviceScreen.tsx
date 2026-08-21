import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import type { Player } from '../../engine/types';

interface PassDeviceScreenProps {
  player: Player;
  purpose: string;
  onReady: () => void;
}

/**
 * Local pass-and-play privacy gate. This app runs on one shared device, so
 * "hiding" a role or a night action from other players is a UX contract, not
 * a server-enforced one: we blank the screen and require the named player to
 * explicitly confirm "this is me" before any private content renders.
 * A networked build would replace this with a real per-client session.
 */
export function PassDeviceScreen({ player, purpose, onReady }: PassDeviceScreenProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (confirmed) onReady();
  }, [confirmed, onReady]);

  if (confirmed) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-dvh flex flex-col items-center justify-center bg-night-950 bg-stars px-6 text-center"
    >
      <div className="text-6xl mb-6 animate-pulse-slow">🤫</div>
      <p className="text-parchment/60 text-sm mb-2">ส่งต่ออุปกรณ์ให้</p>
      <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
        <span className="text-4xl">{player.avatar}</span> {player.name}
      </h1>
      <p className="text-parchment/70 mb-10 max-w-xs">{purpose}</p>
      <Button onClick={() => setConfirmed(true)}>ฉันคือ {player.name} — พร้อมแล้ว</Button>
      <p className="text-xs text-parchment/40 mt-6 max-w-xs">
        ผู้เล่นคนอื่นห้ามดูหน้าจอตอนนี้ ข้อมูลต่อไปนี้เป็นความลับเฉพาะคุณ
      </p>
    </motion.div>
  );
}

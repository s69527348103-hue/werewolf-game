import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { PlayerCard } from '../ui/PlayerCard';
import { Scene } from '../ui/Scene';
import { WaitingScreen } from '../ui/WaitingScreen';
import { useGameStore, autoResolveWerewolfTurn } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

export function WerewolfAction() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const mode = useGameStore((s) => s.mode);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const { play } = useSound();
  const [revealed, setRevealed] = useState(false);

  const aliveWolves = game.players.filter((p) => p.isAlive && p.role === 'WEREWOLF');
  const humanWolves = aliveWolves.filter((p) => !p.isBot);
  const targets = game.players.filter((p) => p.isAlive && p.role !== 'WEREWOLF');
  const isOnline = mode === 'online';
  const iAmWerewolf = isOnline && aliveWolves.some((p) => p.id === myPlayerId);

  useEffect(() => {
    if (!isOnline && humanWolves.length === 0) {
      const t = setTimeout(() => autoResolveWerewolfTurn(), 1400);
      return () => clearTimeout(t);
    }
  }, [isOnline, humanWolves.length]);

  if (isOnline && !iAmWerewolf) {
    return <WaitingScreen icon="🐺" text="หมาป่ากำลังเลือกเป้าหมาย รอสักครู่..." />;
  }

  if (!isOnline && humanWolves.length === 0) {
    return (
      <Scene variant="night">
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4 animate-pulse-slow">🐺</div>
          <p className="text-parchment/70">หมาป่ากำลังเลือกเป้าหมาย...</p>
        </div>
      </Scene>
    );
  }

  if (!isOnline && !revealed) {
    return (
      <Scene variant="night" showSoundToggle={false}>
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-6">🐺</div>
          <h1 className="font-display text-2xl font-bold mb-2">ถึงตาหมาป่า</h1>
          <p className="text-parchment/60 mb-10 max-w-xs">ส่งต่ออุปกรณ์ให้ผู้เล่นที่ได้รับบทหมาป่าทุกคน ผู้เล่นอื่นห้ามดูหน้าจอนี้</p>
          <Button
            onClick={() => {
              play('reveal');
              setRevealed(true);
            }}
          >
            พวกเราคือหมาป่า พร้อมแล้ว
          </Button>
        </div>
      </Scene>
    );
  }

  return (
    <Scene variant="night">
      <div className="min-h-dvh flex flex-col items-center px-6 py-10">
        <div className="text-5xl mb-3">🐺</div>
        <h1 className="font-display text-2xl font-bold mb-1">หมาป่าตื่นขึ้น</h1>
        <p className="text-parchment/60 mb-3 text-sm text-center max-w-sm">เลือกผู้เล่น 1 คนเพื่อกำจัด</p>

        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {aliveWolves.map((w) => (
            <span key={w.id} className="text-xs bg-werewolf-dim/40 border border-werewolf/50 rounded-full px-2 py-1">
              {w.avatar} {w.name}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8 max-w-xl">
          {targets.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={game.nightTarget === p.id}
              onClick={() => dispatch({ type: 'SET_WEREWOLF_TARGET', targetId: p.id })}
            />
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="danger"
            disabled={!game.nightTarget}
            onClick={() => {
              play('vote');
              dispatch({ type: 'CONFIRM_WEREWOLF_ACTION' });
            }}
          >
            ยืนยันการโจมตี
          </Button>
        </motion.div>
      </div>
    </Scene>
  );
}

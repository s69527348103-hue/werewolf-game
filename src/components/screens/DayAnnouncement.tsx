import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

export function DayAnnouncement() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const { play } = useSound();
  const victim = game.players.find((p) => p.id === game.lastNightVictimId);

  useEffect(() => {
    play('phaseDay');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Scene variant="day">
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-7xl mb-4">
          ☀️
        </motion.div>
        <h1 className="font-display text-3xl font-extrabold mb-6 text-day-950">DAY {game.roundNumber}</h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-day-100/70 border border-day-700/40 rounded-2xl p-6 max-w-sm w-full mb-10 text-day-950"
        >
          <p className="text-sm text-day-800 mb-3">เมื่อคืนนี้...</p>
          {victim ? (
            <>
              <div className="text-4xl mb-2">{victim.avatar}</div>
              <p className="font-display text-lg font-bold">
                💀 ผู้เล่น "{victim.name}" ถูกพบว่าเสียชีวิต
              </p>
            </>
          ) : (
            <p className="font-display text-lg font-bold">🌅 เช้าวันใหม่มาถึง ไม่มีใครเสียชีวิตเมื่อคืนนี้</p>
          )}
        </motion.div>

        <Button onClick={() => dispatch({ type: 'START_DISCUSSION' })}>เริ่มการอภิปราย</Button>
      </div>
    </Scene>
  );
}

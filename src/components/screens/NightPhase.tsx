import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

export function NightPhase() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const { play } = useSound();
  const upcomingRound = game.roundNumber + 1;

  useEffect(() => {
    play('phaseNight');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Scene variant="night">
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="text-8xl mb-6 animate-flicker"
        >
          🌙
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-display text-3xl sm:text-4xl font-extrabold mb-2 tracking-wide"
        >
          NIGHT {upcomingRound}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-parchment/60 mb-10">
          ทุกคนหลับตา... หมู่บ้านเงียบสงัด
        </motion.p>
        <Button onClick={() => dispatch({ type: 'BEGIN_NIGHT' })}>เริ่มคืนนี้</Button>
      </div>
    </Scene>
  );
}

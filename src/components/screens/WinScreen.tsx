import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

export function WinScreen({ onViewSummary }: { onViewSummary: () => void }) {
  const game = useGameStore((s) => s.game);
  const { play } = useSound();
  const villagersWon = game.winner === 'VILLAGER';

  useEffect(() => {
    play(villagersWon ? 'winVillager' : 'winWerewolf');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Scene variant={villagersWon ? 'day' : 'night'}>
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
          className="text-8xl mb-6"
        >
          {villagersWon ? '🎉' : '🐺'}
        </motion.div>
        <h1 className={`font-display text-3xl sm:text-4xl font-extrabold mb-3 ${villagersWon ? 'text-day-950' : 'text-werewolf'}`}>
          {villagersWon ? 'VILLAGERS WIN!' : 'WEREWOLVES WIN!'}
        </h1>
        <p className={`mb-10 max-w-sm ${villagersWon ? 'text-day-900/80' : 'text-parchment/70'}`}>
          {villagersWon
            ? 'ชาวบ้านสามารถค้นหาและกำจัดหมาป่าได้ทั้งหมด'
            : 'หมาป่าสามารถควบคุมหมู่บ้านได้สำเร็จ'}
        </p>
        <Button onClick={onViewSummary}>ดูสรุปเกม →</Button>
      </div>
    </Scene>
  );
}

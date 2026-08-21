import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { RoleBadge } from '../ui/RoleBadge';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';
import type { RoleId } from '../../engine/types';

export function VoteResult() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const [step, setStep] = useState<'TALLY' | 'ELIMINATED'>('TALLY');

  const lastVote = game.voteHistory[game.voteHistory.length - 1];
  const tally: Record<string, number> = {};
  Object.values(game.votes).forEach((id) => {
    tally[id] = (tally[id] ?? 0) + 1;
  });
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const eliminated = lastVote?.eliminatedId ? game.players.find((p) => p.id === lastVote.eliminatedId) : null;

  if (step === 'TALLY') {
    return (
      <Scene variant="day">
        <div className="min-h-dvh flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="font-display text-2xl font-bold mb-6 text-day-950">ผลการโหวต</h1>

          <div className="w-full max-w-sm space-y-2 mb-8">
            {ranked.length === 0 && <p className="text-day-800 text-center">ไม่มีการลงคะแนน</p>}
            {ranked.map(([id, count]) => {
              const p = game.players.find((pl) => pl.id === id);
              if (!p) return null;
              const maxCount = ranked[0][1];
              return (
                <motion.div
                  key={id}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="bg-day-100/70 border border-day-700/30 rounded-xl p-3 flex items-center gap-3 text-day-950"
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="flex-1 font-medium">{p.name}</span>
                  <div className="h-2 rounded-full bg-day-700/20 flex-1 max-w-[6rem] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCount) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-werewolf"
                    />
                  </div>
                  <span className="font-bold w-6 text-right">{count}</span>
                </motion.div>
              );
            })}
          </div>

          <Button onClick={() => setStep('ELIMINATED')}>ดูผลลัพธ์</Button>
        </div>
      </Scene>
    );
  }

  return (
    <Scene variant="night">
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        {eliminated ? (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full">
            <div className="text-6xl mb-4">💀</div>
            <p className="text-parchment/70 mb-1">
              ผู้เล่น "{eliminated.name}" ได้รับคะแนนโหวตมากที่สุด
            </p>
            <h1 className="font-display text-2xl font-extrabold mb-4">{eliminated.name} ถูกกำจัดออกจากเกม</h1>
            <div className="bg-night-800/80 border border-night-600 rounded-2xl p-6 mb-8">
              <p className="text-xs text-parchment/50 mb-2">บทบาทของ {eliminated.name} คือ</p>
              {eliminated.role && <RoleBadge role={eliminated.role as RoleId} size="lg" />}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full">
            <div className="text-6xl mb-4">🤝</div>
            <h1 className="font-display text-2xl font-extrabold mb-2">
              {lastVote?.wasTie ? 'คะแนนเสมอกัน ไม่มีใครถูกกำจัดในวันนี้' : 'ไม่มีใครถูกกำจัดในวันนี้'}
            </h1>
          </motion.div>
        )}
        <Button onClick={() => dispatch({ type: 'ACK_VOTE_RESULT' })}>ไปต่อ</Button>
      </div>
    </Scene>
  );
}

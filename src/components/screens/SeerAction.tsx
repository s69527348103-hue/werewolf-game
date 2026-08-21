import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { PassDeviceScreen } from '../ui/PassDeviceScreen';
import { PlayerCard } from '../ui/PlayerCard';
import { Scene } from '../ui/Scene';
import { WaitingScreen } from '../ui/WaitingScreen';
import { useGameStore, autoResolveSeerTurn } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

export function SeerAction() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const mode = useGameStore((s) => s.mode);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const { play } = useSound();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);

  const seer = game.players.find((p) => p.isAlive && p.role === 'SEER');
  const targets = game.players.filter((p) => p.isAlive && p.id !== seer?.id);
  const seerIsBot = seer?.isBot ?? false;
  const isOnline = mode === 'online';

  useEffect(() => {
    if (!isOnline && seerIsBot) {
      const t = setTimeout(() => autoResolveSeerTurn(), 1400);
      return () => clearTimeout(t);
    }
  }, [isOnline, seerIsBot]);

  if (!seer) return null;

  if (seer.isBot) {
    return (
      <Scene variant="night">
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4 animate-pulse-slow">🔮</div>
          <p className="text-parchment/70">ผู้หยั่งรู้กำลังตรวจสอบ...</p>
        </div>
      </Scene>
    );
  }

  if (isOnline && seer.id !== myPlayerId) {
    return <WaitingScreen icon="🔮" text="ผู้หยั่งรู้กำลังตรวจสอบ รอสักครู่..." />;
  }

  if (!isOnline && !ready) {
    return <PassDeviceScreen player={seer} purpose="ถึงตาผู้หยั่งรู้ตื่นขึ้นเลือกผู้เล่นเพื่อตรวจสอบ" onReady={() => { play('reveal'); setReady(true); }} />;
  }

  if (checked && game.seerResult) {
    return (
      <Scene variant="night">
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full">
            <div className="text-6xl mb-4">🔮</div>
            <h1 className="font-display text-xl font-bold mb-4">ผลการตรวจสอบ</h1>
            <div
              className={`rounded-2xl border-2 p-6 mb-8 ${
                game.seerResult.isWerewolf ? 'border-werewolf/70 bg-werewolf-dim/20' : 'border-doctor/70 bg-doctor-dim/20'
              }`}
            >
              <p className="text-parchment/60 text-sm mb-1">ผู้เล่นนี้คือ</p>
              <p className="font-display text-2xl font-extrabold">{game.seerResult.targetName}</p>
              <p className={`text-lg font-bold mt-2 ${game.seerResult.isWerewolf ? 'text-werewolf' : 'text-doctor'}`}>
                {game.seerResult.isWerewolf ? '🐺 WEREWOLF' : '✅ ไม่ใช่ WEREWOLF'}
              </p>
            </div>
            <Button
              onClick={() => {
                play('click');
                dispatch({ type: 'CONFIRM_SEER_ACTION' });
              }}
            >
              รับทราบ
            </Button>
          </motion.div>
        </div>
      </Scene>
    );
  }

  return (
    <Scene variant="night">
      <div className="min-h-dvh flex flex-col items-center px-6 py-10">
        <div className="text-5xl mb-3">🔮</div>
        <h1 className="font-display text-2xl font-bold mb-1">ผู้หยั่งรู้ตื่นขึ้น</h1>
        <p className="text-parchment/60 mb-6 text-sm text-center max-w-sm">เลือกผู้เล่น 1 คนเพื่อสืบสวน</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8 max-w-xl">
          {targets.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={game.seerTarget === p.id}
              onClick={() => dispatch({ type: 'SET_SEER_TARGET', targetId: p.id })}
            />
          ))}
        </div>

        <Button
          disabled={!game.seerTarget}
          onClick={() => {
            play('reveal');
            dispatch({ type: 'REVEAL_SEER_RESULT' });
            setChecked(true);
          }}
        >
          ตรวจสอบผู้เล่นนี้
        </Button>
      </div>
    </Scene>
  );
}

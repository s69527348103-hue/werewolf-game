import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { PassDeviceScreen } from '../ui/PassDeviceScreen';
import { PlayerCard } from '../ui/PlayerCard';
import { Scene } from '../ui/Scene';
import { WaitingScreen } from '../ui/WaitingScreen';
import { useGameStore, autoResolveDoctorTurn } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

export function DoctorAction() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const mode = useGameStore((s) => s.mode);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const { play } = useSound();
  const [ready, setReady] = useState(false);

  const doctor = game.players.find((p) => p.isAlive && p.role === 'DOCTOR');
  const targets = game.players.filter((p) => p.isAlive);
  const doctorIsBot = doctor?.isBot ?? false;
  const isOnline = mode === 'online';

  useEffect(() => {
    if (!isOnline && doctorIsBot) {
      const t = setTimeout(() => autoResolveDoctorTurn(), 1400);
      return () => clearTimeout(t);
    }
  }, [isOnline, doctorIsBot]);

  if (!doctor) return null;

  if (doctor.isBot) {
    return (
      <Scene variant="night">
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4 animate-pulse-slow">🩺</div>
          <p className="text-parchment/70">หมอกำลังตัดสินใจปกป้อง...</p>
        </div>
      </Scene>
    );
  }

  if (isOnline && doctor.id !== myPlayerId) {
    return <WaitingScreen icon="🩺" text="หมอกำลังเลือกปกป้อง รอสักครู่..." />;
  }

  if (!isOnline && !ready) {
    return <PassDeviceScreen player={doctor} purpose="ถึงตาหมอตื่นขึ้นเลือกผู้เล่นเพื่อปกป้อง" onReady={() => { play('reveal'); setReady(true); }} />;
  }

  return (
    <Scene variant="night">
      <div className="min-h-dvh flex flex-col items-center px-6 py-10">
        <div className="text-5xl mb-3">🩺</div>
        <h1 className="font-display text-2xl font-bold mb-1">หมอตื่นขึ้น</h1>
        <p className="text-parchment/60 mb-6 text-sm text-center max-w-sm">เลือกผู้เล่น 1 คนเพื่อปกป้อง (สามารถปกป้องตัวเองได้)</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8 max-w-xl">
          {targets.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={game.doctorTarget === p.id}
              subtitle={p.id === doctor.id ? 'ตัวคุณเอง' : undefined}
              onClick={() => dispatch({ type: 'SET_DOCTOR_TARGET', targetId: p.id })}
            />
          ))}
        </div>

        <Button
          disabled={!game.doctorTarget}
          onClick={() => {
            play('vote');
            dispatch({ type: 'CONFIRM_DOCTOR_ACTION' });
          }}
        >
          ปกป้องผู้เล่นนี้
        </Button>
      </div>
    </Scene>
  );
}

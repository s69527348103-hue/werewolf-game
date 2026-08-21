import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../engine/roles';

interface CreateGameProps {
  onBack: () => void;
  onNext: (roomName: string, targetCount: number) => void;
}

export function CreateGame({ onBack, onNext }: CreateGameProps) {
  const [roomName, setRoomName] = useState('');
  const [targetCount, setTargetCount] = useState(8);

  return (
    <Scene variant="menu">
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold mb-6 text-center">🏚️ สร้างห้องเกม</h1>

          <label className="block text-sm text-parchment/70 mb-1.5">ชื่อห้อง</label>
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="เช่น หมู่บ้านเงามืด"
            maxLength={30}
            className="w-full rounded-xl bg-night-800 border border-night-600 px-4 py-3 mb-6 outline-none focus:border-gold/70 placeholder:text-parchment/30"
          />

          <label className="block text-sm text-parchment/70 mb-1.5">
            จำนวนผู้เล่น ({MIN_PLAYERS}–{MAX_PLAYERS} คน)
          </label>
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => setTargetCount((c) => Math.max(MIN_PLAYERS, c - 1))}
              className="w-10 h-10 rounded-full bg-night-800 border border-night-600 text-lg hover:border-gold/60"
            >
              −
            </button>
            <span className="font-display text-3xl font-bold w-12 text-center">{targetCount}</span>
            <button
              onClick={() => setTargetCount((c) => Math.min(MAX_PLAYERS, c + 1))}
              className="w-10 h-10 rounded-full bg-night-800 border border-night-600 text-lg hover:border-gold/60"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            className="w-full accent-gold mb-8"
          />

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>
              ← ย้อนกลับ
            </Button>
            <Button
              fullWidth
              onClick={() => onNext(roomName.trim() || 'หมู่บ้านเงามืด', targetCount)}
            >
              ถัดไป →
            </Button>
          </div>
        </motion.div>
      </div>
    </Scene>
  );
}

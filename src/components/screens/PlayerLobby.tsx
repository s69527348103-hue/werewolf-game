import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';
import { MAX_PLAYERS, MIN_PLAYERS, ROLES, getRoleDistribution } from '../../engine/roles';
import type { RoleId } from '../../engine/types';

interface PlayerLobbyProps {
  targetCount: number;
  onBack: () => void;
  onStart: () => void;
}

export function PlayerLobby({ targetCount, onBack, onStart }: PlayerLobbyProps) {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const [nameInput, setNameInput] = useState('');

  const players = game.players;
  const canAddMore = players.length < MAX_PLAYERS;
  const remaining = Math.max(0, targetCount - players.length);
  const distribution = getRoleDistribution(Math.max(players.length, MIN_PLAYERS));

  function addHuman() {
    const name = nameInput.trim();
    if (!name || !canAddMore) return;
    dispatch({ type: 'ADD_PLAYER', name, isBot: false });
    setNameInput('');
  }

  function startGame() {
    if (players.length < targetCount) {
      dispatch({ type: 'FILL_WITH_BOTS', targetCount });
    }
    dispatch({ type: 'START_GAME' });
    onStart();
  }

  const canStart = Math.max(players.length, targetCount) >= MIN_PLAYERS;

  return (
    <Scene variant="menu">
      <div className="min-h-dvh flex flex-col items-center px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-1 text-center">👥 ห้องรอผู้เล่น</h1>
        <p className="text-parchment/60 text-sm mb-6 text-center">{game.roomName}</p>

        <div className="w-full max-w-sm">
          <div className="flex gap-2 mb-4">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHuman()}
              placeholder="ใส่ชื่อผู้เล่น"
              maxLength={16}
              disabled={!canAddMore}
              className="flex-1 rounded-xl bg-night-800 border border-night-600 px-4 py-2.5 outline-none focus:border-gold/70 placeholder:text-parchment/30 disabled:opacity-40"
            />
            <Button onClick={addHuman} disabled={!nameInput.trim() || !canAddMore}>
              เพิ่ม
            </Button>
          </div>

          <Button
            variant="secondary"
            fullWidth
            className="mb-4"
            disabled={!canAddMore}
            onClick={() => dispatch({ type: 'FILL_WITH_BOTS', targetCount: players.length + 1 })}
          >
            🤖 เพิ่ม AI Bot
          </Button>

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-parchment/60">
              ผู้เล่น {players.length}/{targetCount} {remaining > 0 && `(ขาดอีก ${remaining} — จะเติม AI ให้อัตโนมัติ)`}
            </p>
          </div>

          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1">
            <AnimatePresence>
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 bg-night-800/70 border border-night-600 rounded-xl px-3 py-2"
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <span className="flex-1 font-medium">{p.name}</span>
                  {p.isBot && <span className="text-xs bg-white/10 rounded-full px-2 py-0.5">AI</span>}
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_PLAYER', id: p.id })}
                    className="text-parchment/40 hover:text-werewolf px-1"
                    aria-label={`ลบ ${p.name}`}
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length === 0 && (
              <p className="text-sm text-parchment/40 text-center py-6">ยังไม่มีผู้เล่น เพิ่มชื่อหรือกด AI Bot</p>
            )}
          </div>

          <div className="bg-night-800/50 border border-night-700 rounded-xl p-3 mb-6 text-xs text-parchment/60">
            <p className="mb-1 font-semibold text-parchment/80">บทบาทที่จะถูกสุ่ม (สำหรับ {Math.max(players.length, MIN_PLAYERS)} คน)</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(distribution) as RoleId[]).map((role) => (
                <span key={role}>
                  {ROLES[role].icon} {ROLES[role].name} ×{distribution[role]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>
              ← ย้อนกลับ
            </Button>
            <Button fullWidth disabled={!canStart} onClick={startGame}>
              🎲 เริ่มเกม
            </Button>
          </div>
          {!canStart && <p className="text-xs text-werewolf mt-2 text-center">ต้องมีผู้เล่นอย่างน้อย {MIN_PLAYERS} คน</p>}
        </div>
      </div>
    </Scene>
  );
}

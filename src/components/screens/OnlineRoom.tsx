import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';
import { MIN_PLAYERS, ROLES, getRoleDistribution } from '../../engine/roles';
import type { RoleId } from '../../engine/types';

export function OnlineRoom() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const isHost = useGameStore((s) => s.isHost);
  const roomCode = useGameStore((s) => s.roomCode);

  const players = game.players;
  const canStart = players.length >= MIN_PLAYERS;
  const distribution = getRoleDistribution(Math.max(players.length, MIN_PLAYERS));

  return (
    <Scene variant="menu">
      <div className="min-h-dvh flex flex-col items-center px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-1 text-center">🌐 {game.roomName}</h1>
        <p className="text-parchment/60 text-sm mb-2 text-center">รหัสห้อง</p>
        <p className="font-display text-4xl font-extrabold tracking-[0.3em] text-gold mb-1">{roomCode}</p>
        <p className="text-xs text-parchment/40 mb-6 text-center">ส่งรหัสนี้ให้เพื่อน แล้วให้แต่ละคนกด "เข้าร่วมห้อง" จากอุปกรณ์ของตัวเอง</p>

        <div className="w-full max-w-sm">
          <p className="text-sm text-parchment/60 mb-2">ผู้เล่นในห้อง ({players.length}/12)</p>
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
                </motion.div>
              ))}
            </AnimatePresence>
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

          {isHost ? (
            <>
              <Button
                variant="secondary"
                fullWidth
                className="mb-3"
                onClick={() => dispatch({ type: 'FILL_WITH_BOTS', targetCount: players.length + 1 })}
              >
                🤖 เพิ่ม AI Bot
              </Button>
              <Button fullWidth disabled={!canStart} onClick={() => dispatch({ type: 'START_GAME' })}>
                🎲 เริ่มเกม
              </Button>
              {!canStart && (
                <p className="text-xs text-werewolf mt-2 text-center">ต้องมีผู้เล่นอย่างน้อย {MIN_PLAYERS} คน (เพิ่ม AI Bot ได้ถ้าคนไม่ครบ)</p>
              )}
            </>
          ) : (
            <p className="text-sm text-parchment/50 text-center py-3">รอโฮสต์ห้องกดเริ่มเกม...</p>
          )}
        </div>
      </div>
    </Scene>
  );
}

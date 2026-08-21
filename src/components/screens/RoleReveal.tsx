import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { PassDeviceScreen } from '../ui/PassDeviceScreen';
import { Scene } from '../ui/Scene';
import { WaitingScreen } from '../ui/WaitingScreen';
import { useGameStore } from '../../store/gameStore';
import { ROLES } from '../../engine/roles';
import { useSound } from '../../hooks/useSound';

export function RoleReveal() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const mode = useGameStore((s) => s.mode);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const [revealedForId, setRevealedForId] = useState<string | null>(null);

  if (mode === 'online') {
    const me = game.players.find((p) => p.id === myPlayerId);
    if (!me) return null;
    if (me.hasSeenRole) {
      const pendingCount = game.players.filter((p) => !p.isBot && !p.hasSeenRole).length;
      return (
        <WaitingScreen
          text={pendingCount > 0 ? `รอผู้เล่นอีก ${pendingCount} คนดูบทบาทของตัวเอง...` : 'กำลังเริ่มคืนแรก...'}
        />
      );
    }
    return <RoleCard playerId={me.id} onAck={() => dispatch({ type: 'ACK_ROLE', playerId: me.id })} />;
  }

  const player = game.players[game.activeRoleRevealIndex];
  if (!player) return null;

  if (revealedForId !== player.id) {
    return (
      <PassDeviceScreen
        player={player}
        purpose="ถึงตาคุณดูบทบาทลับของตัวเองแล้ว ห้ามให้คนอื่นเห็นหน้าจอนี้"
        onReady={() => setRevealedForId(player.id)}
      />
    );
  }

  return <RoleCard playerId={player.id} onAck={() => dispatch({ type: 'ACK_ROLE', playerId: player.id })} />;
}

function RoleCard({ playerId, onAck }: { playerId: string; onAck: () => void }) {
  const player = useGameStore((s) => s.game.players.find((p) => p.id === playerId));
  const { play } = useSound();

  useEffect(() => {
    play('reveal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!player || !player.role) return null;
  const def = ROLES[player.role];
  const isWerewolf = def.team === 'WEREWOLF';

  return (
    <Scene variant="night" showSoundToggle={false}>
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-sm rounded-3xl border-2 p-8 shadow-2xl ${
            isWerewolf ? 'border-werewolf/70 bg-werewolf-dim/20' : 'bg-night-800/80 border-night-500'
          }`}
        >
          <p className="text-xs text-parchment/50 mb-2">บทบาทของคุณคือ...</p>
          <div className="text-7xl mb-3">{def.icon}</div>
          <h1 className="font-display text-2xl font-extrabold mb-1 uppercase tracking-wide">{def.nameEn}</h1>
          <p className="text-parchment/70 mb-4">{def.summary}</p>
          <div className="text-left bg-night-950/40 rounded-xl p-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold text-gold">ความสามารถ: </span>
              {def.ability}
            </p>
            <p>
              <span className="font-semibold text-gold">เป้าหมาย: </span>
              {def.goal}
            </p>
          </div>
        </motion.div>
        <div className="mt-8 w-full max-w-sm">
          <Button fullWidth onClick={onAck}>
            รับทราบ
          </Button>
        </div>
      </div>
    </Scene>
  );
}

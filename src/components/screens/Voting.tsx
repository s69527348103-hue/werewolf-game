import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PassDeviceScreen } from '../ui/PassDeviceScreen';
import { PlayerCard } from '../ui/PlayerCard';
import { Scene } from '../ui/Scene';
import { WaitingScreen } from '../ui/WaitingScreen';
import { useGameStore, runBotVoting } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

export function Voting() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const mode = useGameStore((s) => s.mode);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const { play } = useSound();
  const [revealedForId, setRevealedForId] = useState<string | null>(null);
  const isOnline = mode === 'online';

  const alive = game.players.filter((p) => p.isAlive);
  const sessionKey = `${game.roundNumber}:${game.isRevote ? 1 : 0}:${game.tiedCandidateIds.join('-')}`;
  const botsRanRef = useRef<string | null>(null);
  const resolvedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOnline) return; // the room server drives bot voting itself
    if (botsRanRef.current !== sessionKey) {
      botsRanRef.current = sessionKey;
      runBotVoting();
    }
  }, [isOnline, sessionKey]);

  useEffect(() => {
    if (isOnline) return; // the room server auto-resolves once everyone has voted
    const allVoted = alive.length > 0 && alive.every((p) => p.hasVoted);
    if (!allVoted || resolvedRef.current === sessionKey) return;
    // Mark as resolved only once the timeout actually fires, not when it's
    // scheduled — StrictMode's dev-mode double-invoke would otherwise clear
    // the first timeout via cleanup while the ref stays "already handled",
    // permanently skipping the second (real) scheduling.
    const t = setTimeout(() => {
      resolvedRef.current = sessionKey;
      dispatch({ type: 'RESOLVE_VOTES' });
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, game.players, sessionKey]);

  const eligibleIds = game.tiedCandidateIds.length > 0 ? game.tiedCandidateIds : alive.map((p) => p.id);

  if (isOnline) {
    const me = alive.find((p) => p.id === myPlayerId);
    if (!me) {
      return <WaitingScreen icon="⚖️" variant="day" text="กำลังรวบรวมผลโหวต..." />;
    }
    if (me.hasVoted) {
      return <WaitingScreen icon="⚖️" variant="day" text="คุณโหวตแล้ว รอผู้เล่นคนอื่น..." />;
    }
    const myCandidates = alive.filter((p) => eligibleIds.includes(p.id) && p.id !== me.id);
    return (
      <Scene variant="day">
        <div className="min-h-dvh flex flex-col items-center px-6 py-10">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="font-display text-2xl font-bold mb-1 text-day-950">VOTING PHASE</h1>
          <p className="text-day-800 mb-6 text-sm text-center max-w-sm">
            {game.isRevote ? 'คะแนนเสมอกัน โหวตใหม่อีกครั้ง' : 'เลือกผู้เล่นที่คุณคิดว่าเป็นหมาป่า'}
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8 max-w-xl"
          >
            {myCandidates.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                onClick={() => {
                  play('vote');
                  dispatch({ type: 'CAST_VOTE', voterId: me.id, targetId: p.id });
                }}
              />
            ))}
          </motion.div>
        </div>
      </Scene>
    );
  }

  const pendingHuman = alive.find((p) => !p.isBot && !p.hasVoted);
  const candidates = alive.filter((p) => eligibleIds.includes(p.id) && p.id !== pendingHuman?.id);

  if (!pendingHuman) {
    return (
      <Scene variant="day">
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4 animate-pulse-slow">⚖️</div>
          <p className="text-day-950/80 font-display">กำลังรวบรวมผลโหวต...</p>
        </div>
      </Scene>
    );
  }

  if (revealedForId !== pendingHuman.id) {
    return (
      <PassDeviceScreen
        player={pendingHuman}
        purpose={
          game.isRevote
            ? 'คะแนนเสมอกัน ถึงตาคุณโหวตใหม่อีกครั้ง'
            : 'ถึงตาคุณลงคะแนนเลือกผู้เล่นที่คิดว่าเป็นหมาป่า'
        }
        onReady={() => setRevealedForId(pendingHuman.id)}
      />
    );
  }

  return (
    <Scene variant="day">
      <div className="min-h-dvh flex flex-col items-center px-6 py-10">
        <div className="text-5xl mb-3">⚖️</div>
        <h1 className="font-display text-2xl font-bold mb-1 text-day-950">VOTING PHASE</h1>
        <p className="text-day-800 mb-6 text-sm text-center max-w-sm">
          {pendingHuman.name} เลือกผู้เล่นที่คิดว่าเป็นหมาป่า
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8 max-w-xl"
        >
          {candidates.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              selected={game.votes[pendingHuman.id] === p.id}
              onClick={() => {
                play('vote');
                dispatch({ type: 'CAST_VOTE', voterId: pendingHuman.id, targetId: p.id });
                setRevealedForId(null);
              }}
            />
          ))}
        </motion.div>
      </div>
    </Scene>
  );
}

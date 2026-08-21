import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { Timer } from '../ui/Timer';
import { useGameStore, botDiscussionLine } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';

const DISCUSSION_SECONDS = 90;

export function Discussion() {
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const mode = useGameStore((s) => s.mode);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const { play } = useSound();
  const feedRef = useRef<HTMLDivElement>(null);
  const isOnline = mode === 'online';

  const aliveHumans = game.players.filter((p) => p.isAlive && !p.isBot);
  const [speakerId, setSpeakerId] = useState(aliveHumans[0]?.id ?? '');
  const [text, setText] = useState('');
  const [votingStarted, setVotingStarted] = useState(false);

  const me = game.players.find((p) => p.id === myPlayerId);
  const canSpeak = isOnline ? !!me?.isAlive : aliveHumans.length > 0;
  const effectiveSpeakerId = isOnline ? myPlayerId ?? '' : speakerId;

  useEffect(() => {
    if (isOnline) return;
    if (!aliveHumans.find((p) => p.id === speakerId) && aliveHumans[0]) {
      setSpeakerId(aliveHumans[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, aliveHumans.length]);

  useEffect(() => {
    if (isOnline) return; // the room server drives bot chatter itself
    const interval = setInterval(() => {
      const line = botDiscussionLine();
      if (line) dispatch({ type: 'POST_DISCUSSION_MESSAGE', playerId: line.playerId, text: line.text });
    }, 3500 + Math.random() * 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [game.messages.length]);

  const roundMessages = game.messages.filter((m) => m.round === game.roundNumber);

  function send() {
    const trimmed = text.trim();
    if (!trimmed || !effectiveSpeakerId) return;
    dispatch({ type: 'POST_DISCUSSION_MESSAGE', playerId: effectiveSpeakerId, text: trimmed });
    setText('');
  }

  function goToVoting() {
    if (votingStarted) return;
    setVotingStarted(true);
    play('phaseDay');
    dispatch({ type: 'START_VOTING' });
  }

  return (
    <Scene variant="day">
      <div className="min-h-dvh flex flex-col items-center px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🗣️</span>
          <h1 className="font-display text-xl font-bold text-day-950">DISCUSSION — วันที่ {game.roundNumber}</h1>
        </div>
        <Timer seconds={DISCUSSION_SECONDS} onComplete={goToVoting} />

        <div className="w-full max-w-lg mt-4 mb-3 flex flex-wrap gap-1.5 justify-center">
          {game.players
            .filter((p) => p.isAlive)
            .map((p) => (
              <span key={p.id} className="text-xs bg-day-100/70 border border-day-700/30 rounded-full px-2 py-1 text-day-950">
                {p.avatar} {p.name}
              </span>
            ))}
        </div>

        <div
          ref={feedRef}
          className="w-full max-w-lg flex-1 min-h-[40vh] max-h-[45vh] overflow-y-auto bg-night-950/85 rounded-2xl border border-night-700 p-3 space-y-2 mb-4"
        >
          {roundMessages.length === 0 && (
            <p className="text-parchment/40 text-sm text-center py-8">ยังไม่มีใครพูด เริ่มการสนทนาได้เลย...</p>
          )}
          {roundMessages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 text-sm">
              <span>{m.avatar}</span>
              <span>
                <span className="font-semibold text-gold">{m.playerName}: </span>
                <span className="text-parchment/90">{m.text}</span>
              </span>
            </motion.div>
          ))}
        </div>

        <div className="w-full max-w-lg flex gap-2 mb-4">
          {!isOnline && (
            <select
              value={speakerId}
              onChange={(e) => setSpeakerId(e.target.value)}
              className="rounded-xl bg-day-100/80 border border-day-700/40 px-2 py-2 text-sm text-day-950 max-w-[9rem]"
            >
              {aliveHumans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.avatar} {p.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={canSpeak ? 'พิมพ์ข้อความ...' : isOnline ? 'คุณถูกกำจัดแล้ว พูดไม่ได้' : 'ไม่มีผู้เล่นที่พูดได้'}
            disabled={!canSpeak}
            className="flex-1 rounded-xl bg-day-100/80 border border-day-700/40 px-3 py-2 text-sm text-day-950 outline-none focus:border-gold placeholder:text-day-800/40"
          />
          <Button onClick={send} disabled={!text.trim() || !effectiveSpeakerId || !canSpeak}>
            ส่ง
          </Button>
        </div>

        <Button variant="secondary" onClick={goToVoting}>
          ข้ามไปโหวตเลย →
        </Button>
      </div>
    </Scene>
  );
}

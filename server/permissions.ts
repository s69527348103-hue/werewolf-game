// Server-side authorization for game actions arriving over the wire. The
// browser UI already only lets a player attempt their own actions, but the
// server can't trust that — a client is just JSON someone could hand-craft.
import type { GameAction } from '../src/engine/reducer';
import type { GameState } from '../src/engine/types';

const HOST_ONLY: GameAction['type'][] = ['REMOVE_PLAYER', 'FILL_WITH_BOTS', 'START_GAME', 'SET_ROOM_NAME'];

// Never runs from a network message — either not meaningful for a room
// (ADD_PLAYER/RESET_GAME are handled by dedicated room-lifecycle messages),
// bot-only internal bookkeeping (BUMP_SUSPICION), or server-driven only
// (RESOLVE_VOTES fires automatically once every alive player has voted).
const DISALLOWED = new Set<GameAction['type']>(['ADD_PLAYER', 'RESET_GAME', 'BUMP_SUSPICION', 'RESOLVE_VOTES']);

export function validateAction(
  game: GameState,
  senderId: string,
  hostId: string,
  action: GameAction,
): string | null {
  if (DISALLOWED.has(action.type)) return 'การกระทำนี้ใช้ผ่านเครือข่ายไม่ได้';
  if (HOST_ONLY.includes(action.type) && senderId !== hostId) return 'เฉพาะโฮสต์ห้องเท่านั้นที่ทำสิ่งนี้ได้';

  const sender = game.players.find((p) => p.id === senderId);

  switch (action.type) {
    case 'ACK_ROLE':
      if (action.playerId !== senderId) return 'ดูได้เฉพาะบทบาทของตัวเอง';
      return null;
    case 'SET_WEREWOLF_TARGET':
    case 'CONFIRM_WEREWOLF_ACTION':
      if (!sender?.isAlive || sender.role !== 'WEREWOLF') return 'คุณไม่ใช่หมาป่า';
      return null;
    case 'SET_DOCTOR_TARGET':
    case 'CONFIRM_DOCTOR_ACTION':
      if (!sender?.isAlive || sender.role !== 'DOCTOR') return 'คุณไม่ใช่หมอ';
      return null;
    case 'SET_SEER_TARGET':
    case 'REVEAL_SEER_RESULT':
    case 'CONFIRM_SEER_ACTION':
      if (!sender?.isAlive || sender.role !== 'SEER') return 'คุณไม่ใช่ผู้หยั่งรู้';
      return null;
    case 'CAST_VOTE':
      if (action.voterId !== senderId) return 'โหวตแทนผู้เล่นอื่นไม่ได้';
      return null;
    case 'POST_DISCUSSION_MESSAGE':
      if (action.playerId !== senderId) return 'พูดแทนผู้เล่นอื่นไม่ได้';
      return null;
    default:
      // BEGIN_NIGHT, ACK_NIGHT_RESULT, START_DISCUSSION, START_VOTING,
      // ACK_VOTE_RESULT: purely phase-advancing, no side effect beyond the
      // reducer's own phase guard — any connected player may trigger these,
      // duplicate/racing calls are a harmless no-op.
      return null;
  }
}

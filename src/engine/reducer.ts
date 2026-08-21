import type { GamePhase, GameState, Player, RoleId } from './types';
import { ROLES, buildRoleDeck } from './roles';
import { pushLog } from './log';
import { randomId, shuffle } from './utils';
import { checkWinCondition } from './winCondition';
import { randomPersonality } from '../ai/personalities';

const AVATAR_POOL = [
  '🧑', '👩', '🧔', '👨', '👩‍🦰', '🧑‍🦱', '👨‍🦳', '👩‍🦳',
  '🧑‍🎤', '👨‍🌾', '👩‍🚀', '🧑‍🍳', '👨‍🎨', '👩‍🏫', '🧑‍💻', '👨‍⚕️',
];

// Explicit allowed edges for the game's state machine. The reducer only ever
// moves currentPhase along one of these edges, so a screen can never be
// skipped by a stray action or a re-dispatched event.
const PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  LOBBY: ['ROLE_REVEAL'],
  ROLE_REVEAL: ['NIGHT'],
  NIGHT: ['WEREWOLF_ACTION'],
  WEREWOLF_ACTION: ['DOCTOR_ACTION', 'SEER_ACTION', 'NIGHT_RESULT'],
  DOCTOR_ACTION: ['SEER_ACTION', 'NIGHT_RESULT'],
  SEER_ACTION: ['NIGHT_RESULT'],
  NIGHT_RESULT: ['DAY'],
  DAY: ['DISCUSSION'],
  DISCUSSION: ['VOTING'],
  VOTING: ['VOTING', 'VOTE_RESULT'],
  VOTE_RESULT: ['CHECK_WIN'],
  CHECK_WIN: ['NIGHT', 'GAME_OVER'],
  GAME_OVER: [],
};

function goTo(state: GameState, next: GamePhase): GameState {
  const allowed = PHASE_TRANSITIONS[state.currentPhase];
  if (!allowed.includes(next)) {
    console.warn(`Blocked illegal phase transition ${state.currentPhase} -> ${next}`);
    return state;
  }
  return { ...state, currentPhase: next };
}

export function createInitialState(): GameState {
  return {
    gameId: randomId('game'),
    roomName: '',
    players: [],
    currentPhase: 'LOBBY',
    roundNumber: 0,
    nightTarget: null,
    doctorTarget: null,
    seerTarget: null,
    seerResult: null,
    votes: {},
    winner: null,
    gameStatus: 'lobby',
    log: [],
    messages: [],
    nightHistory: [],
    voteHistory: [],
    tiedCandidateIds: [],
    isRevote: false,
    lastNightVictimId: null,
    lastNightSaved: false,
    humanPlayerIndex: 0,
    activeRoleRevealIndex: 0,
  };
}

function createPlayer(name: string, isBot: boolean, usedAvatars: Set<string>): Player {
  let avatar = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
  let guard = 0;
  while (usedAvatars.has(avatar) && guard < 30) {
    avatar = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
    guard++;
  }
  usedAvatars.add(avatar);
  return {
    id: randomId('p'),
    name,
    avatar,
    role: null,
    team: null,
    isAlive: true,
    isProtected: false,
    voteTarget: null,
    hasVoted: false,
    isBot,
    personality: isBot ? randomPersonality() : null,
    hasSeenRole: false,
    suspicion: {},
  };
}

export type GameAction =
  | { type: 'SET_ROOM_NAME'; roomName: string }
  | { type: 'ADD_PLAYER'; name: string; isBot?: boolean }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'FILL_WITH_BOTS'; targetCount: number }
  | { type: 'START_GAME' }
  | { type: 'ACK_ROLE'; playerId: string }
  | { type: 'BEGIN_NIGHT' }
  | { type: 'SET_WEREWOLF_TARGET'; targetId: string }
  | { type: 'CONFIRM_WEREWOLF_ACTION' }
  | { type: 'SET_DOCTOR_TARGET'; targetId: string }
  | { type: 'CONFIRM_DOCTOR_ACTION' }
  | { type: 'SET_SEER_TARGET'; targetId: string }
  | { type: 'REVEAL_SEER_RESULT' }
  | { type: 'CONFIRM_SEER_ACTION' }
  | { type: 'ACK_NIGHT_RESULT' }
  | { type: 'START_DISCUSSION' }
  | { type: 'POST_DISCUSSION_MESSAGE'; playerId: string; text: string }
  | { type: 'START_VOTING' }
  | { type: 'CAST_VOTE'; voterId: string; targetId: string }
  | { type: 'RESOLVE_VOTES' }
  | { type: 'ACK_VOTE_RESULT' }
  | { type: 'BUMP_SUSPICION'; targetId: string; amount: number }
  | { type: 'RESET_GAME' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_ROOM_NAME':
      return { ...state, roomName: action.roomName };

    case 'ADD_PLAYER': {
      const used = new Set(state.players.map((p) => p.avatar));
      const player = createPlayer(action.name, action.isBot ?? false, used);
      return { ...state, players: [...state.players, player] };
    }

    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter((p) => p.id !== action.id) };

    case 'FILL_WITH_BOTS': {
      const botNames = ['บอทน้อย', 'เงาราตรี', 'หมาป่าปริศนา', 'จอมสงสัย', 'นักสืบมือใหม่', 'คนเงียบ'];
      const used = new Set(state.players.map((p) => p.avatar));
      const players = [...state.players];
      let i = 0;
      while (players.length < action.targetCount) {
        const name = `${botNames[i % botNames.length]} ${Math.floor(i / botNames.length) + 1}`;
        players.push(createPlayer(name, true, used));
        i++;
      }
      return { ...state, players };
    }

    case 'START_GAME': {
      if (state.players.length < 6) return state;
      const deck = shuffle(buildRoleDeck(state.players.length));
      const players = state.players.map((p, idx) => {
        const role: RoleId = deck[idx];
        return {
          ...p,
          role,
          team: ROLES[role].team,
          hasSeenRole: p.isBot ? true : false,
        };
      });
      const firstHumanIndex = players.findIndex((p) => !p.isBot);
      const log = pushLog(state.log, 0, 'ROLE_REVEAL', 'เกมเริ่มต้น บทบาทถูกสุ่มให้ผู้เล่นทุกคนแล้ว', '🎲');
      const base = { ...state, players, log, gameStatus: 'playing' as const, activeRoleRevealIndex: Math.max(0, firstHumanIndex) };
      if (firstHumanIndex === -1) {
        // No human players in this game — nothing to reveal privately, skip straight to night.
        return goTo(goTo(base, 'ROLE_REVEAL'), 'NIGHT');
      }
      return goTo(base, 'ROLE_REVEAL');
    }

    case 'ACK_ROLE': {
      if (state.currentPhase !== 'ROLE_REVEAL') return state;
      const players = state.players.map((p) =>
        p.id === action.playerId ? { ...p, hasSeenRole: true } : p,
      );
      const humans = players.filter((p) => !p.isBot);
      const allSeen = humans.every((p) => p.hasSeenRole);
      if (allSeen) {
        return goTo({ ...state, players }, 'NIGHT');
      }
      const currentIdx = players.findIndex((p) => p.id === action.playerId);
      let nextIdx = currentIdx + 1;
      while (nextIdx < players.length && (players[nextIdx].isBot || players[nextIdx].hasSeenRole)) {
        nextIdx++;
      }
      return { ...state, players, activeRoleRevealIndex: nextIdx < players.length ? nextIdx : currentIdx };
    }

    case 'BEGIN_NIGHT': {
      if (state.currentPhase !== 'NIGHT') return state;
      const round = state.roundNumber + 1;
      const players = state.players.map((p) => ({ ...p, isProtected: false, voteTarget: null, hasVoted: false }));
      const log = pushLog(state.log, round, 'NIGHT', `🌙 คืนที่ ${round} เริ่มต้น ทุกคนหลับตา...`, '🌙');
      return goTo({ ...state, players, roundNumber: round, log, nightTarget: null, doctorTarget: null, seerTarget: null, seerResult: null }, 'WEREWOLF_ACTION');
    }

    case 'SET_WEREWOLF_TARGET':
      if (state.currentPhase !== 'WEREWOLF_ACTION') return state;
      return { ...state, nightTarget: action.targetId };

    case 'CONFIRM_WEREWOLF_ACTION': {
      if (state.currentPhase !== 'WEREWOLF_ACTION') return state;
      const log = pushLog(state.log, state.roundNumber, 'WEREWOLF_ACTION', `คืนที่ ${state.roundNumber} – หมาป่าเลือกเป้าหมายแล้ว`, '🐺');
      const doctorAlive = state.players.some((p) => p.role === 'DOCTOR' && p.isAlive);
      const seerAlive = state.players.some((p) => p.role === 'SEER' && p.isAlive);
      const next = { ...state, log };
      if (doctorAlive) return goTo(next, 'DOCTOR_ACTION');
      if (seerAlive) return goTo(next, 'SEER_ACTION');
      return goTo(next, 'NIGHT_RESULT');
    }

    case 'SET_DOCTOR_TARGET':
      if (state.currentPhase !== 'DOCTOR_ACTION') return state;
      return { ...state, doctorTarget: action.targetId };

    case 'CONFIRM_DOCTOR_ACTION': {
      if (state.currentPhase !== 'DOCTOR_ACTION') return state;
      const players = state.players.map((p) =>
        p.id === state.doctorTarget ? { ...p, isProtected: true } : p,
      );
      const log = pushLog(state.log, state.roundNumber, 'DOCTOR_ACTION', `คืนที่ ${state.roundNumber} – หมอเลือกปกป้องแล้ว`, '🩺');
      const seerAlive = players.some((p) => p.role === 'SEER' && p.isAlive);
      const next = { ...state, players, log };
      if (seerAlive) return goTo(next, 'SEER_ACTION');
      return goTo(next, 'NIGHT_RESULT');
    }

    case 'SET_SEER_TARGET':
      if (state.currentPhase !== 'SEER_ACTION') return state;
      return { ...state, seerTarget: action.targetId };

    case 'REVEAL_SEER_RESULT': {
      if (state.currentPhase !== 'SEER_ACTION') return state;
      const target = state.players.find((p) => p.id === state.seerTarget);
      const seerResult = target
        ? { round: state.roundNumber, targetId: target.id, targetName: target.name, isWerewolf: target.role === 'WEREWOLF' }
        : null;
      return { ...state, seerResult };
    }

    case 'CONFIRM_SEER_ACTION': {
      if (state.currentPhase !== 'SEER_ACTION') return state;
      const log = pushLog(state.log, state.roundNumber, 'SEER_ACTION', `คืนที่ ${state.roundNumber} – ผู้หยั่งรู้ตรวจสอบแล้ว`, '🔮');
      return goTo({ ...state, log }, 'NIGHT_RESULT');
    }

    case 'ACK_NIGHT_RESULT': {
      if (state.currentPhase !== 'NIGHT_RESULT') return state;
      const werewolfTarget = state.players.find((p) => p.id === state.nightTarget);
      const wasProtected = !!werewolfTarget?.isProtected;
      const victimId = werewolfTarget && !wasProtected ? werewolfTarget.id : null;
      const players = victimId
        ? state.players.map((p) => (p.id === victimId ? { ...p, isAlive: false } : p))
        : state.players;

      const nightHistory = [
        ...state.nightHistory,
        {
          round: state.roundNumber,
          werewolfTargetId: state.nightTarget,
          doctorTargetId: state.doctorTarget,
          seerTargetId: state.seerTarget,
          seerResult: state.seerResult?.isWerewolf ?? null,
          victimId,
          doctorSaved: !!werewolfTarget && wasProtected,
        },
      ];

      const log = pushLog(
        state.log,
        state.roundNumber,
        'NIGHT_RESULT',
        victimId
          ? `คืนที่ ${state.roundNumber} – ผู้เล่น "${werewolfTarget?.name}" เสียชีวิต`
          : `คืนที่ ${state.roundNumber} – ไม่มีผู้เสียชีวิต`,
        victimId ? '💀' : '🌅',
      );

      return goTo(
        {
          ...state,
          players,
          nightHistory,
          log,
          lastNightVictimId: victimId,
          lastNightSaved: !!werewolfTarget && wasProtected,
        },
        'DAY',
      );
    }

    case 'START_DISCUSSION': {
      if (state.currentPhase !== 'DAY') return state;
      const log = pushLog(state.log, state.roundNumber, 'DISCUSSION', `วันที่ ${state.roundNumber} – เริ่มการอภิปราย`, '🗣️');
      return goTo({ ...state, log }, 'DISCUSSION');
    }

    case 'POST_DISCUSSION_MESSAGE': {
      if (state.currentPhase !== 'DISCUSSION') return state;
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player || !player.isAlive) return state;
      const message = {
        id: randomId('msg'),
        round: state.roundNumber,
        playerId: player.id,
        playerName: player.name,
        avatar: player.avatar,
        text: action.text,
        timestamp: Date.now(),
      };
      return { ...state, messages: [...state.messages, message] };
    }

    case 'START_VOTING': {
      if (state.currentPhase !== 'DISCUSSION') return state;
      const players = state.players.map((p) => ({ ...p, voteTarget: null, hasVoted: false }));
      return goTo({ ...state, players, votes: {} }, 'VOTING');
    }

    case 'CAST_VOTE': {
      if (state.currentPhase !== 'VOTING') return state;
      const voter = state.players.find((p) => p.id === action.voterId);
      if (!voter || !voter.isAlive) return state;
      const players = state.players.map((p) =>
        p.id === action.voterId ? { ...p, voteTarget: action.targetId, hasVoted: true } : p,
      );
      const votes = { ...state.votes, [action.voterId]: action.targetId };
      return { ...state, players, votes };
    }

    case 'RESOLVE_VOTES': {
      if (state.currentPhase !== 'VOTING') return state;
      const tally: Record<string, number> = {};
      Object.values(state.votes).forEach((targetId) => {
        tally[targetId] = (tally[targetId] ?? 0) + 1;
      });
      const entries = Object.entries(tally);
      let voteLog = state.log;
      Object.entries(state.votes).forEach(([voterId, targetId]) => {
        const voter = state.players.find((p) => p.id === voterId);
        const target = state.players.find((p) => p.id === targetId);
        if (voter && target) {
          voteLog = pushLog(voteLog, state.roundNumber, 'VOTE_RESULT', `วันที่ ${state.roundNumber} – ผู้เล่น "${voter.name}" โหวตผู้เล่น "${target.name}"`, '🗳️');
        }
      });

      if (entries.length === 0) {
        const log = pushLog(voteLog, state.roundNumber, 'VOTE_RESULT', `วันที่ ${state.roundNumber} – ไม่มีใครถูกกำจัดในวันนี้`, '🤷');
        const voteHistory = [...state.voteHistory, { round: state.roundNumber, votes: state.votes, eliminatedId: null, wasTie: false, revoteCandidateIds: [] }];
        return goTo({ ...state, log, voteHistory, isRevote: false, tiedCandidateIds: [] }, 'VOTE_RESULT');
      }

      const maxVotes = Math.max(...entries.map(([, count]) => count));
      const topCandidates = entries.filter(([, count]) => count === maxVotes).map(([id]) => id);

      if (topCandidates.length > 1) {
        if (state.isRevote) {
          const log = pushLog(voteLog, state.roundNumber, 'VOTE_RESULT', `วันที่ ${state.roundNumber} – คะแนนเสมอกันอีกครั้ง ไม่มีใครถูกกำจัดในวันนี้`, '🤝');
          const voteHistory = [...state.voteHistory, { round: state.roundNumber, votes: state.votes, eliminatedId: null, wasTie: true, revoteCandidateIds: topCandidates }];
          return goTo({ ...state, log, voteHistory, isRevote: false, tiedCandidateIds: [] }, 'VOTE_RESULT');
        }
        const players = state.players.map((p) => ({ ...p, voteTarget: null, hasVoted: false }));
        const log = pushLog(voteLog, state.roundNumber, 'VOTE_RESULT', `วันที่ ${state.roundNumber} – คะแนนเสมอกัน เข้าสู่การโหวตใหม่`, '⚖️');
        return goTo(
          { ...state, players, votes: {}, log, isRevote: true, tiedCandidateIds: topCandidates },
          'VOTING',
        );
      }

      const eliminatedId = topCandidates[0];
      const eliminated = state.players.find((p) => p.id === eliminatedId);
      const players = state.players.map((p) => (p.id === eliminatedId ? { ...p, isAlive: false } : p));
      const log = pushLog(
        voteLog,
        state.roundNumber,
        'VOTE_RESULT',
        `วันที่ ${state.roundNumber} – ผู้เล่น "${eliminated?.name}" ถูกกำจัด (${eliminated ? ROLES[eliminated.role as RoleId].name : ''})`,
        '💀',
      );
      const voteHistory = [...state.voteHistory, { round: state.roundNumber, votes: state.votes, eliminatedId, wasTie: false, revoteCandidateIds: [] }];
      return goTo({ ...state, players, log, voteHistory, isRevote: false, tiedCandidateIds: [] }, 'VOTE_RESULT');
    }

    case 'ACK_VOTE_RESULT': {
      if (state.currentPhase !== 'VOTE_RESULT') return state;
      const afterCheckWin = goTo(state, 'CHECK_WIN');
      const winner = checkWinCondition(afterCheckWin.players);
      if (winner) {
        const log = pushLog(afterCheckWin.log, state.roundNumber, 'GAME_OVER', winner === 'VILLAGER' ? '🎉 ชาวบ้านสามารถค้นหาและกำจัดหมาป่าได้ทั้งหมด' : '🐺 หมาป่าสามารถควบคุมหมู่บ้านได้สำเร็จ', winner === 'VILLAGER' ? '🎉' : '🐺');
        return goTo({ ...afterCheckWin, winner, gameStatus: 'ended' as const, log }, 'GAME_OVER');
      }
      return goTo(afterCheckWin, 'NIGHT');
    }

    case 'BUMP_SUSPICION': {
      const players = state.players.map((p) => {
        if (!p.isBot || p.id === action.targetId) return p;
        return { ...p, suspicion: { ...p.suspicion, [action.targetId]: (p.suspicion[action.targetId] ?? 0) + action.amount } };
      });
      return { ...state, players };
    }

    case 'RESET_GAME':
      return createInitialState();

    default:
      return state;
  }
}

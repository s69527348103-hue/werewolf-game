import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createInitialState, gameReducer, type GameAction } from '../src/engine/reducer';
import type { GameState } from '../src/engine/types';
import * as bots from '../src/engine/botOrchestration';
import { MAX_PLAYERS } from '../src/engine/roles';
import type { ClientMessage, ServerMessage } from '../src/net/protocol';
import { filterViewForPlayer } from './filterView';
import { validateAction } from './permissions';

interface Room {
  code: string;
  game: GameState;
  hostId: string;
  sockets: Map<string, WebSocket>;
  actionTimer: ReturnType<typeof setTimeout> | null;
  discussionTimer: ReturnType<typeof setInterval> | null;
}

const rooms = new Map<string, Room>();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function generateCode(): string {
  let code: string;
  do {
    code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(room: Room) {
  room.sockets.forEach((ws, playerId) => {
    send(ws, { type: 'STATE', view: filterViewForPlayer(room.game, playerId) });
  });
}

function clearTimers(room: Room) {
  if (room.actionTimer) {
    clearTimeout(room.actionTimer);
    room.actionTimer = null;
  }
  if (room.discussionTimer) {
    clearInterval(room.discussionTimer);
    room.discussionTimer = null;
  }
}

function roomDispatch(room: Room) {
  return (action: GameAction) => applyAction(room, action);
}

function applyAction(room: Room, action: GameAction) {
  room.game = gameReducer(room.game, action);
  broadcast(room);
  scheduleBotCascade(room);
}

/** Keeps a room moving when the active role/vote has no connected human behind it. */
function scheduleBotCascade(room: Room) {
  clearTimers(room);
  const game = room.game;

  if (game.currentPhase === 'WEREWOLF_ACTION') {
    const hasHuman = game.players.some((p) => p.isAlive && p.role === 'WEREWOLF' && !p.isBot);
    if (!hasHuman) {
      room.actionTimer = setTimeout(() => bots.autoResolveWerewolfTurn(room.game, roomDispatch(room)), 1400);
    }
  } else if (game.currentPhase === 'DOCTOR_ACTION') {
    const doctor = game.players.find((p) => p.isAlive && p.role === 'DOCTOR');
    if (doctor?.isBot) {
      room.actionTimer = setTimeout(() => bots.autoResolveDoctorTurn(room.game, roomDispatch(room)), 1400);
    }
  } else if (game.currentPhase === 'SEER_ACTION') {
    const seer = game.players.find((p) => p.isAlive && p.role === 'SEER');
    if (seer?.isBot) {
      room.actionTimer = setTimeout(() => bots.autoResolveSeerTurn(room.game, roomDispatch(room)), 1400);
    }
  } else if (game.currentPhase === 'DISCUSSION') {
    room.discussionTimer = setInterval(() => {
      const line = bots.botDiscussionLine(room.game);
      if (line) applyAction(room, { type: 'POST_DISCUSSION_MESSAGE', playerId: line.playerId, text: line.text });
    }, 4500);
  } else if (game.currentPhase === 'VOTING') {
    const alive = game.players.filter((p) => p.isAlive);
    const botsNotVoted = alive.filter((p) => p.isBot && !p.hasVoted);
    if (botsNotVoted.length > 0) {
      room.actionTimer = setTimeout(() => bots.runBotVoting(room.game, roomDispatch(room)), 900);
    } else if (alive.length > 0 && alive.every((p) => p.hasVoted)) {
      room.actionTimer = setTimeout(() => applyAction(room, { type: 'RESOLVE_VOTES' }), 700);
    }
  }
}

const PORT = Number(process.env.PORT) || 8787;

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Werewolf online server is running.\n');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  let roomCode: string | null = null;
  let playerId: string | null = null;

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'CREATE_ROOM') {
      const code = generateCode();
      let game = createInitialState();
      game = gameReducer(game, { type: 'SET_ROOM_NAME', roomName: msg.roomName?.trim() || 'หมู่บ้านออนไลน์' });
      game = gameReducer(game, { type: 'ADD_PLAYER', name: msg.playerName?.trim() || 'ผู้เล่น', isBot: false });
      const host = game.players[game.players.length - 1];
      const room: Room = { code, game, hostId: host.id, sockets: new Map(), actionTimer: null, discussionTimer: null };
      room.sockets.set(host.id, ws);
      rooms.set(code, room);
      roomCode = code;
      playerId = host.id;
      send(ws, { type: 'JOINED', roomCode: code, playerId: host.id, isHost: true, view: filterViewForPlayer(room.game, host.id) });
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      const room = rooms.get(msg.roomCode);
      if (!room) {
        send(ws, { type: 'ERROR', message: 'ไม่พบห้องนี้ ตรวจสอบรหัสห้องอีกครั้ง' });
        return;
      }
      if (room.game.currentPhase !== 'LOBBY') {
        send(ws, { type: 'ERROR', message: 'เกมในห้องนี้เริ่มไปแล้ว เข้าร่วมไม่ได้' });
        return;
      }
      if (room.game.players.length >= MAX_PLAYERS) {
        send(ws, { type: 'ERROR', message: 'ห้องเต็มแล้ว' });
        return;
      }
      room.game = gameReducer(room.game, { type: 'ADD_PLAYER', name: msg.playerName?.trim() || 'ผู้เล่น', isBot: false });
      const player = room.game.players[room.game.players.length - 1];
      room.sockets.set(player.id, ws);
      roomCode = room.code;
      playerId = player.id;
      send(ws, {
        type: 'JOINED',
        roomCode: room.code,
        playerId: player.id,
        isHost: player.id === room.hostId,
        view: filterViewForPlayer(room.game, player.id),
      });
      broadcast(room);
      return;
    }

    if (msg.type === 'GAME_ACTION') {
      if (!roomCode || !playerId) return;
      const room = rooms.get(roomCode);
      if (!room) return;
      const error = validateAction(room.game, playerId, room.hostId, msg.action);
      if (error) {
        send(ws, { type: 'ERROR', message: error });
        return;
      }
      applyAction(room, msg.action);
      return;
    }
  });

  ws.on('close', () => {
    if (!roomCode || !playerId) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    room.sockets.delete(playerId);
    if (room.sockets.size === 0) {
      clearTimers(room);
      rooms.delete(roomCode);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Werewolf online server listening on :${PORT}`);
});

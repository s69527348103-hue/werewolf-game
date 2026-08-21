// Wire protocol between the browser client and the online room server.
// Kept dependency-free so the server (plain Node) can import it directly.
import type { GameAction } from '../engine/reducer';
import type { GameState } from '../engine/types';

export type ClientMessage =
  | { type: 'CREATE_ROOM'; roomName: string; playerName: string }
  | { type: 'JOIN_ROOM'; roomCode: string; playerName: string }
  | { type: 'GAME_ACTION'; action: GameAction };

export type ServerMessage =
  | { type: 'JOINED'; roomCode: string; playerId: string; isHost: boolean; view: GameState }
  | { type: 'STATE'; view: GameState }
  | { type: 'ERROR'; message: string };

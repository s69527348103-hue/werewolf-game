import { create } from 'zustand';
import type { GameAction } from '../engine/reducer';
import { createInitialState, gameReducer } from '../engine/reducer';
import type { GameState } from '../engine/types';
import * as bots from '../engine/botOrchestration';
import { connectSocket, type SocketHandle } from '../net/socket';

export type StoreMode = 'local' | 'online';

interface GameStore {
  game: GameState;
  mode: StoreMode;
  myPlayerId: string | null;
  isHost: boolean;
  roomCode: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  connectionError: string | null;
  socket: SocketHandle | null;

  dispatch: (action: GameAction) => void;
  reset: () => void;

  /** Applies a filtered state snapshot pushed by the online server. Never goes through the local reducer. */
  applyServerState: (view: GameState) => void;
  createOnlineRoom: (serverUrl: string, roomName: string, playerName: string) => Promise<void>;
  joinOnlineRoom: (serverUrl: string, roomCode: string, playerName: string) => Promise<void>;
  disconnectOnline: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: createInitialState(),
  mode: 'local',
  myPlayerId: null,
  isHost: false,
  roomCode: null,
  connectionStatus: 'idle',
  connectionError: null,
  socket: null,

  dispatch: (action) => {
    const { mode, socket } = get();
    if (mode === 'online') {
      socket?.send({ type: 'GAME_ACTION', action });
      return;
    }
    set((s) => ({ game: gameReducer(s.game, action) }));
  },

  reset: () => {
    get().socket?.close();
    set({
      game: createInitialState(),
      mode: 'local',
      myPlayerId: null,
      isHost: false,
      roomCode: null,
      connectionStatus: 'idle',
      connectionError: null,
      socket: null,
    });
  },

  applyServerState: (view) => set({ game: view }),

  createOnlineRoom: (serverUrl, roomName, playerName) =>
    connectAndSend(set, get, serverUrl, { type: 'CREATE_ROOM', roomName, playerName }),

  joinOnlineRoom: (serverUrl, roomCode, playerName) =>
    connectAndSend(set, get, serverUrl, { type: 'JOIN_ROOM', roomCode: roomCode.toUpperCase(), playerName }),

  disconnectOnline: () => {
    get().socket?.close();
    set({ socket: null, connectionStatus: 'idle' });
  },
}));

/**
 * Opens the socket and sends the room-entry message (CREATE_ROOM/JOIN_ROOM)
 * the instant it's open, then resolves once the server replies JOINED (or
 * rejects on ERROR/close). Combining connect+send into one call avoids a
 * connect-then-send ordering bug: sending only after "the connection is
 * ready" resolved was itself waiting on a reply to a message nothing had
 * sent yet.
 */
function connectAndSend(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
  serverUrl: string,
  entryMessage: { type: 'CREATE_ROOM' | 'JOIN_ROOM'; roomName?: string; roomCode?: string; playerName: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    set({ connectionStatus: 'connecting', connectionError: null, mode: 'online' });
    let settled = false;
    const socket = connectSocket(serverUrl, {
      onOpen: () => socket.send(entryMessage as never),
      onMessage: (msg) => {
        if (msg.type === 'JOINED') {
          set({
            myPlayerId: msg.playerId,
            isHost: msg.isHost,
            roomCode: msg.roomCode,
            game: msg.view,
            connectionStatus: 'connected',
          });
          settled = true;
          resolve();
        } else if (msg.type === 'STATE') {
          set({ game: msg.view });
        } else if (msg.type === 'ERROR') {
          set({ connectionStatus: 'error', connectionError: msg.message });
          settled = true;
          reject(new Error(msg.message));
        }
      },
      onClose: () => {
        if (get().connectionStatus !== 'error') {
          set({ connectionStatus: 'error', connectionError: 'การเชื่อมต่อขาดหาย' });
        }
        if (!settled) {
          settled = true;
          reject(new Error('connection closed'));
        }
      },
      onError: () => {
        set({ connectionStatus: 'error', connectionError: 'เชื่อมต่อ server ไม่สำเร็จ' });
        if (!settled) {
          settled = true;
          reject(new Error('connection failed'));
        }
      },
    });
    set({ socket });
  });
}

// --- Bot orchestration (local mode only) ----------------------------------
// Screens call these once when a phase becomes "bot-only" so the local
// pass-and-play game keeps moving without a human waiting on an empty
// action. In online mode the server drives bots itself; these are no-ops
// there so a screen can call them unconditionally.

export function autoResolveWerewolfTurn() {
  const { game, dispatch, mode } = useGameStore.getState();
  if (mode === 'online') return;
  bots.autoResolveWerewolfTurn(game, dispatch);
}

export function autoResolveDoctorTurn() {
  const { game, dispatch, mode } = useGameStore.getState();
  if (mode === 'online') return;
  bots.autoResolveDoctorTurn(game, dispatch);
}

export function autoResolveSeerTurn() {
  const { game, dispatch, mode } = useGameStore.getState();
  if (mode === 'online') return;
  bots.autoResolveSeerTurn(game, dispatch);
}

export function botDiscussionLine(): { playerId: string; text: string } | null {
  const { game, mode } = useGameStore.getState();
  if (mode === 'online') return null;
  return bots.botDiscussionLine(game);
}

export function runBotVoting() {
  const { game, dispatch, mode } = useGameStore.getState();
  if (mode === 'online') return;
  bots.runBotVoting(game, dispatch);
}

/** After a night death or an elimination reveal, bots who saw it nudge their suspicion of related players. */
export function applySuspicionFromEvent(targetId: string, amount: number) {
  const { mode, dispatch } = useGameStore.getState();
  if (mode === 'online') return;
  dispatch({ type: 'BUMP_SUSPICION', targetId, amount });
}

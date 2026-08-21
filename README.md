# Werewolf — หมู่บ้านแห่งความลับ

Social deduction game (Werewolf/Mafia), 6–12 players, with AI bots filling empty seats. Two ways to play:

- **Local (pass-and-play):** one shared device, players pass it around. No server needed.
- **Online:** each player joins from their own device with a room code. Real per-player privacy — a client's browser never even receives another player's role, night target, or vote until it's supposed to.

Credit: created by storyman.

## Run the game (client)

```bash
npm install
npm run dev
```

## Run online multiplayer

The online mode needs the room server running somewhere reachable by every player's browser.

**Test locally** (works for players on the same machine/network):

```bash
npm run server        # starts on :8787
```

Then in the app's "🌐 เล่นออนไลน์" screen, leave the server URL as `ws://localhost:8787` (or your machine's LAN IP for other devices on the same network).

**Deploy it for real** (players on different networks — the actual "online" case):

The server is a plain Node process (`server/index.ts`, `npm run server` as its start command) — any Node host works. The fastest free option:

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → New → Blueprint → point it at your repo. It reads `render.yaml` in this project and sets everything up automatically (free tier, no credit card).
3. Once deployed, copy the service URL Render gives you (`https://xxxx.onrender.com`) and turn it into a WebSocket URL: `wss://xxxx.onrender.com`.
4. In the game's "ตั้งค่าเซิร์ฟเวอร์ (ขั้นสูง)" field on the online-entry screen, paste that `wss://…` URL. Or bake it in permanently by setting `VITE_WS_URL=wss://xxxx.onrender.com` in a `.env` file before running `npm run build`, so players never have to type it.

Render's free tier spins the service down after inactivity — the first connection after a while takes a few extra seconds to wake it up, that's normal.

## Architecture

- **`src/engine/`** — pure game logic, zero React/UI/Node dependency. Shared by the browser client *and* the server.
  - `types.ts` — `Player`, `GameState`, `GamePhase`, etc.
  - `roles.ts` — role definitions + the 6–12 player role-distribution table.
  - `reducer.ts` — the state machine. `gameReducer(state, action)` is a pure function; an explicit `PHASE_TRANSITIONS` edge map plus a same-phase guard on every case means a phase can never be skipped or double-applied by a stray/duplicate/racing dispatch.
  - `botOrchestration.ts` — bot-turn logic as `(game, dispatch) => void` functions, usable from either the browser (local mode) or the server (online mode).
  - `winCondition.ts`, `log.ts`, `utils.ts`.
- **`src/ai/`** — bot decision-making (target selection, voting, discussion lines) and the 5 personalities, all pure functions operating on `Player[]`.
- **`src/store/gameStore.ts`** — a Zustand store. In local mode, `dispatch` runs the reducer directly. In online mode, `dispatch` sends the action over a WebSocket instead, and the store's `game` is replaced wholesale whenever the server pushes a new (per-viewer filtered) state.
- **`src/net/`** — the WebSocket client (`socket.ts`) and the wire protocol shared with the server (`protocol.ts`).
- **`server/`** — the online room server (plain Node + `ws`, no framework).
  - `index.ts` — room lifecycle (create/join by code), message handling, and the same bot-cascade timing the local client uses, run server-side per room.
  - `permissions.ts` — server-side authorization: a client can only submit actions for its own player id, night-role actions require actually holding that role, room-admin actions require being the host.
  - `filterView.ts` — the actual privacy boundary. Strips role/team/night-targets/seer-result/votes from the `GameState` before it's sent to each player, based on who they are and what's happened so far (eliminated players' roles are revealed the moment they're out, matching the elimination-reveal screen).
- **`src/components/screens/`** — one component per screen in the spec, plus `OnlineEntry`/`OnlineRoom` for the online flow. Screens that involve a secret role (Werewolf/Doctor/Seer action, Voting, Role Reveal) branch on whether they're running in local or online mode: locally they use `PassDeviceScreen` (an explicit "this is me" tap before showing anything private, since the device is shared); online they check the store's `myPlayerId` against the actual role holder and show a waiting screen if it's not this client's turn — no device-passing needed since each client already only ever *has* its own data.
- **`src/components/ui/`** — shared primitives: `Button`, `PlayerCard`, `RoleBadge`, `Timer`, `GameLogPanel`, `Scene` (night/day background), `PassDeviceScreen`, `WaitingScreen`.
- **`src/hooks/useSound.ts`** — a tiny WebAudio synth (no audio files) for phase/vote/win stings, with a global mute toggle.

## Data model

`GameState` (see `src/engine/types.ts`) holds `players: Player[]`, `currentPhase`, `roundNumber`, transient night/vote targets, `winner`, a public `log`, a `messages` chat feed, and `nightHistory`/`voteHistory` for the end-game summary. Each `Player` has `role`, `team`, `isAlive`, `isProtected`, vote state, and (for bots) a `personality` + per-target `suspicion` map used by the AI. In online mode, the server holds the one authoritative copy of this; what any given browser sees is always a filtered view (`server/filterView.ts`), never the raw thing.

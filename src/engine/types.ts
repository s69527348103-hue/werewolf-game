// Core domain types for the Werewolf game engine.
// This module has zero dependency on React or any UI framework.

export type RoleId = 'WEREWOLF' | 'DOCTOR' | 'SEER' | 'VILLAGER';

export type Team = 'WEREWOLF' | 'VILLAGER';

export type BotPersonalityId =
  | 'ANALYST'
  | 'DECEIVER'
  | 'SUSPICIOUS'
  | 'CONFIDENT'
  | 'QUIET';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  nameEn: string;
  team: Team;
  icon: string;
  color: string;
  summary: string;
  ability: string;
  goal: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role: RoleId | null;
  team: Team | null;
  isAlive: boolean;
  isProtected: boolean;
  voteTarget: string | null;
  hasVoted: boolean;
  isBot: boolean;
  personality: BotPersonalityId | null;
  hasSeenRole: boolean;
  suspicion: Record<string, number>;
}

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT'
  | 'WEREWOLF_ACTION'
  | 'DOCTOR_ACTION'
  | 'SEER_ACTION'
  | 'NIGHT_RESULT'
  | 'DAY'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_RESULT'
  | 'CHECK_WIN'
  | 'GAME_OVER';

export interface SeerCheck {
  round: number;
  targetId: string;
  targetName: string;
  isWerewolf: boolean;
}

export interface NightRecord {
  round: number;
  werewolfTargetId: string | null;
  doctorTargetId: string | null;
  seerTargetId: string | null;
  seerResult: boolean | null;
  victimId: string | null;
  doctorSaved: boolean;
}

export interface VoteRecord {
  round: number;
  votes: Record<string, string>;
  eliminatedId: string | null;
  wasTie: boolean;
  revoteCandidateIds: string[];
}

export type LogEntry = {
  id: string;
  round: number;
  phase: GamePhase;
  text: string;
  icon?: string;
  timestamp: number;
};

export interface ChatMessage {
  id: string;
  round: number;
  playerId: string;
  playerName: string;
  avatar: string;
  text: string;
  timestamp: number;
}

export interface GameState {
  gameId: string;
  roomName: string;
  players: Player[];
  currentPhase: GamePhase;
  roundNumber: number;
  nightTarget: string | null;
  doctorTarget: string | null;
  seerTarget: string | null;
  seerResult: SeerCheck | null;
  votes: Record<string, string>;
  winner: Team | null;
  gameStatus: 'lobby' | 'playing' | 'ended';
  log: LogEntry[];
  messages: ChatMessage[];
  nightHistory: NightRecord[];
  voteHistory: VoteRecord[];
  tiedCandidateIds: string[];
  isRevote: boolean;
  lastNightVictimId: string | null;
  lastNightSaved: boolean;
  humanPlayerIndex: number;
  activeRoleRevealIndex: number;
}

export const PHASE_ORDER: GamePhase[] = [
  'LOBBY',
  'ROLE_REVEAL',
  'NIGHT',
  'WEREWOLF_ACTION',
  'DOCTOR_ACTION',
  'SEER_ACTION',
  'NIGHT_RESULT',
  'DAY',
  'DISCUSSION',
  'VOTING',
  'VOTE_RESULT',
  'CHECK_WIN',
  'GAME_OVER',
];

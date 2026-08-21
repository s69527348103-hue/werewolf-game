import type { GamePhase, LogEntry } from './types';
import { randomId } from './utils';

/**
 * Public game log. Only ever push entries here that are safe for every
 * player to see — never a role, a werewolf/doctor/seer target, or a vote
 * before the reveal moment. Private info stays in the reducer's transient
 * fields (nightTarget, seerResult, etc.) and is filtered per-viewer in the UI.
 */
export function pushLog(
  log: LogEntry[],
  round: number,
  phase: GamePhase,
  text: string,
  icon?: string,
): LogEntry[] {
  const entry: LogEntry = {
    id: randomId('log'),
    round,
    phase,
    text,
    icon,
    timestamp: Date.now(),
  };
  return [...log, entry];
}

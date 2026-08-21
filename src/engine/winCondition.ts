import type { Player, Team } from './types';

/**
 * Villagers win once no werewolves remain. Werewolves win once their number
 * is >= the remaining villager-team players (they can no longer be outvoted).
 * Returns null while the game should continue.
 */
export function checkWinCondition(players: Player[]): Team | null {
  const alive = players.filter((p) => p.isAlive);
  const aliveWerewolves = alive.filter((p) => p.team === 'WEREWOLF').length;
  const aliveVillagers = alive.filter((p) => p.team === 'VILLAGER').length;

  if (aliveWerewolves === 0) return 'VILLAGER';
  if (aliveWerewolves >= aliveVillagers) return 'WEREWOLF';
  return null;
}

import type { Player } from '../engine/types';
import { PERSONALITIES } from './personalities';

function weightedPick(candidates: Player[], weightFn: (p: Player) => number): Player | undefined {
  if (candidates.length === 0) return undefined;
  const weights = candidates.map((c) => Math.max(0.01, weightFn(c)));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Werewolf bots agree on a target: prefer non-werewolves with lower suspicion of the pack (safer / high-value kills). */
export function aiChooseWerewolfTarget(self: Player, alivePlayers: Player[]): string | undefined {
  const candidates = alivePlayers.filter((p) => p.team !== 'WEREWOLF');
  const target = weightedPick(candidates, (p) => 1 + (self.suspicion[p.id] ?? 0) * 0.5);
  return target?.id;
}

/** Doctor bots lean toward protecting themselves or whoever looks most targeted. */
export function aiChooseDoctorTarget(self: Player, alivePlayers: Player[]): string | undefined {
  const candidates = alivePlayers;
  const target = weightedPick(candidates, (p) => {
    const base = p.id === self.id ? 1.4 : 1;
    return base + (self.suspicion[p.id] ?? 0) * 0.3;
  });
  return target?.id;
}

/** Seer bots prioritize checking players they have not checked and are moderately suspicious of. */
export function aiChooseSeerTarget(
  self: Player,
  alivePlayers: Player[],
  alreadyChecked: Set<string>,
): string | undefined {
  const candidates = alivePlayers.filter((p) => p.id !== self.id);
  const unchecked = candidates.filter((p) => !alreadyChecked.has(p.id));
  const pool = unchecked.length > 0 ? unchecked : candidates;
  const target = weightedPick(pool, (p) => 1 + (self.suspicion[p.id] ?? 0));
  return target?.id;
}

/** Voting bots pick the alive player with the highest personal suspicion, with some randomness by personality. */
export function aiChooseVoteTarget(self: Player, alivePlayers: Player[]): string | undefined {
  const candidates = alivePlayers.filter((p) => p.id !== self.id);
  const profile = self.personality ? PERSONALITIES[self.personality] : undefined;
  const noise = profile ? 1 - profile.swayability * 0.5 : 0.6;
  const target = weightedPick(candidates, (p) => {
    const suspicionScore = 1 + (self.suspicion[p.id] ?? 0);
    // Werewolf bots avoid voting for other werewolves.
    const packPenalty = self.team === 'WEREWOLF' && p.team === 'WEREWOLF' ? 0.05 : 1;
    const randomFactor = 1 + Math.random() * noise;
    return suspicionScore * packPenalty * randomFactor;
  });
  return target?.id;
}

const ACCUSE_LINES = [
  (name: string) => `ผมรู้สึกว่า ${name} มีพิรุธนะ พูดจาไม่ค่อยสอดคล้องกันเลย`,
  (name: string) => `ลองสังเกต ${name} ดูสิ เมื่อคืนเงียบผิดปกติ`,
  (name: string) => `ผมสงสัย ${name} มาตั้งแต่รอบที่แล้ว`,
  (name: string) => `${name} โหวตแปลกๆ นะ เหมือนพยายามเบี่ยงประเด็น`,
];

const DEFEND_LINES = [
  () => `ผมไม่ใช่หมาป่านะ ขอร้องอย่าโหวตผมเลย`,
  () => `ถ้าโหวตผมวันนี้ พรุ่งนี้จะเสียใจแน่นอน`,
  () => `ผมแค่วิเคราะห์จากพฤติกรรม ไม่ได้มีอะไรซ่อนเร้น`,
];

const NEUTRAL_LINES = [
  () => `เรามาดูกันดีกว่าว่าใครพูดขัดแย้งกันเองบ้าง`,
  () => `ผมยังไม่แน่ใจ ขอฟังคนอื่นก่อน`,
  () => `รอบนี้ต้องระวังให้ดี อย่าโหวตมั่ว`,
];

export function aiGenerateDiscussionLine(self: Player, targetName: string | null): string {
  const profile = self.personality ? PERSONALITIES[self.personality] : undefined;
  const roll = Math.random();
  if (targetName && roll < (profile?.accusationRate ?? 0.4)) {
    const line = ACCUSE_LINES[Math.floor(Math.random() * ACCUSE_LINES.length)];
    return line(targetName);
  }
  if (roll < 0.65) {
    const line = DEFEND_LINES[Math.floor(Math.random() * DEFEND_LINES.length)];
    return line();
  }
  const line = NEUTRAL_LINES[Math.floor(Math.random() * NEUTRAL_LINES.length)];
  return line();
}

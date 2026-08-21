import type { RoleDefinition, RoleId } from './types';

export const ROLES: Record<RoleId, RoleDefinition> = {
  WEREWOLF: {
    id: 'WEREWOLF',
    name: 'หมาป่า',
    nameEn: 'Werewolf',
    team: 'WEREWOLF',
    icon: '🐺',
    color: 'werewolf',
    summary: 'คุณคือหมาป่า',
    ability: 'ในตอนกลางคืน คุณและหมาป่าตัวอื่น (ถ้ามี) จะเลือกผู้เล่น 1 คนร่วมกันเพื่อกำจัด คุณรู้ว่าใครเป็นหมาป่าด้วยกัน',
    goal: 'ทำให้จำนวนหมาป่าเท่ากับหรือมากกว่าชาวบ้านที่เหลือ พร้อมปกปิดตัวตนในตอนกลางวัน',
  },
  DOCTOR: {
    id: 'DOCTOR',
    name: 'หมอ',
    nameEn: 'Doctor',
    team: 'VILLAGER',
    icon: '🩺',
    color: 'doctor',
    summary: 'คุณคือหมอ',
    ability: 'ในตอนกลางคืน คุณเลือกผู้เล่น 1 คนเพื่อปกป้อง หากผู้เล่นคนนั้นถูกหมาป่าโจมตี พวกเขาจะไม่ตาย คุณสามารถปกป้องตัวเองได้',
    goal: 'ช่วยชาวบ้านให้รอดจากการโจมตีของหมาป่าให้ได้มากที่สุด',
  },
  SEER: {
    id: 'SEER',
    name: 'ผู้หยั่งรู้',
    nameEn: 'Seer',
    team: 'VILLAGER',
    icon: '🔮',
    color: 'seer',
    summary: 'คุณคือผู้หยั่งรู้',
    ability: 'ในตอนกลางคืน คุณเลือกตรวจสอบผู้เล่น 1 คน ระบบจะบอกคุณว่าเป้าหมายเป็นหมาป่าหรือไม่ ใช้ข้อมูลนี้ชี้นำการอภิปรายอย่างระมัดระวัง',
    goal: 'ใช้พลังหยั่งรู้ช่วยชาวบ้านค้นหาหมาป่าโดยไม่เปิดเผยตัวเองเร็วเกินไป',
  },
  VILLAGER: {
    id: 'VILLAGER',
    name: 'ชาวบ้าน',
    nameEn: 'Villager',
    team: 'VILLAGER',
    icon: '👤',
    color: 'villagerRole',
    summary: 'คุณคือชาวบ้าน',
    ability: 'คุณไม่มีพลังพิเศษ ใช้การพูดคุย สังเกตพฤติกรรม และการโหวตเพื่อค้นหาหมาป่า',
    goal: 'ร่วมมือกับชาวบ้านคนอื่นค้นหาและกำจัดหมาป่าทั้งหมดให้ได้',
  },
};

// Role distribution table for 6-12 players. Kept as a lookup so it is easy
// to extend with more player counts or alternate role sets later.
const ROLE_DISTRIBUTION: Record<number, Record<RoleId, number>> = {
  6: { WEREWOLF: 1, DOCTOR: 1, SEER: 1, VILLAGER: 3 },
  7: { WEREWOLF: 2, DOCTOR: 1, SEER: 1, VILLAGER: 3 },
  8: { WEREWOLF: 2, DOCTOR: 1, SEER: 1, VILLAGER: 4 },
  9: { WEREWOLF: 2, DOCTOR: 1, SEER: 1, VILLAGER: 5 },
  10: { WEREWOLF: 2, DOCTOR: 1, SEER: 1, VILLAGER: 6 },
  11: { WEREWOLF: 3, DOCTOR: 1, SEER: 1, VILLAGER: 6 },
  12: { WEREWOLF: 3, DOCTOR: 1, SEER: 1, VILLAGER: 7 },
};

export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 12;

export function getRoleDistribution(playerCount: number): Record<RoleId, number> {
  const clamped = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, playerCount));
  return ROLE_DISTRIBUTION[clamped];
}

export function buildRoleDeck(playerCount: number): RoleId[] {
  const distribution = getRoleDistribution(playerCount);
  const deck: RoleId[] = [];
  (Object.keys(distribution) as RoleId[]).forEach((role) => {
    for (let i = 0; i < distribution[role]; i++) deck.push(role);
  });
  return deck;
}

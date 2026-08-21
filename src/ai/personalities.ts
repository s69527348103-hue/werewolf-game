import type { BotPersonalityId } from '../engine/types';

export interface PersonalityProfile {
  id: BotPersonalityId;
  label: string;
  icon: string;
  description: string;
  /** How aggressively this bot accuses others in discussion (0-1). */
  accusationRate: number;
  /** How likely this bot is to change its vote based on new suspicion (0-1). */
  swayability: number;
  /** Werewolf-only: how good this bot is at deflecting suspicion (0-1). */
  deceptionSkill: number;
}

export const PERSONALITIES: Record<BotPersonalityId, PersonalityProfile> = {
  ANALYST: {
    id: 'ANALYST',
    label: 'นักวิเคราะห์',
    icon: '🧠',
    description: 'ชั่งน้ำหนักหลักฐานอย่างเป็นระบบก่อนลงความเห็น',
    accusationRate: 0.4,
    swayability: 0.7,
    deceptionSkill: 0.5,
  },
  DECEIVER: {
    id: 'DECEIVER',
    label: 'นักหลอกลวง',
    icon: '😈',
    description: 'พูดจาน่าเชื่อถือ ชอบเบี่ยงเบนความสงสัยไปที่คนอื่น',
    accusationRate: 0.6,
    swayability: 0.3,
    deceptionSkill: 0.9,
  },
  SUSPICIOUS: {
    id: 'SUSPICIOUS',
    label: 'ผู้เล่นขี้สงสัย',
    icon: '🤔',
    description: 'ตั้งข้อสงสัยกับทุกคนง่าย เปลี่ยนใจบ่อย',
    accusationRate: 0.8,
    swayability: 0.8,
    deceptionSkill: 0.3,
  },
  CONFIDENT: {
    id: 'CONFIDENT',
    label: 'ผู้เล่นมั่นใจ',
    icon: '😎',
    description: 'ยืนยันความเห็นตัวเองหนักแน่น ไม่ค่อยเปลี่ยนใจ',
    accusationRate: 0.5,
    swayability: 0.15,
    deceptionSkill: 0.6,
  },
  QUIET: {
    id: 'QUIET',
    label: 'ผู้เล่นพูดน้อย',
    icon: '🤐',
    description: 'พูดน้อย สังเกตการณ์เงียบๆ แต่โหวตตามสัญชาตญาณ',
    accusationRate: 0.2,
    swayability: 0.5,
    deceptionSkill: 0.4,
  },
};

export const PERSONALITY_IDS: BotPersonalityId[] = [
  'ANALYST',
  'DECEIVER',
  'SUSPICIOUS',
  'CONFIDENT',
  'QUIET',
];

export function randomPersonality(): BotPersonalityId {
  return PERSONALITY_IDS[Math.floor(Math.random() * PERSONALITY_IDS.length)];
}

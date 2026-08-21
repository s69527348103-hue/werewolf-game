import { ROLES } from '../../engine/roles';
import type { RoleId } from '../../engine/types';

const ROLE_STYLES: Record<RoleId, string> = {
  WEREWOLF: 'bg-werewolf-dim/40 text-werewolf border-werewolf/60',
  DOCTOR: 'bg-doctor-dim/40 text-doctor border-doctor/60',
  SEER: 'bg-seer-dim/40 text-seer border-seer/60',
  VILLAGER: 'bg-villagerRole-dim/40 text-villagerRole border-villagerRole/60',
};

export function RoleBadge({ role, size = 'md' }: { role: RoleId; size?: 'sm' | 'md' | 'lg' }) {
  const def = ROLES[role];
  const sizeClasses = size === 'lg' ? 'text-lg px-4 py-2' : size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-display font-medium ${ROLE_STYLES[role]} ${sizeClasses}`}>
      <span>{def.icon}</span>
      <span>{def.name}</span>
    </span>
  );
}

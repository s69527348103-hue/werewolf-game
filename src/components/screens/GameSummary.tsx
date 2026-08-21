import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { RoleBadge } from '../ui/RoleBadge';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';
import type { RoleId } from '../../engine/types';

interface GameSummaryProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function GameSummary({ onPlayAgain, onMainMenu }: GameSummaryProps) {
  const game = useGameStore((s) => s.game);
  const villagersWon = game.winner === 'VILLAGER';
  const doctorSaves = game.nightHistory.filter((n) => n.doctorSaved).length;

  const seerChecks = game.nightHistory
    .filter((n) => n.seerTargetId)
    .map((n) => {
      const target = game.players.find((p) => p.id === n.seerTargetId);
      return { round: n.round, target, isWerewolf: n.seerResult };
    });

  const nightDeaths = game.nightHistory
    .filter((n) => n.victimId)
    .map((n) => ({ round: n.round, player: game.players.find((p) => p.id === n.victimId) }));

  const voteEliminations = game.voteHistory
    .filter((v) => v.eliminatedId)
    .map((v) => ({ round: v.round, player: game.players.find((p) => p.id === v.eliminatedId) }));

  return (
    <Scene variant="menu">
      <div className="min-h-dvh flex flex-col items-center px-4 py-10">
        <div className="text-5xl mb-2">{villagersWon ? '🎉' : '🐺'}</div>
        <h1 className="font-display text-2xl font-bold mb-1">สรุปเกม</h1>
        <p className={`mb-8 font-display font-semibold ${villagersWon ? 'text-doctor' : 'text-werewolf'}`}>
          {villagersWon ? 'ชาวบ้านชนะ' : 'หมาป่าชนะ'} · จบใน {game.roundNumber} รอบ
        </p>

        <div className="w-full max-w-lg grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 text-center">
          <StatCard label="จำนวนผู้เล่น" value={game.players.length} />
          <StatCard label="จำนวนรอบ" value={game.roundNumber} />
          <StatCard label="หมอช่วยสำเร็จ" value={doctorSaves} />
          <StatCard label="ตรวจโดยผู้หยั่งรู้" value={seerChecks.length} />
        </div>

        <Section title="👥 บทบาทของผู้เล่นทุกคน">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {game.players.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-night-800/70 border border-night-600 rounded-xl px-3 py-2">
                <span className="text-xl">{p.avatar}</span>
                <span className={`flex-1 text-sm ${p.isAlive ? '' : 'line-through text-parchment/40'}`}>{p.name}</span>
                {p.role && <RoleBadge role={p.role as RoleId} size="sm" />}
              </div>
            ))}
          </div>
        </Section>

        <Section title="💀 ผู้เสียชีวิตแต่ละรอบ">
          {nightDeaths.length === 0 && voteEliminations.length === 0 && (
            <p className="text-sm text-parchment/50">ไม่มีใครเสียชีวิตตลอดเกม</p>
          )}
          <ul className="text-sm space-y-1">
            {nightDeaths.map((d, i) => (
              <li key={`n${i}`}>
                🌙 คืนที่ {d.round}: {d.player?.avatar} {d.player?.name ?? '—'}
              </li>
            ))}
            {voteEliminations.map((d, i) => (
              <li key={`v${i}`}>
                ⚖️ วันที่ {d.round}: {d.player?.avatar} {d.player?.name ?? '—'}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="🔮 ผลการตรวจของผู้หยั่งรู้">
          {seerChecks.length === 0 && <p className="text-sm text-parchment/50">ไม่มีการตรวจสอบ</p>}
          <ul className="text-sm space-y-1">
            {seerChecks.map((c, i) => (
              <li key={i}>
                คืนที่ {c.round}: {c.target?.avatar} {c.target?.name} — {c.isWerewolf ? '🐺 เป็นหมาป่า' : '✅ ไม่ใช่หมาป่า'}
              </li>
            ))}
          </ul>
        </Section>

        <div className="flex gap-3 w-full max-w-sm mt-4">
          <Button variant="secondary" fullWidth onClick={onMainMenu}>
            กลับหน้าหลัก
          </Button>
          <Button fullWidth onClick={onPlayAgain}>
            เล่นอีกครั้ง
          </Button>
        </div>
        <p className="text-[11px] text-parchment/25 mt-6">สร้างโดย storyman</p>
      </div>
    </Scene>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-night-800/70 border border-night-600 rounded-xl p-3">
      <p className="font-display text-xl font-bold text-gold">{value}</p>
      <p className="text-[11px] text-parchment/60">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-lg mb-6">
      <h2 className="font-display font-semibold mb-2 text-parchment/80">{title}</h2>
      {children}
    </div>
  );
}

import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { ROLES } from '../../engine/roles';

const STEPS = [
  { icon: '🌙', title: 'กลางคืน', body: 'ผู้เล่นที่มีบทบาทพิเศษ (หมาป่า หมอ ผู้หยั่งรู้) ใช้พลังของตัวเองทีละคนโดยไม่ให้คนอื่นเห็น' },
  { icon: '☀️', title: 'กลางวัน', body: 'ทุกคนพูดคุย วิเคราะห์ กล่าวหา และป้องกันตัวเอง ก่อนร่วมกันโหวตกำจัดผู้ต้องสงสัย' },
  { icon: '🎯', title: 'เป้าหมาย', body: 'ชาวบ้านต้องหาหมาป่าให้เจอก่อนถูกครองหมู่บ้าน ส่วนหมาป่าต้องแฝงตัวจนมีจำนวนเท่าหรือมากกว่าชาวบ้าน' },
];

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <Scene variant="menu">
      <div className="min-h-dvh flex flex-col items-center px-6 py-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">📖 วิธีเล่น</h1>
        <p className="text-parchment/60 mb-8 text-sm text-center">เกมจับผิดหาหมาป่าในหมู่บ้าน เข้าใจง่าย เล่นสนุก</p>

        <div className="w-full max-w-md space-y-3 mb-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-3 items-start bg-night-800/70 border border-night-600 rounded-xl p-4"
            >
              <span className="text-2xl">{step.icon}</span>
              <div>
                <p className="font-display font-semibold">{step.title}</p>
                <p className="text-sm text-parchment/70">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <h2 className="font-display font-semibold mb-3 text-parchment/80">บทบาททั้งหมด</h2>
        <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {Object.values(ROLES).map((role) => (
            <div key={role.id} className="bg-night-800/70 border border-night-600 rounded-xl p-4">
              <p className="font-display font-semibold mb-1">
                {role.icon} {role.name} <span className="text-xs text-parchment/40">({role.team === 'WEREWOLF' ? 'ฝ่ายหมาป่า' : 'ฝ่ายชาวบ้าน'})</span>
              </p>
              <p className="text-xs text-parchment/60">{role.ability}</p>
            </div>
          ))}
        </div>

        <Button variant="secondary" onClick={onBack}>
          ← กลับหน้าหลัก
        </Button>
      </div>
    </Scene>
  );
}

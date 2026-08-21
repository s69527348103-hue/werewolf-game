import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';

interface MainMenuProps {
  onNewGame: () => void;
  onPlayOnline: () => void;
  onHowToPlay: () => void;
}

export function MainMenu({ onNewGame, onPlayOnline, onHowToPlay }: MainMenuProps) {
  return (
    <Scene variant="menu">
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-7xl mb-4 animate-flicker"
        >
          🐺🌕
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-2"
        >
          WEREWOLF
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-parchment/60 mb-12 max-w-sm"
        >
          หมู่บ้านแห่งความลับ — ค้นหาหมาป่าที่แฝงตัวอยู่ในหมู่บ้าน ก่อนที่พวกมันจะครองคืนเงียบ
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Button onClick={onNewGame}>🎮 สร้างเกมใหม่ (เครื่องเดียว)</Button>
          <Button variant="secondary" onClick={onPlayOnline}>
            🌐 เล่นออนไลน์
          </Button>
          <Button variant="ghost" onClick={onHowToPlay}>
            📖 วิธีเล่น
          </Button>
        </motion.div>
        <p className="text-xs text-parchment/30 mt-14">รองรับผู้เล่น 6–12 คน · เล่นแบบส่งต่ออุปกรณ์เครื่องเดียว</p>
        <p className="text-[11px] text-parchment/25 mt-2">สร้างโดย storyman</p>
      </div>
    </Scene>
  );
}

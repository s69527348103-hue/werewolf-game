import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';

export function NightResult() {
  const dispatch = useGameStore((s) => s.dispatch);

  return (
    <Scene variant="night">
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
          className="text-7xl mb-6"
        >
          🌫️
        </motion.div>
        <h1 className="font-display text-2xl font-bold mb-2">คืนนี้ผ่านไปแล้ว...</h1>
        <p className="text-parchment/60 mb-10 max-w-xs">ระบบกำลังตรวจสอบผลลัพธ์ของคืนนี้</p>
        <Button onClick={() => dispatch({ type: 'ACK_NIGHT_RESULT' })}>ดูผลลัพธ์ตอนเช้า</Button>
      </div>
    </Scene>
  );
}

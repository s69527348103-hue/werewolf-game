import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '../../engine/types';

export function GameLogPanel({ log }: { log: LogEntry[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="mb-3 w-72 max-h-80 overflow-y-auto rounded-xl border border-night-600 bg-night-900/95 p-3 shadow-xl backdrop-blur"
          >
            <p className="text-xs font-display font-semibold text-parchment/60 mb-2">📜 บันทึกเหตุการณ์</p>
            <ul className="space-y-1.5">
              {log
                .slice()
                .reverse()
                .map((entry) => (
                  <li key={entry.id} className="text-xs text-parchment/80 flex gap-1.5">
                    <span>{entry.icon}</span>
                    <span>{entry.text}</span>
                  </li>
                ))}
              {log.length === 0 && <li className="text-xs text-parchment/40">ยังไม่มีเหตุการณ์</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-night-800 border border-night-600 w-11 h-11 flex items-center justify-center shadow-lg hover:border-gold/60"
        aria-label="Game log"
      >
        📜
      </button>
    </div>
  );
}

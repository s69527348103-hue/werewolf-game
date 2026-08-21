import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Scene } from '../ui/Scene';
import { useGameStore } from '../../store/gameStore';

const DEFAULT_SERVER_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8787';

interface OnlineEntryProps {
  onBack: () => void;
  onJoined: () => void;
}

export function OnlineEntry({ onBack, onJoined }: OnlineEntryProps) {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);

  const createOnlineRoom = useGameStore((s) => s.createOnlineRoom);
  const joinOnlineRoom = useGameStore((s) => s.joinOnlineRoom);
  const connectionStatus = useGameStore((s) => s.connectionStatus);
  const connectionError = useGameStore((s) => s.connectionError);

  async function handleSubmit() {
    if (!playerName.trim()) return;
    if (tab === 'join' && !roomCode.trim()) return;
    setBusy(true);
    try {
      if (tab === 'create') {
        await createOnlineRoom(serverUrl.trim(), roomName.trim() || 'หมู่บ้านออนไลน์', playerName.trim());
      } else {
        await joinOnlineRoom(serverUrl.trim(), roomCode.trim(), playerName.trim());
      }
      onJoined();
    } catch {
      // connectionError is already surfaced via the store
    } finally {
      setBusy(false);
    }
  }

  return (
    <Scene variant="menu">
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold mb-1 text-center">🌐 เล่นออนไลน์</h1>
          <p className="text-xs text-parchment/50 mb-6 text-center">แต่ละคนเข้าจากอุปกรณ์ของตัวเอง เห็นบทบาทแยกกันจริง</p>

          <div className="flex rounded-xl bg-night-800 border border-night-600 p-1 mb-5">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === 'create' ? 'bg-gold text-night-950' : 'text-parchment/60'}`}
            >
              สร้างห้อง
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === 'join' ? 'bg-gold text-night-950' : 'text-parchment/60'}`}
            >
              เข้าร่วมห้อง
            </button>
          </div>

          <label className="block text-sm text-parchment/70 mb-1.5">ชื่อของคุณ</label>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="ชื่อที่จะให้คนอื่นเห็น"
            maxLength={16}
            className="w-full rounded-xl bg-night-800 border border-night-600 px-4 py-3 mb-4 outline-none focus:border-gold/70 placeholder:text-parchment/30"
          />

          {tab === 'create' ? (
            <>
              <label className="block text-sm text-parchment/70 mb-1.5">ชื่อห้อง</label>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="เช่น หมู่บ้านเงามืด"
                maxLength={30}
                className="w-full rounded-xl bg-night-800 border border-night-600 px-4 py-3 mb-4 outline-none focus:border-gold/70 placeholder:text-parchment/30"
              />
            </>
          ) : (
            <>
              <label className="block text-sm text-parchment/70 mb-1.5">รหัสห้อง</label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="เช่น 9KAYJ"
                maxLength={6}
                className="w-full rounded-xl bg-night-800 border border-night-600 px-4 py-3 mb-4 outline-none focus:border-gold/70 placeholder:text-parchment/30 tracking-widest font-display"
              />
            </>
          )}

          <details className="mb-4">
            <summary className="text-xs text-parchment/40 cursor-pointer select-none">ตั้งค่าเซิร์ฟเวอร์ (ขั้นสูง)</summary>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="wss://your-server.example.com"
              className="w-full mt-2 rounded-xl bg-night-800 border border-night-600 px-3 py-2 text-xs outline-none focus:border-gold/70 placeholder:text-parchment/30"
            />
          </details>

          {connectionStatus === 'error' && connectionError && (
            <p className="text-xs text-werewolf mb-4 text-center">{connectionError}</p>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack} disabled={busy}>
              ← ย้อนกลับ
            </Button>
            <Button
              fullWidth
              disabled={busy || !playerName.trim() || (tab === 'join' && !roomCode.trim())}
              onClick={handleSubmit}
            >
              {busy ? 'กำลังเชื่อมต่อ...' : tab === 'create' ? 'สร้างห้อง' : 'เข้าร่วม'}
            </Button>
          </div>
        </motion.div>
      </div>
    </Scene>
  );
}

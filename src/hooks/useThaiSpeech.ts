import { useCallback, useEffect, useRef, useState } from 'react';

function pickThaiVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang?.toLowerCase() === 'th-th') ??
    voices.find((v) => v.lang?.toLowerCase().startsWith('th')) ??
    null
  );
}

export function useThaiSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [thaiVoiceAvailable, setThaiVoiceAvailable] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = pickThaiVoice(voices);
      voiceRef.current = thaiVoice;
      setThaiVoiceAvailable(!!thaiVoice);
    }
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabled || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech is best-effort; never let it break the quiz.
      }
    },
    [supported, enabled],
  );

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => {
      if (prev) stop();
      return !prev;
    });
  }, [stop]);

  return { supported, enabled, toggleEnabled, speaking, speak, stop, thaiVoiceAvailable };
}

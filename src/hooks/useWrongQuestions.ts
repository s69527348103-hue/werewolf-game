import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'driving-quiz-wrong-ids-v1';

function loadStoredIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

// Tracks question ids the learner has answered incorrectly, persisted in
// localStorage, so a "practice only what you got wrong" mode can be built
// across sessions. Answering a question correctly clears it from the list.
export function useWrongQuestions() {
  const [wrongIds, setWrongIds] = useState<number[]>(() => loadStoredIds());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wrongIds));
    } catch {
      // Persistence is best-effort; never let it break the quiz.
    }
  }, [wrongIds]);

  const markWrong = useCallback((id: number) => {
    setWrongIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const markCorrect = useCallback((id: number) => {
    setWrongIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev));
  }, []);

  const clear = useCallback(() => setWrongIds([]), []);

  return { wrongIds, markWrong, markCorrect, clear };
}

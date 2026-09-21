import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Scene } from '../ui/Scene';
import { Button } from '../ui/Button';
import { useSound } from '../../hooks/useSound';
import { useThaiSpeech } from '../../hooks/useThaiSpeech';
import { CHOICE_LABELS, drivingQuizQuestions, shuffleArray, type QuizQuestion } from '../../data/drivingQuiz';

type Phase = 'start' | 'quiz' | 'result';

const SIZE_OPTIONS = [10, 20, 40, 80] as const;

interface Answer {
  questionId: number;
  selectedIndex: number;
}

function scoreMessage(pct: number): { emoji: string; text: string } {
  if (pct >= 90) return { emoji: '🏆', text: 'ยอดเยี่ยมมาก! พร้อมไปสอบจริงแล้ว' };
  if (pct >= 75) return { emoji: '🎉', text: 'ดีมาก ใกล้พร้อมแล้ว ทบทวนอีกนิดเดียว' };
  if (pct >= 50) return { emoji: '💪', text: 'พอใช้ได้ ลองทบทวนข้อที่ผิดอีกรอบนะ' };
  return { emoji: '📖', text: 'ควรทบทวนเนื้อหาเพิ่มเติมก่อนไปสอบจริง' };
}

export function DrivingQuiz() {
  const [phase, setPhase] = useState<Phase>('start');
  const [quizSize, setQuizSize] = useState<number>(20);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const resultSpokenRef = useRef(false);

  const { play } = useSound();
  const speech = useThaiSpeech();

  useEffect(() => {
    document.title = 'ข้อสอบใบขับขี่รถยนต์ พร้อมเฉลย | Werewolf';
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = questions[currentIndex];
  const total = questions.length;
  const correctCount = useMemo(
    () => answers.filter((a) => a.selectedIndex === questions.find((q) => q.id === a.questionId)?.correctIndex).length,
    [answers, questions],
  );

  function readQuestion(q: QuizQuestion, index: number) {
    const text = `ข้อที่ ${index + 1}. ${q.question} ตัวเลือก ก. ${q.choices[0]} ข. ${q.choices[1]} ค. ${q.choices[2]} ง. ${q.choices[3]}`;
    speech.speak(text);
  }

  useEffect(() => {
    if (phase === 'quiz' && current) {
      readQuestion(current, currentIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex]);

  useEffect(() => {
    if (phase === 'result' && !resultSpokenRef.current && total > 0) {
      resultSpokenRef.current = true;
      const pct = Math.round((correctCount / total) * 100);
      const { text } = scoreMessage(pct);
      speech.speak(`ทำข้อสอบเสร็จแล้ว คุณได้ ${correctCount} จาก ${total} ข้อ คิดเป็นร้อยละ ${pct} ${text}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function startQuiz() {
    const pool = shuffleOn ? shuffleArray(drivingQuizQuestions) : drivingQuizQuestions;
    const picked = pool.slice(0, quizSize);
    setQuestions(picked);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setShowReview(false);
    resultSpokenRef.current = false;
    play('phaseDay');
    setPhase('quiz');
  }

  function selectChoice(i: number) {
    if (selectedIndex !== null || !current) return;
    setSelectedIndex(i);
    setAnswers((prev) => [...prev, { questionId: current.id, selectedIndex: i }]);
    const isCorrect = i === current.correctIndex;
    play(isCorrect ? 'reveal' : 'eliminate');
    const correctLabel = CHOICE_LABELS[current.correctIndex];
    speech.speak(isCorrect ? 'ถูกต้องครับ' : `ไม่ถูกต้อง เฉลยคือข้อ ${correctLabel}. ${current.choices[current.correctIndex]}`);
  }

  function nextQuestion() {
    if (currentIndex + 1 >= total) {
      play('winVillager');
      setPhase('result');
      return;
    }
    setSelectedIndex(null);
    setCurrentIndex((i) => i + 1);
  }

  function restart() {
    speech.stop();
    setPhase('start');
    setShowReview(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase !== 'quiz' || selectedIndex !== null) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx >= 0) selectChoice(idx);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedIndex, current]);

  return (
    <Scene variant="night" showSoundToggle={false}>
      <div className="min-h-dvh flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl flex items-center justify-between mb-6">
          <a href="/" className="text-xs text-parchment/50 hover:text-parchment/80 transition-colors">
            ← กลับหน้าหลัก
          </a>
          <div className="flex items-center gap-2">
            {speech.supported && (
              <button
                onClick={speech.toggleEnabled}
                className="text-xs rounded-full border border-white/15 px-3 py-1.5 text-parchment/70 hover:bg-white/5 transition-colors"
                title={speech.enabled ? 'ปิดเสียงพากย์ภาษาไทย' : 'เปิดเสียงพากย์ภาษาไทย'}
              >
                {speech.enabled ? '🔊 เสียงเปิด' : '🔇 เสียงปิด'}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'start' && (
            <StartScreen
              key="start"
              quizSize={quizSize}
              setQuizSize={setQuizSize}
              shuffleOn={shuffleOn}
              setShuffleOn={setShuffleOn}
              speechSupported={speech.supported}
              onStart={startQuiz}
            />
          )}

          {phase === 'quiz' && current && (
            <QuizScreen
              key={`q-${currentIndex}`}
              index={currentIndex}
              total={total}
              question={current}
              selectedIndex={selectedIndex}
              correctCount={correctCount}
              onSelect={selectChoice}
              onNext={nextQuestion}
              onReplay={() => readQuestion(current, currentIndex)}
              onExit={() => setConfirmExit(true)}
              speaking={speech.speaking}
            />
          )}

          {phase === 'result' && (
            <ResultScreen
              key="result"
              questions={questions}
              answers={answers}
              correctCount={correctCount}
              total={total}
              showReview={showReview}
              setShowReview={setShowReview}
              onRestart={restart}
            />
          )}
        </AnimatePresence>

        {confirmExit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-night-800 border border-night-500 rounded-2xl p-6 max-w-sm w-full text-center"
            >
              <p className="mb-5 text-parchment/90">ต้องการออกจากข้อสอบตอนนี้หรือไม่? ความคืบหน้าจะหายไป</p>
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setConfirmExit(false)}>
                  ทำต่อ
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    setConfirmExit(false);
                    restart();
                  }}
                >
                  ออก
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Scene>
  );
}

function StartScreen({
  quizSize,
  setQuizSize,
  shuffleOn,
  setShuffleOn,
  speechSupported,
  onStart,
}: {
  quizSize: number;
  setQuizSize: (n: number) => void;
  shuffleOn: boolean;
  setShuffleOn: (b: boolean) => void;
  speechSupported: boolean;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl text-center"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 160 }}
        className="text-6xl mb-4"
      >
        🚗📝
      </motion.div>
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-2">ข้อสอบใบขับขี่รถยนต์</h1>
      <p className="text-parchment/60 mb-1">หมวดกฎหมายว่าด้วยรถยนต์ · 80 ข้อ พร้อมเฉลยและคะแนน</p>
      <p className="text-parchment/40 text-sm mb-8">มีเสียงพากย์ภาษาไทยอ่านคำถามและเฉลยให้ฟังทุกข้อ</p>

      <div className="bg-night-800/70 border border-night-600 rounded-2xl p-5 sm:p-6 text-left mb-6">
        <p className="font-display font-semibold mb-3 text-parchment/90">จำนวนข้อที่ต้องการทำ</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {SIZE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setQuizSize(n)}
              className={`rounded-xl py-2.5 text-sm font-display font-semibold border transition-all ${
                quizSize === n
                  ? 'bg-gradient-to-b from-gold to-day-700 text-night-950 border-transparent shadow-[0_0_16px_rgba(212,175,55,0.35)]'
                  : 'bg-night-700 border-night-500 text-parchment/80 hover:bg-night-600'
              }`}
            >
              {n === 80 ? 'ทั้งหมด' : n} ข้อ
            </button>
          ))}
        </div>

        <label className="flex items-center justify-between cursor-pointer select-none">
          <span className="text-parchment/80 text-sm">🔀 สุ่มลำดับข้อสอบ</span>
          <span
            onClick={() => setShuffleOn(!shuffleOn)}
            className={`relative w-11 h-6 rounded-full transition-colors ${shuffleOn ? 'bg-gold' : 'bg-night-600'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                shuffleOn ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </span>
        </label>

        {!speechSupported && (
          <p className="text-xs text-parchment/40 mt-4">
            ⚠️ เบราว์เซอร์นี้ไม่รองรับเสียงพากย์ (Web Speech API) ระบบจะแสดงคำถามและเฉลยเป็นข้อความแทน
          </p>
        )}
      </div>

      <Button onClick={onStart} className="w-full max-w-xs mx-auto text-lg">
        ▶ เริ่มทำข้อสอบ
      </Button>
    </motion.div>
  );
}

function QuizScreen({
  index,
  total,
  question,
  selectedIndex,
  correctCount,
  onSelect,
  onNext,
  onReplay,
  onExit,
  speaking,
}: {
  index: number;
  total: number;
  question: QuizQuestion;
  selectedIndex: number | null;
  correctCount: number;
  onSelect: (i: number) => void;
  onNext: () => void;
  onReplay: () => void;
  onExit: () => void;
  speaking: boolean;
}) {
  const answered = selectedIndex !== null;
  const isCorrect = answered && selectedIndex === question.correctIndex;
  const progress = ((index + 1) / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl"
    >
      <div className="flex items-center justify-between mb-2 text-sm text-parchment/60">
        <span>
          ข้อที่ {index + 1} / {total}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-gold font-semibold">คะแนน {correctCount}</span>
          <button onClick={onExit} className="text-parchment/40 hover:text-parchment/70 transition-colors">
            ✕ ออก
          </button>
        </div>
      </div>

      <div className="w-full h-2 bg-night-700 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-gradient-to-r from-gold to-day-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="bg-night-800/70 border border-night-600 rounded-2xl p-5 sm:p-7 mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-display text-lg sm:text-xl font-semibold leading-relaxed flex-1">{question.question}</h2>
          <button
            onClick={onReplay}
            className={`shrink-0 w-10 h-10 rounded-full border border-white/15 flex items-center justify-center transition-colors ${
              speaking ? 'bg-gold/20 text-gold animate-pulse-slow' : 'hover:bg-white/5 text-parchment/70'
            }`}
            title="ฟังคำถามอีกครั้ง"
          >
            🔊
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {question.choices.map((choice, i) => {
            const label = CHOICE_LABELS[i];
            const isSelected = selectedIndex === i;
            const isTheCorrectOne = i === question.correctIndex;

            let stateClass = 'bg-night-700 border-night-500 hover:bg-night-600';
            if (answered) {
              if (isTheCorrectOne) {
                stateClass = 'bg-doctor/20 border-doctor text-parchment';
              } else if (isSelected) {
                stateClass = 'bg-werewolf/20 border-werewolf text-parchment';
              } else {
                stateClass = 'bg-night-700/50 border-night-600 text-parchment/40';
              }
            }

            return (
              <motion.button
                key={i}
                onClick={() => onSelect(i)}
                disabled={answered}
                animate={answered && isSelected && !isCorrect ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition-colors disabled:cursor-default ${stateClass}`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                    answered && isTheCorrectOne
                      ? 'bg-doctor text-night-950'
                      : answered && isSelected
                        ? 'bg-werewolf text-night-950'
                        : 'bg-night-600 text-parchment/80'
                  }`}
                >
                  {label}
                </span>
                <span className="text-sm sm:text-base">{choice}</span>
                {answered && isTheCorrectOne && <span className="ml-auto text-doctor">✓</span>}
                {answered && isSelected && !isTheCorrectOne && <span className="ml-auto text-werewolf">✕</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <p className={`font-display font-semibold ${isCorrect ? 'text-doctor' : 'text-werewolf'}`}>
              {isCorrect ? '✅ ถูกต้อง!' : `❌ ไม่ถูกต้อง — เฉลยคือข้อ ${CHOICE_LABELS[question.correctIndex]}`}
            </p>
            <Button onClick={onNext} className="w-full max-w-xs">
              {index + 1 >= total ? '🏁 ดูผลคะแนน' : 'ข้อถัดไป →'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ResultScreen({
  questions,
  answers,
  correctCount,
  total,
  showReview,
  setShowReview,
  onRestart,
}: {
  questions: QuizQuestion[];
  answers: Answer[];
  correctCount: number;
  total: number;
  showReview: boolean;
  setShowReview: (b: boolean) => void;
  onRestart: () => void;
}) {
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const { emoji, text } = scoreMessage(pct);
  const answerMap = useMemo(() => new Map(answers.map((a) => [a.questionId, a.selectedIndex])), [answers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full max-w-2xl text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
        className="text-7xl mb-3"
      >
        {emoji}
      </motion.div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold mb-1">ทำข้อสอบเสร็จแล้ว!</h1>
      <p className="text-parchment/60 mb-6">{text}</p>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-night-800/70 border border-night-600 rounded-2xl p-6 sm:p-8 mb-6"
      >
        <div className="font-display text-5xl sm:text-6xl font-extrabold text-gold mb-1">{pct}%</div>
        <p className="text-parchment/70">
          ตอบถูก {correctCount} จาก {total} ข้อ
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button variant="secondary" fullWidth onClick={() => setShowReview(!showReview)}>
          {showReview ? '▲ ซ่อนเฉลย' : '📋 ดูเฉลยทั้งหมด'}
        </Button>
        <Button fullWidth onClick={onRestart}>
          🔁 ทำข้อสอบใหม่
        </Button>
      </div>

      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 text-left mb-6">
              {questions.map((q, i) => {
                const userIdx = answerMap.get(q.id);
                const correct = userIdx === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-4 ${correct ? 'border-doctor/40 bg-doctor/10' : 'border-werewolf/40 bg-werewolf/10'}`}
                  >
                    <p className="text-sm text-parchment/50 mb-1">ข้อ {i + 1}</p>
                    <p className="font-display font-medium mb-2">{q.question}</p>
                    <p className="text-sm text-doctor">
                      ✓ เฉลย: {CHOICE_LABELS[q.correctIndex]}. {q.choices[q.correctIndex]}
                    </p>
                    {!correct && userIdx !== undefined && (
                      <p className="text-sm text-werewolf mt-1">
                        ✕ คุณตอบ: {CHOICE_LABELS[userIdx]}. {q.choices[userIdx]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

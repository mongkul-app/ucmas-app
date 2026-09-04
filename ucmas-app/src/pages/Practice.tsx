import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { X, Pause, Play } from 'lucide-react';
import { LEVELS, getLevelConfig } from '../data/levelConfig';
import { useExerciseSession } from '../hooks/useExerciseSession';
import { getSettings } from '../utils/storage';
import QuestionDisplay from '../components/QuestionDisplay';
import NumericKeypad from '../components/NumericKeypad';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import type { ExerciseMode } from '../types/exercise';

interface PracticeProps {
  mode: ExerciseMode;
}

const MODE_LABELS: Record<ExerciseMode, string> = {
  practice: 'Practice',
  'timed-test': 'Timed Test',
  'speed-training': 'Speed Training',
  'random-challenge': 'Random Challenge',
  'mental-arithmetic': 'Mental Arithmetic',
  worksheet: 'Worksheet',
};

export default function Practice({ mode }: PracticeProps) {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const isValidLevel = !!levelId && LEVELS.some((l) => l.id === levelId);
  const safeLevelId = isValidLevel ? (levelId as string) : LEVELS[0].id;

  const config = getLevelConfig(safeLevelId);

  let questionCount = config.questionCount;
  let timeLimitSec: number | null = config.defaultTimeLimitSec;
  let presentation: 'static' | 'sequential' = 'sequential';

  if (mode === 'practice') {
    timeLimitSec = null;
  } else if (mode === 'speed-training') {
    questionCount = Math.max(5, Math.round(config.questionCount * 0.6));
    timeLimitSec = Math.max(60, Math.round(config.defaultTimeLimitSec * 0.5));
  } else if (mode === 'random-challenge') {
    timeLimitSec = config.defaultTimeLimitSec;
  } else if (mode === 'mental-arithmetic') {
    questionCount = Math.max(5, Math.round(config.questionCount * 0.5));
    timeLimitSec = null;
  }

  const session = useExerciseSession({ config, mode, questionCount, timeLimitSec });
  const speedMultiplier = getSettings().presentationSpeedMultiplier;
  const [answerStr, setAnswerStr] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [revealAnswer, setRevealAnswer] = useState<number | null>(null);
  const [sequenceReady, setSequenceReady] = useState(false);

  useEffect(() => {
    setAnswerStr('');
    setSequenceReady(false);
    setFeedback(null);
    setRevealAnswer(null);
  }, [session.currentIndex]);

  useEffect(() => {
    if (session.phase === 'finished' && session.result) {
      navigate('/results', { state: { result: session.result, levelId: safeLevelId, mode } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase]);

  const doSubmit = useCallback(() => {
    if (!sequenceReady || revealAnswer !== null) return;
    const q = session.currentQuestion;
    if (!q) return;
    const value = answerStr === '' || answerStr === '-' ? null : parseInt(answerStr, 10);
    const correct = value !== null && value === q.answer;
    setFeedback(correct ? 'correct' : 'wrong');
    setRevealAnswer(q.answer);
    setTimeout(() => {
      session.submitAnswer(value);
    }, 1200);
  }, [answerStr, session, sequenceReady, revealAnswer]);

  const handleDigit = (d: string) => setAnswerStr((s) => (s.length > 8 ? s : s + d));
  const handleBackspace = () => setAnswerStr((s) => s.slice(0, -1));
  const handleToggleSign = () =>
    setAnswerStr((s) => (s.startsWith('-') ? s.slice(1) : s.length ? `-${s}` : '-'));

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '-') handleToggleSign();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Enter') doSubmit();
      else if (e.key === 'Escape' && mode === 'practice') session.togglePause();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doSubmit, mode, session]);

  if (!isValidLevel) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!session.currentQuestion) return null;

  const canPause = mode === 'practice';

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">{config.name}</p>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">{MODE_LABELS[mode]}</h1>
        </div>
        <div className="flex items-center gap-2">
          {session.remainingSec !== null ? (
            <Timer
              seconds={session.remainingSec}
              isCountdown
              isPaused={session.isPaused}
              onTogglePause={canPause ? session.togglePause : undefined}
            />
          ) : (
            <Timer seconds={session.elapsedSec} isPaused={session.isPaused} onTogglePause={canPause ? session.togglePause : undefined} />
          )}
          <button onClick={() => navigate(`/level/${safeLevelId}`)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700" aria-label="Exit">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
        <span>Question {session.currentIndex + 1} / {session.totalQuestions}</span>
        <span>Score: {session.attempts.filter((a) => a.correct).length * 10}</span>
      </div>
      <ProgressBar percent={(session.currentIndex / session.totalQuestions) * 100} />

      {session.isPaused ? (
        <div className="card p-10 text-center mt-6">
          <Pause size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-200">Paused</p>
          <button onClick={session.togglePause} className="btn-primary mt-4">
            <Play size={16} />
            Resume
          </button>
        </div>
      ) : (
        <>
          <div
            className={`card p-8 mt-6 flex flex-col items-center justify-center min-h-[260px] transition-colors ${
              feedback === 'correct' ? 'ring-2 ring-emerald-400' : feedback === 'wrong' ? 'ring-2 ring-rose-400' : ''
            }`}
          >
            <QuestionDisplay
              key={session.currentQuestion.id}
              question={session.currentQuestion}
              mode={presentation}
              presentationSpeedMs={config.presentationSpeedMs * speedMultiplier}
              onSequenceComplete={() => setSequenceReady(true)}
            />
            {!sequenceReady && revealAnswer === null && (
              <p className="text-xs text-slate-400 mt-3">Memorize as each number appears…</p>
            )}
            {revealAnswer !== null && (
              <p className={`text-base font-bold mt-4 ${feedback === 'correct' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {feedback === 'correct' ? '✓ Correct!' : `✗ Correct answer: ${revealAnswer}`}
              </p>
            )}
          </div>

          <div className="mt-6">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center min-w-[8rem] h-14 px-4 rounded-xl border-2 border-slate-200 dark:border-navy-700 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {answerStr || <span className="text-slate-300">?</span>}
              </div>
            </div>
            <NumericKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              onToggleSign={handleToggleSign}
              onSubmit={doSubmit}
              disabled={!sequenceReady || revealAnswer !== null}
            />
          </div>
        </>
      )}
    </div>
  );
}

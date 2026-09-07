import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { X, Eye, ArrowRight, Flag } from 'lucide-react';
import { LEVELS, getLevelConfig } from '../data/levelConfig';
import { generateQuestionSet } from '../utils/questionGenerator';
import { getSettings } from '../utils/storage';
import QuestionDisplay from '../components/QuestionDisplay';

/**
 * Flash Practice: numbers flash one at a time (full-screen style), then the
 * screen shows just "=" — no keypad, no answer entry. The student works the
 * problem out mentally, on paper, or on a real abacus, then taps
 * "Show Answer" to self-check before moving to the next card. No result is
 * scored or saved; this mode is purely a self-check flash-card drill.
 */
export default function FlashPractice() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const isValidLevel = !!levelId && LEVELS.some((l) => l.id === levelId);
  const safeLevelId = isValidLevel ? (levelId as string) : LEVELS[0].id;
  const config = getLevelConfig(safeLevelId);
  const settings = getSettings();
  const operationsOverride = settings.rowsOverride > 0 ? settings.rowsOverride - 1 : undefined;

  const questions = useMemo(
    () => generateQuestionSet(config, config.questionCount, operationsOverride),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeLevelId, settings.rowsOverride]
  );

  const [index, setIndex] = useState(0);
  const [sequenceReady, setSequenceReady] = useState(false);
  const [revealed, setRevealed] = useState(false);

  if (!isValidLevel) return <Navigate to="/dashboard" replace />;

  const question = questions[index];
  const isLast = index >= questions.length - 1;

  const next = () => {
    if (isLast) {
      navigate(`/level/${safeLevelId}`);
      return;
    }
    setIndex((i) => i + 1);
    setSequenceReady(false);
    setRevealed(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">{config.name}</p>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Flash Practice</h1>
        </div>
        <button
          onClick={() => navigate(`/level/${safeLevelId}`)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700"
          aria-label="Exit"
        >
          <X size={20} />
        </button>
      </div>

      <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
        Card {index + 1} / {questions.length}
      </p>

      <div className="card p-10 flex flex-col items-center justify-center min-h-[65vh]">
        <QuestionDisplay
          key={question.id}
          question={question}
          mode="sequential"
          presentationSpeedMs={config.presentationSpeedMs * settings.presentationSpeedMultiplier}
          onSequenceComplete={() => setSequenceReady(true)}
          revealed={revealed}
          answer={question.answer}
        />
        {!sequenceReady && !revealed && (
          <p className="text-xs text-slate-400 mt-4">Memorize as each number appears…</p>
        )}
        {sequenceReady && !revealed && (
          <button onClick={() => setRevealed(true)} className="btn-secondary mt-6">
            <Eye size={16} />
            Show Answer
          </button>
        )}
        {revealed && (
          <button onClick={next} className="btn-primary mt-6">
            {isLast ? <Flag size={16} /> : <ArrowRight size={16} />}
            {isLast ? 'Finish' : 'Next Card'}
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center mt-4">
        No answer input here — work it out mentally, on paper, or on an abacus, then tap Show Answer to check yourself.
      </p>
    </div>
  );
}

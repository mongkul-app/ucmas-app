import { useEffect, useState } from 'react';
import type { Question } from '../types/exercise';
import { questionToLines } from '../utils/questionGenerator';

interface QuestionDisplayProps {
  question: Question;
  mode?: 'static' | 'sequential';
  presentationSpeedMs?: number;
  onSequenceComplete?: () => void;
}

/**
 * Renders a UCMAS-style vertical arithmetic problem.
 * - 'static': every line is visible at once (classic worksheet/practice view).
 * - 'sequential': lines are revealed one at a time at `presentationSpeedMs`
 *   intervals, then disappear — true "mental arithmetic" training.
 */
export default function QuestionDisplay({
  question,
  mode = 'static',
  presentationSpeedMs = 1500,
  onSequenceComplete,
}: QuestionDisplayProps) {
  const lines = questionToLines(question);
  const [visibleIndex, setVisibleIndex] = useState(mode === 'sequential' ? -1 : lines.length - 1);
  const [sequenceDone, setSequenceDone] = useState(mode !== 'sequential');

  useEffect(() => {
    if (mode !== 'sequential') return;
    setVisibleIndex(-1);
    setSequenceDone(false);
    let i = -1;
    const interval = setInterval(() => {
      i += 1;
      setVisibleIndex(i);
      if (i >= lines.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          setSequenceDone(true);
          onSequenceComplete?.();
        }, presentationSpeedMs);
      }
    }, presentationSpeedMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, mode]);

  if (mode === 'sequential' && !sequenceDone) {
    const currentLine = visibleIndex >= 0 ? lines[visibleIndex] : '';
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <span
          key={visibleIndex}
          className="text-6xl sm:text-7xl font-extrabold text-slate-900 dark:text-white tabular-nums animate-[fadeIn_0.15s_ease-in]"
        >
          {currentLine}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tabular-nums text-right leading-relaxed">
        {lines.map((line, idx) => (
          <div key={idx} className={idx === lines.length - 1 ? 'border-t-4 border-slate-800 dark:border-white mt-1 pt-1' : ''}>
            {line}
          </div>
        ))}
        <div className="text-brand-600">?</div>
      </div>
    </div>
  );
}

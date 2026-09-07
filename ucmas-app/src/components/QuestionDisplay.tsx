import { useEffect, useState } from 'react';
import type { Question } from '../types/exercise';
import { questionToLines } from '../utils/questionGenerator';

interface QuestionDisplayProps {
  question: Question;
  mode?: 'static' | 'sequential';
  presentationSpeedMs?: number;
  onSequenceComplete?: () => void;
  /** When mode is 'sequential' and the flash has finished, force the full
   * worked list to show instead of the "=" placeholder (used by a
   * "Show Answer" hint button). Ignored in 'static' mode. */
  revealed?: boolean;
  /** When set (and revealed/static), shows this value in place of "?" —
   * used by self-check modes where there's no answer input at all. */
  answer?: number;
}

/**
 * Renders a UCMAS-style vertical arithmetic problem.
 * - 'static': every line is visible at once (classic worksheet/practice view).
 * - 'sequential': lines are revealed one at a time at `presentationSpeedMs`
 *   intervals, then disappear — true "mental arithmetic" training. Once the
 *   flash sequence finishes, only a "=" placeholder is shown (the numbers do
 *   NOT reappear) until `revealed` is set true.
 */
export default function QuestionDisplay({
  question,
  mode = 'static',
  presentationSpeedMs = 1500,
  onSequenceComplete,
  revealed = false,
  answer,
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

  // Still flashing numbers one at a time.
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

  // Flash finished but not revealed: show a plain "=" placeholder, numbers stay hidden.
  if (mode === 'sequential' && !revealed) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <span className="text-6xl sm:text-7xl font-extrabold text-slate-300 dark:text-slate-600">=</span>
      </div>
    );
  }

  // Full worked list: all numbers stacked, with the divider line placed at the
  // very last position (right above the answer slot), matching a paper worksheet.
  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tabular-nums text-right leading-relaxed">
        {lines.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
        <div className="border-t-4 border-slate-800 dark:border-white mt-1 pt-1 text-brand-600">
          {answer !== undefined ? answer : '?'}
        </div>
      </div>
    </div>
  );
}

import type { ChangeEvent } from 'react';
import type { Question } from '../types/exercise';
import { questionToLines } from '../utils/questionGenerator';

interface WorksheetGridProps {
  questions: Question[];
  startNumber?: number;
  answers?: Record<string, string>;
  onAnswerChange?: (questionId: string, value: string) => void;
  readOnlyAnswers?: boolean;
}

// Each question box is a fixed 2cm wide (like the paper UCMAS worksheet), so
// as many boxes as fit are laid out per row, on screen and when printed.
const BOX_WIDTH = '2cm';
const NUMBER_FONT_SIZE = '15px';

export default function WorksheetGrid({
  questions,
  startNumber = 1,
  answers = {},
  onAnswerChange,
  readOnlyAnswers = false,
}: WorksheetGridProps) {
  // Same height for every box so rows line up neatly.
  const maxLines = Math.max(1, ...questions.map((q) => questionToLines(q).length));

  return (
    <div className="flex flex-wrap gap-x-1.5 gap-y-3">
      {questions.map((q, idx) => {
        const qNumber = startNumber + idx;
        const lines = questionToLines(q);
        return (
          <div
            key={q.id}
            className="border border-slate-300 rounded overflow-hidden bg-white break-inside-avoid"
            style={{ width: BOX_WIDTH }}
          >
            <div className="bg-slate-100 text-center text-[11px] font-bold py-0.5 border-b border-slate-300">
              {qNumber}
            </div>
            <div
              className="font-mono font-semibold text-right px-1 py-1 tabular-nums leading-tight"
              style={{ fontSize: NUMBER_FONT_SIZE }}
            >
              {Array.from({ length: maxLines }).map((_, i) => (
                <div key={i}>{lines[i] ?? '\u00A0'}</div>
              ))}
            </div>
            <div className="border-t-2 border-slate-800 px-1 py-1 flex items-center justify-center gap-1 bg-white">
              <span className="text-[9px] text-slate-400 font-semibold">Ans</span>
              {readOnlyAnswers ? (
                <span className="font-bold tabular-nums" style={{ fontSize: '14px' }}>
                  {answers[q.id] ?? ''}
                </span>
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  value={answers[q.id] ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onAnswerChange?.(q.id, e.target.value.replace(/[^0-9-]/g, ''))
                  }
                  className="w-full min-w-0 text-center font-bold outline-none border-b border-slate-300 focus:border-brand-500 bg-transparent tabular-nums"
                  style={{ fontSize: '14px' }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

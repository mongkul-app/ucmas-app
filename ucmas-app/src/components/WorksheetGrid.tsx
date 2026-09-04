import type { ChangeEvent } from 'react';
import type { Question } from '../types/exercise';
import { questionToLines } from '../utils/questionGenerator';

interface WorksheetGridProps {
  questions: Question[];
  startNumber?: number;
  answers?: Record<string, string>;
  onAnswerChange?: (questionId: string, value: string) => void;
  readOnlyAnswers?: boolean;
  columnsPerRow?: number;
}

export default function WorksheetGrid({
  questions,
  startNumber = 101,
  answers = {},
  onAnswerChange,
  readOnlyAnswers = false,
  columnsPerRow = 5,
}: WorksheetGridProps) {
  const rows: Question[][] = [];
  for (let i = 0; i < questions.length; i += columnsPerRow) {
    rows.push(questions.slice(i, i + columnsPerRow));
  }

  return (
    <div className="space-y-8">
      {rows.map((row, rowIdx) => {
        const maxLines = Math.max(...row.map((q) => questionToLines(q).length));
        return (
          <div key={rowIdx} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0,1fr))` }}>
            {row.map((q, colIdx) => {
              const qNumber = startNumber + rowIdx * columnsPerRow + colIdx;
              const lines = questionToLines(q);
              return (
                <div key={q.id} className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 text-center text-xs font-bold py-1 border-b border-slate-300">
                    {qNumber}
                  </div>
                  <div className="font-mono text-sm sm:text-base font-semibold text-right px-2 py-2 tabular-nums">
                    {Array.from({ length: maxLines }).map((_, i) => (
                      <div key={i} className={i === lines.length - 1 ? 'border-t-2 border-slate-700 pt-0.5' : ''}>
                        {lines[i] ?? '\u00A0'}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-300 px-2 py-1.5 flex items-center justify-center gap-1 bg-white">
                    <span className="text-[10px] text-slate-400 font-semibold">Ans</span>
                    {readOnlyAnswers ? (
                      <span className="text-sm font-bold tabular-nums">{answers[q.id] ?? ''}</span>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="-?[0-9]*"
                        value={answers[q.id] ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onAnswerChange?.(q.id, e.target.value.replace(/[^0-9-]/g, ''))}
                        className="w-full text-center text-sm font-bold outline-none border-b border-slate-300 focus:border-brand-500 bg-transparent tabular-nums"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

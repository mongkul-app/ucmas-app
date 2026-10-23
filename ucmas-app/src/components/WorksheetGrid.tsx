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
  startNumber = 1,
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
    <div className="space-y-3">
      {rows.map((row, rowIdx) => {
        const maxLines = Math.max(...row.map((q) => questionToLines(q).length));
        return (
          <div key={rowIdx} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0,1fr))` }}>
            {row.map((q, colIdx) => {
              const qNumber = startNumber + rowIdx * columnsPerRow + colIdx;
              const lines = questionToLines(q);
              return (
                <div key={q.id} className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-100 text-center text-[11px] font-bold py-0.5 border-b border-slate-300">
                    {qNumber}
                  </div>
                  <div className="font-mono font-semibold text-right px-1.5 py-1 tabular-nums leading-tight" style={{ fontSize: '14px' }}>
                    {Array.from({ length: maxLines }).map((_, i) => (
                      <div key={i}>{lines[i] ?? '\u00A0'}</div>
                    ))}
                  </div>
                  <div className="border-t-2 border-slate-800 px-1.5 py-1 flex items-center justify-center gap-1 bg-white">
                    <span className="text-[9px] text-slate-400 font-semibold">Ans</span>
                    {readOnlyAnswers ? (
                      <span className="font-bold tabular-nums" style={{ fontSize: '14px' }}>{answers[q.id] ?? ''}</span>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="-?[0-9]*"
                        value={answers[q.id] ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onAnswerChange?.(q.id, e.target.value.replace(/[^0-9-]/g, ''))}
                        className="w-full text-center font-bold outline-none border-b border-slate-300 focus:border-brand-500 bg-transparent tabular-nums"
                        style={{ fontSize: '14px' }}
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

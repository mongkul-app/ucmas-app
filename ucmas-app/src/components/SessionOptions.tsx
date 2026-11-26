import type { ChangeEvent, ReactNode } from 'react';
import {
  DEFAULT_ROWS_FOR_MIXED,
  DIFFICULTY_OPTIONS,
  OPERATION_TYPES,
  QUESTION_COUNT_OPTIONS,
  ROWS_OPTIONS,
  TIME_OPTIONS,
  getOperationType,
  type Difficulty,
  type PracticeSettings,
} from '../utils/practiceSettings';

interface SessionOptionsProps {
  value: PracticeSettings;
  onChange: (next: PracticeSettings) => void;
}

const SELECT_CLASS =
  'w-full rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2.5 text-sm font-medium';

/**
 * The same five choices as the Worksheet page (operation type, rows,
 * number of questions, time, difficulty) for a level's practice modes.
 * Purely controlled: the page owns the value and persists it.
 */
export default function SessionOptions({ value, onChange }: SessionOptionsProps) {
  const opType = getOperationType(value.opType);
  const numeric = (v: string) => Number(v);

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
        Session options — apply to every mode below
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Operation type">
          <select
            value={value.opType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange({ ...value, opType: e.target.value })}
            className={SELECT_CLASS}
          >
            {OPERATION_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rows per question">
          <select
            value={value.rows}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange({ ...value, rows: numeric(e.target.value) })}
            className={SELECT_CLASS}
          >
            {ROWS_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'Level Default' : n}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Number of Questions">
          <select
            value={value.questionCount}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...value, questionCount: numeric(e.target.value) })
            }
            className={SELECT_CLASS}
          >
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'Level Default' : n}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Time (minutes)">
          <select
            value={value.timeMinutes}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...value, timeMinutes: numeric(e.target.value) })
            }
            className={SELECT_CLASS}
          >
            {TIME_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? 'Level Default' : n}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Difficulty">
          <select
            value={value.difficulty}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...value, difficulty: e.target.value as Difficulty })
            }
            className={SELECT_CLASS}
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Time applies to Timed Test and Speed Training; the other modes are untimed.
        {opType.ops && (
          <>
            {' '}
            With × and ÷, "Level Default" rows uses {DEFAULT_ROWS_FOR_MIXED} rows, and answers stay at 9999 or less.
          </>
        )}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

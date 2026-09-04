import { useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { LEVELS, getLevelConfig } from '../data/levelConfig';
import { getResults } from '../utils/storage';
import { formatTime } from '../utils/scoring';
import type { ExerciseMode } from '../types/exercise';

const MODES: { value: ExerciseMode | 'all'; label: string }[] = [
  { value: 'all', label: 'All Modes' },
  { value: 'practice', label: 'Practice' },
  { value: 'timed-test', label: 'Timed Test' },
  { value: 'speed-training', label: 'Speed Training' },
  { value: 'random-challenge', label: 'Random Challenge' },
  { value: 'mental-arithmetic', label: 'Mental Arithmetic' },
  { value: 'worksheet', label: 'Worksheet' },
];

export default function History() {
  const allResults = useMemo(() => getResults(), []);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filtered = allResults.filter((r) => {
    if (levelFilter !== 'all' && r.level !== levelFilter) return false;
    if (modeFilter !== 'all' && r.mode !== modeFilter) return false;
    if (dateFilter && r.completedAt.slice(0, 10) !== dateFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Practice History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{allResults.length} total sessions recorded.</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select value={levelFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setLevelFilter(e.target.value)} className="flex-1 rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2.5 text-sm font-medium">
          <option value="all">All Levels</option>
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select value={modeFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => setModeFilter(e.target.value)} className="flex-1 rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2.5 text-sm font-medium">
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 dark:border-navy-700 dark:bg-navy-800 px-3 py-2.5 text-sm font-medium"
        />
        {(levelFilter !== 'all' || modeFilter !== 'all' || dateFilter) && (
          <button
            onClick={() => { setLevelFilter('all'); setModeFilter('all'); setDateFilter(''); }}
            className="btn-ghost text-sm shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">No sessions match these filters.</p>
        )}
        {filtered.map((r) => {
          const level = getLevelConfig(r.level);
          const date = new Date(r.completedAt);
          return (
            <div key={r.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {level.name} <span className="text-slate-400 font-medium capitalize">· {r.mode.replace('-', ' ')}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Stat label="Score" value={`${r.score}`} />
                <Stat label="Accuracy" value={`${r.accuracy}%`} />
                <Stat label="Correct" value={`${r.correct}/${r.totalQuestions}`} />
                <Stat label="Time" value={formatTime(r.timeUsed)} />
                <Link to={`/level/${level.id}/${r.mode}`} className="btn-secondary text-xs px-3 py-2">
                  Retry
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

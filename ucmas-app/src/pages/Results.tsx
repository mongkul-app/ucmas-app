import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RotateCcw, ListChecks, LayoutDashboard } from 'lucide-react';
import ResultSummary from '../components/ResultSummary';
import type { SessionResultSummary } from '../hooks/useExerciseSession';
import { getLevelConfig } from '../data/levelConfig';

interface ResultsState {
  result: SessionResultSummary;
  levelId: string;
  mode: string;
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | undefined;

  if (!state?.result) {
    return <Navigate to="/dashboard" replace />;
  }

  const { result, levelId, mode } = state;
  const config = getLevelConfig(levelId);

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-6 sm:p-8">
        <p className="text-center text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
          {config.name} · {mode.replace('-', ' ')}
        </p>
        <ResultSummary result={result} />

        {result.attempts.some((a) => !a.correct) && (
          <div className="mt-6 border-t border-slate-100 dark:border-navy-700 pt-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Review</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {result.attempts.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                    a.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <span>Q{i + 1}: {a.question.numbers.map((n, idx) => (idx === 0 ? n : `${a.question.operations[idx - 1]}${n}`)).join(' ')}</span>
                  <span className="font-semibold">
                    Your answer: {a.studentAnswer ?? '—'} · Correct: {a.question.answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-2.5 mt-6">
          <button onClick={() => navigate(`/level/${levelId}/${mode}`, { replace: true })} className="btn-primary">
            <RotateCcw size={16} />
            Practice Again
          </button>
          <button onClick={() => navigate(`/level/${levelId}`)} className="btn-secondary">
            <ListChecks size={16} />
            Try Another
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost">
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

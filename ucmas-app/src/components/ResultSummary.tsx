import { Trophy, Target, XCircle, MinusCircle, Clock, Gauge } from 'lucide-react';
import { formatTime, motivationalMessage } from '../utils/scoring';
import type { SessionResultSummary } from '../hooks/useExerciseSession';

interface ResultSummaryProps {
  result: SessionResultSummary;
}

export default function ResultSummary({ result }: ResultSummaryProps) {
  const avgSec = result.totalQuestions > 0 ? (result.timeUsed / result.totalQuestions).toFixed(1) : '0.0';

  return (
    <div className="text-center">
      <p className="text-5xl mb-2">🎉</p>
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Practice Complete!</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-1.5">{motivationalMessage(result.accuracy)}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        <StatBlock icon={Trophy} label="Score" value={`${result.score}`} accent="text-amber-500" />
        <StatBlock icon={Gauge} label="Accuracy" value={`${result.accuracy}%`} accent="text-brand-600" />
        <StatBlock icon={Target} label="Correct" value={`${result.correct}`} accent="text-emerald-600" />
        <StatBlock icon={XCircle} label="Wrong" value={`${result.wrong}`} accent="text-rose-500" />
        <StatBlock icon={MinusCircle} label="Unanswered" value={`${result.unanswered}`} accent="text-slate-400" />
        <StatBlock icon={Clock} label="Time" value={formatTime(result.timeUsed)} accent="text-violet-600" />
      </div>

      <p className="text-xs text-slate-400 mt-4">Average: {avgSec} sec/question</p>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="card p-4">
      <Icon size={18} className={`mx-auto mb-1.5 ${accent}`} />
      <p className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

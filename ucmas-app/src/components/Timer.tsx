import { Clock, Pause, Play } from 'lucide-react';
import { formatTime } from '../utils/scoring';

interface TimerProps {
  seconds: number;
  isCountdown?: boolean;
  warningThreshold?: number;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

export default function Timer({ seconds, isCountdown, warningThreshold = 30, isPaused, onTogglePause }: TimerProps) {
  const isWarning = isCountdown && seconds <= warningThreshold;
  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold tabular-nums text-lg ${
        isWarning ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700 dark:bg-navy-700 dark:text-slate-200'
      }`}
    >
      <Clock size={18} />
      {formatTime(Math.max(0, seconds))}
      {onTogglePause && (
        <button onClick={onTogglePause} className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      )}
    </div>
  );
}

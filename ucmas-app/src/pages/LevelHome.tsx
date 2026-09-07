import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Dumbbell, Timer as TimerIcon, Zap, Shuffle, FileText, History as HistoryIcon, Play, Brain, Sparkles } from 'lucide-react';
import ExerciseCard from '../components/ExerciseCard';
import { LEVELS, getLevelConfig } from '../data/levelConfig';
import { getResultsForLevel, getProgress, getSettings, saveSettings } from '../utils/storage';
import { formatTime } from '../utils/scoring';

const ROW_OPTIONS = [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function LevelHome() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const isValidLevel = !!levelId && LEVELS.some((l) => l.id === levelId);
  const safeLevelId = isValidLevel ? (levelId as string) : LEVELS[0].id;

  const config = getLevelConfig(safeLevelId);
  const results = useMemo(() => getResultsForLevel(safeLevelId), [safeLevelId]);
  const progress = useMemo(() => getProgress().find((p) => p.level === safeLevelId), [safeLevelId]);
  const [rowsOverride, setRowsOverride] = useState(() => getSettings().rowsOverride);

  const selectRows = (n: number) => {
    setRowsOverride(n);
    saveSettings({ ...getSettings(), rowsOverride: n });
  };

  if (!isValidLevel) {
    return <Navigate to="/dashboard" replace />;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayResults = results.filter((r) => r.completedAt.slice(0, 10) === todayKey);
  const todayAccuracy = todayResults.length
    ? Math.round(todayResults.reduce((s, r) => s + r.accuracy, 0) / todayResults.length)
    : 0;
  const todayBestScore = todayResults.length ? Math.max(...todayResults.map((r) => r.score)) : 0;
  const todayTime = todayResults.reduce((s, r) => s + r.timeUsed, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide">{config.difficulty} · {config.name}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{config.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{config.tagline}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {config.topics.map((t) => (
            <span key={t} className="text-xs font-medium bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Rows per question (numbers to add/subtract) — applies to every mode below
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ROW_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => selectRows(n)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border-2 ${
                rowsOverride === n
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10'
                  : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {n === 0 ? 'Level Default' : n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ExerciseCard
          icon={Dumbbell}
          title="Practice"
          description="Untimed, question-by-question practice at your own pace."
          meta={`${config.questionCount} Questions · Untimed`}
          onClick={() => navigate(`/level/${safeLevelId}/practice`)}
        />
        <ExerciseCard
          icon={TimerIcon}
          title="Timed Test"
          description="Official UCMAS-style timed test with auto-submit."
          meta={`${config.questionCount} Questions · ${formatTime(config.defaultTimeLimitSec)}`}
          onClick={() => navigate(`/level/${safeLevelId}/timed-test`)}
        />
        <ExerciseCard
          icon={Zap}
          title="Speed Training"
          description="Shorter set, tighter time limit — build raw speed."
          meta={`${Math.max(5, Math.round(config.questionCount * 0.6))} Questions · Fast`}
          onClick={() => navigate(`/level/${safeLevelId}/speed-training`)}
        />
        <ExerciseCard
          icon={Shuffle}
          title="Random Challenge"
          description="A shuffled, unpredictable mix to test readiness."
          meta={`${config.questionCount} Questions · Mixed`}
          onClick={() => navigate(`/level/${safeLevelId}/random-challenge`)}
        />
        <ExerciseCard
          icon={Brain}
          title="Mental Arithmetic"
          description="Numbers appear one at a time, then a keypad to answer."
          meta={`${Math.max(5, Math.round(config.questionCount * 0.5))} Questions · Sequential`}
          onClick={() => navigate(`/level/${safeLevelId}/mental-arithmetic`)}
        />
        <ExerciseCard
          icon={Sparkles}
          title="Flash Practice"
          description="Full-screen flash cards, no typing — work it out on paper or abacus, then self-check."
          meta={`${config.questionCount} Cards · No input`}
          onClick={() => navigate(`/level/${safeLevelId}/flash`)}
        />
        <ExerciseCard
          icon={FileText}
          title="Worksheet Mode"
          description="Grid layout like the paper worksheet. Printable."
          meta="Configurable · Printable"
          onClick={() => navigate(`/level/${safeLevelId}/worksheet`)}
        />
      </div>

      <button
        onClick={() => navigate('/history')}
        className="btn-ghost text-sm"
      >
        <HistoryIcon size={16} />
        View {config.name} history
      </button>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="font-bold text-slate-900 dark:text-white mb-3">Today's Progress</p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{todayResults.length}</p>
              <p className="text-xs text-slate-400">Exercises</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{todayAccuracy}%</p>
              <p className="text-xs text-slate-400">Accuracy</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{todayBestScore}</p>
              <p className="text-xs text-slate-400">Best Score</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatTime(todayTime)}</p>
              <p className="text-xs text-slate-400">Practice Time</p>
            </div>
          </div>
          {progress && (
            <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100 dark:border-navy-700">
              All-time: {progress.exercisesCompleted} exercises · Best accuracy {progress.bestAccuracy}% · Best score {progress.bestScore}
            </p>
          )}
        </div>

        <div className="card p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-brand-100">Recommended Exercise</p>
            <p className="text-xl font-extrabold mt-1">{config.name}</p>
            <p className="text-sm text-brand-100">Addition / Subtraction</p>
            <p className="text-sm text-brand-100 mt-2">{config.questionCount} Questions · {formatTime(config.defaultTimeLimitSec)}</p>
          </div>
          <button onClick={() => navigate(`/level/${safeLevelId}/timed-test`)} className="btn bg-white text-brand-700 hover:bg-brand-50 mt-4 self-start">
            <Play size={16} />
            START
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Target, Trophy, Clock, Award, PlayCircle } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import LevelCard from '../components/LevelCard';
import { LEVELS, getLevelConfig } from '../data/levelConfig';
import { getResults, getProgress, getAchievements, getStudent } from '../utils/storage';
import { formatTime } from '../utils/scoring';
import MiniLineChart from '../components/MiniLineChart';

export default function Dashboard() {
  const student = getStudent();
  const results = useMemo(() => getResults(), []);
  const progress = useMemo(() => getProgress(), []);
  const achievements = useMemo(() => getAchievements(), []);

  const totalExercises = results.length;
  const totalQuestions = results.reduce((s, r) => s + r.totalQuestions, 0);
  const totalCorrect = results.reduce((s, r) => s + r.correct, 0);
  const totalWrong = results.reduce((s, r) => s + r.wrong, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const bestScore = results.length ? Math.max(...results.map((r) => r.score)) : 0;
  const totalTimeSec = results.reduce((s, r) => s + r.timeUsed, 0);
  const avgResponseSec = totalQuestions > 0 ? (totalTimeSec / totalQuestions).toFixed(1) : '0.0';

  const streak = useMemo(() => {
    const days = new Set(results.map((r) => r.completedAt.slice(0, 10)));
    let count = 0;
    const cursor = new Date();
    for (;;) {
      const key = cursor.toISOString().slice(0, 10);
      if (days.has(key)) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return count;
  }, [results]);

  const recent = results.slice(0, 4);
  const continueLevel = getLevelConfig(student.currentLevel);

  const scoreTrend = results.slice(0, 10).reverse().map((r) => r.score);
  const accuracyTrend = results.slice(0, 10).reverse().map((r) => r.accuracy);
  const perDayCount = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach((r) => {
      const key = r.completedAt.slice(5, 10);
      map.set(key, (map.get(key) ?? 0) + r.totalQuestions);
    });
    return Array.from(map.entries()).slice(-7).map(([, v]) => v);
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome back, {student.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's how your practice is going.</p>
        </div>
        <Link to={`/level/${continueLevel.id}/practice`} className="btn-primary">
          <PlayCircle size={18} />
          Continue Practice
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard icon={Clock} label="Total Practice" value={formatTime(totalTimeSec)} sublabel={`${totalExercises} exercises`} accent="brand" />
        <DashboardCard icon={Target} label="Accuracy" value={`${accuracy}%`} sublabel={`${totalCorrect} correct · ${totalWrong} wrong`} accent="emerald" />
        <DashboardCard icon={Trophy} label="Best Score" value={`${bestScore}`} sublabel={`Streak: ${streak} day${streak === 1 ? '' : 's'}`} accent="amber" />
        <DashboardCard icon={BarChart3} label="Questions Answered" value={`${totalQuestions}`} sublabel={`Avg ${avgResponseSec}s / question`} accent="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <p className="font-bold text-slate-900 dark:text-white mb-3">Score Over Time</p>
          <MiniLineChart data={scoreTrend.length ? scoreTrend : [0]} color="#3182f6" />
        </div>
        <div className="card p-5">
          <p className="font-bold text-slate-900 dark:text-white mb-3">Accuracy Trend</p>
          <MiniLineChart data={accuracyTrend.length ? accuracyTrend : [0]} color="#10b981" suffix="%" max={100} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <p className="font-bold text-slate-900 dark:text-white mb-3">Questions Completed (recent sessions)</p>
          <MiniBarChart data={perDayCount.length ? perDayCount : [0]} color="#f59e0b" />
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-amber-500" />
            <p className="font-bold text-slate-900 dark:text-white">Achievements</p>
          </div>
          <div className="space-y-2">
            {achievements.map((a) => (
              <div key={a.id} className={`flex items-center gap-2.5 text-sm ${a.unlockedAt ? '' : 'opacity-40'}`}>
                <span className="text-lg">{a.emoji}</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{a.title}</p>
                  <p className="text-xs text-slate-400 leading-tight">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Levels</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {LEVELS.map((level) => {
            const p = progress.find((pr) => pr.level === level.id);
            return <LevelCard key={level.id} level={level} progressPercent={p?.progressPercent ?? 0} />;
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Recent Practice</h2>
          <Link to="/history" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {recent.length === 0 && (
            <p className="text-sm text-slate-400 col-span-2">No practice history yet — start your first exercise!</p>
          )}
          {recent.map((r) => {
            const level = getLevelConfig(r.level);
            return (
              <div key={r.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{level.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{r.mode.replace('-', ' ')} · {r.totalQuestions} Questions</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accuracy: {r.accuracy}% · Time: {formatTime(r.timeUsed)} · Score: {r.score}
                  </p>
                </div>
                <Link to={`/level/${level.id}/practice`} className="btn-secondary text-xs px-3 py-2 shrink-0">
                  Practice Again
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-md" style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: 4 }} />
      ))}
    </div>
  );
}

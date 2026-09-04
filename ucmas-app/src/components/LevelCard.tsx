import { Link } from 'react-router-dom';
import {
  Sprout, Circle, Triangle, Square, Hexagon, Star, Trophy, ChevronRight,
} from 'lucide-react';
import type { LevelConfig } from '../data/levelConfig';
import ProgressBar from './ProgressBar';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sprout, Circle, Triangle, Square, Hexagon, Star, Trophy,
};

const ACCENTS: Record<string, { chip: string; bar: string; text: string }> = {
  emerald: { chip: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  sky: { chip: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500', text: 'text-sky-600' },
  amber: { chip: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', text: 'text-amber-600' },
  violet: { chip: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500', text: 'text-violet-600' },
  rose: { chip: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500', text: 'text-rose-600' },
  fuchsia: { chip: 'bg-fuchsia-50 text-fuchsia-600', bar: 'bg-fuchsia-500', text: 'text-fuchsia-600' },
};

interface LevelCardProps {
  level: LevelConfig;
  progressPercent?: number;
}

export default function LevelCard({ level, progressPercent = 0 }: LevelCardProps) {
  const Icon = ICONS[level.icon] ?? Circle;
  const accent = ACCENTS[level.color] ?? ACCENTS.sky;

  return (
    <Link to={`/level/${level.id}`} className="card p-5 flex flex-col gap-3 hover:shadow-cardLg transition-shadow group">
      <div className="flex items-center justify-between">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accent.chip}`}>
          <Icon size={22} />
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div>
        <p className="font-bold text-slate-900 dark:text-white">{level.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{level.tagline}</p>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span className={`font-semibold ${accent.text}`}>{progressPercent}%</span>
        </div>
        <ProgressBar percent={progressPercent} color={accent.bar} height="h-1.5" />
      </div>
    </Link>
  );
}

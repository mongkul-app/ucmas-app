import { Menu, Flame } from 'lucide-react';
import { getStudent } from '../utils/storage';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const student = getStudent();

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-navy-900/80 backdrop-blur border-b border-slate-200 dark:border-navy-700 no-print">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-700"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          {title && <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{title}</h1>}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full">
            <Flame size={16} />
            <span>Keep it up!</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
              {student.name.slice(0, 1)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{student.name}</p>
              <p className="text-xs text-slate-400 leading-tight capitalize">{student.currentLevel.replace('-', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

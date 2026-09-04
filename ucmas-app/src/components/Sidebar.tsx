import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Sprout, Circle, Triangle, Square, Hexagon, Star, Trophy,
  X, Calculator, Settings as SettingsIcon, History as HistoryIcon,
} from 'lucide-react';
import { LEVELS } from '../data/levelConfig';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sprout, Circle, Triangle, Square, Hexagon, Star, Trophy,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const linkBase =
    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors';
  const inactive = 'text-slate-300 hover:bg-navy-700 hover:text-white';
  const active = 'bg-brand-600 text-white shadow-sm';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-navy-900 flex flex-col z-40 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-navy-700">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold leading-tight">UCMAS Trainer</p>
              <p className="text-navy-700 text-[11px] text-slate-400">Mental Math Practice</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink to="/dashboard" onClick={onClose} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <p className="px-3.5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Levels
          </p>
          {LEVELS.map((level) => {
            const Icon = ICONS[level.icon] ?? Circle;
            return (
              <NavLink
                key={level.id}
                to={`/level/${level.id}`}
                onClick={onClose}
                className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
              >
                <Icon size={18} />
                {level.name}
              </NavLink>
            );
          })}

          <p className="px-3.5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            More
          </p>
          <NavLink to="/history" onClick={onClose} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
            <HistoryIcon size={18} />
            History
          </NavLink>
          <NavLink to="/settings" onClick={onClose} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
            <SettingsIcon size={18} />
            Settings
          </NavLink>
        </nav>

        <div className="px-5 py-4 border-t border-navy-700">
          <p className="text-[11px] text-slate-500">UCMAS-style trainer · Local data</p>
        </div>
      </aside>
    </>
  );
}

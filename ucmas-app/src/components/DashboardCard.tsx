import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  accent?: keyof typeof ACCENTS;
}

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10',
};

export default function DashboardCard({ icon: Icon, label, value, sublabel, accent = 'brand' }: DashboardCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
          {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${ACCENTS[accent]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

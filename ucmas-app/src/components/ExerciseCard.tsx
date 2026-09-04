import type { LucideIcon } from 'lucide-react';

interface ExerciseCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  meta: string; // e.g. "20 Questions · 8 min · Easy"
  onClick: () => void;
}

export default function ExerciseCard({ icon: Icon, title, description, meta, onClick }: ExerciseCardProps) {
  return (
    <button
      onClick={onClick}
      className="card p-5 text-left flex flex-col gap-2.5 hover:shadow-cardLg hover:-translate-y-0.5 transition-all"
    >
      <div className="h-11 w-11 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center">
        <Icon size={22} />
      </div>
      <p className="font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <p className="text-xs font-semibold text-slate-400 mt-1">{meta}</p>
    </button>
  );
}

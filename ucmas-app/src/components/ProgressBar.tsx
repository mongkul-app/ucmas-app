interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: string;
}

export default function ProgressBar({ percent, color = 'bg-brand-600', height = 'h-2.5' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`w-full ${height} rounded-full bg-slate-100 dark:bg-navy-700 overflow-hidden`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

interface MiniLineChartProps {
  data: number[];
  color?: string;
  suffix?: string;
  max?: number;
  height?: number;
}

export default function MiniLineChart({ data, color = '#3182f6', suffix = '', max, height = 128 }: MiniLineChartProps) {
  const width = 400;
  const dataMax = max ?? Math.max(...data, 1);
  const dataMin = Math.min(...data, 0);
  const range = Math.max(dataMax - dataMin, 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - dataMin) / range) * (height - 16) - 8;
    return `${x},${y}`;
  });

  const pathD = points.length > 1 ? `M${points.join(' L')}` : '';
  const areaD = points.length > 1 ? `M0,${height} L${points.join(' L')} L${width},${height} Z` : '';
  const last = data[data.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {areaD && <path d={areaD} fill={color} opacity={0.08} />}
        {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => {
          const [x, y] = p.split(',').map(Number);
          return <circle key={i} cx={x} cy={y} r={3.5} fill={color} />;
        })}
      </svg>
      <p className="text-xs text-slate-400 mt-1">
        Latest: <span className="font-semibold text-slate-600 dark:text-slate-300">{last}{suffix}</span>
      </p>
    </div>
  );
}

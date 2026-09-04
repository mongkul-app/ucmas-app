import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import AbacusBead from './AbacusBead';

interface AbacusProps {
  columns?: number;
  onValueChange?: (value: number) => void;
}

/**
 * A simplified functional soroban (Japanese abacus).
 * Each rod has one "heaven" bead (worth 5, active when moved down toward the beam)
 * and four "earth" beads (worth 1 each, active when moved up toward the beam).
 */
export default function Abacus({ columns = 5, onValueChange }: AbacusProps) {
  const [heaven, setHeaven] = useState<boolean[]>(() => Array(columns).fill(false));
  const [earth, setEarth] = useState<number[]>(() => Array(columns).fill(0)); // 0-4 active beads per rod

  const value = useMemo(() => {
    let total = 0;
    for (let c = 0; c < columns; c++) {
      const place = Math.pow(10, columns - 1 - c);
      const colValue = (heaven[c] ? 5 : 0) + earth[c];
      total += colValue * place;
    }
    return total;
  }, [heaven, earth, columns]);

  const toggleHeaven = (col: number) => {
    setHeaven((prev) => {
      const next = [...prev];
      next[col] = !next[col];
      onValueChange?.(computeValue(next, earth, columns));
      return next;
    });
  };

  const setEarthCount = (col: number, count: number) => {
    setEarth((prev) => {
      const next = [...prev];
      next[col] = count;
      onValueChange?.(computeValue(heaven, next, columns));
      return next;
    });
  };

  const reset = () => {
    setHeaven(Array(columns).fill(false));
    setEarth(Array(columns).fill(0));
    onValueChange?.(0);
  };

  return (
    <div className="card p-5 sm:p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Abacus Value</p>
          <p className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
        </div>
        <button onClick={reset} className="btn-secondary text-xs px-3 py-2">
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-navy-700/40 rounded-xl p-3 sm:p-4 border-2 border-amber-800/20">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
          {/* Heaven beads */}
          {Array.from({ length: columns }).map((_, col) => (
            <div key={`heaven-${col}`} className="flex flex-col justify-end h-14">
              <AbacusBead active={heaven[col]} onClick={() => toggleHeaven(col)} variant="heaven" />
            </div>
          ))}
        </div>

        <div className="h-1 bg-slate-800 dark:bg-slate-300 my-2 rounded-full" />

        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
          {/* Earth beads: 4 per rod */}
          {Array.from({ length: columns }).map((_, col) => (
            <div key={`earth-${col}`} className="flex flex-col-reverse gap-0.5">
              {Array.from({ length: 4 }).map((_, beadIdx) => {
                const active = beadIdx < earth[col];
                return (
                  <AbacusBead
                    key={beadIdx}
                    active={active}
                    variant="earth"
                    onClick={() => setEarthCount(col, active ? beadIdx : beadIdx + 1)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center mt-3">
        Tap a bead to move it toward the beam. Top bead = 5, bottom beads = 1 each.
      </p>
    </div>
  );
}

function computeValue(heaven: boolean[], earth: number[], columns: number): number {
  let total = 0;
  for (let c = 0; c < columns; c++) {
    const place = Math.pow(10, columns - 1 - c);
    total += ((heaven[c] ? 5 : 0) + earth[c]) * place;
  }
  return total;
}

import { Delete, CornerDownLeft } from 'lucide-react';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onToggleSign: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function NumericKeypad({ onDigit, onBackspace, onToggleSign, onSubmit, disabled }: NumericKeypadProps) {
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((k) => (
          <button key={k} disabled={disabled} className="kbd-btn" onClick={() => onDigit(k)}>
            {k}
          </button>
        ))}
        <button disabled={disabled} className="kbd-btn text-rose-500" onClick={onToggleSign}>
          &minus;
        </button>
        <button disabled={disabled} className="kbd-btn" onClick={() => onDigit('0')}>
          0
        </button>
        <button disabled={disabled} className="kbd-btn text-slate-400" onClick={onBackspace} aria-label="Backspace">
          <Delete size={20} />
        </button>
      </div>
      <button
        disabled={disabled}
        onClick={onSubmit}
        className="btn-primary w-full mt-2.5 h-14 text-base gap-2"
      >
        <CornerDownLeft size={18} />
        SUBMIT
      </button>
    </div>
  );
}

interface AbacusBeadProps {
  active: boolean;
  onClick: () => void;
  variant: 'heaven' | 'earth'; // heaven bead = value 5, earth bead = value 1
}

export default function AbacusBead({ active, onClick, variant }: AbacusBeadProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`${variant} bead ${active ? 'active' : 'inactive'}`}
      className="w-full flex justify-center py-0.5 group"
    >
      <div
        className={`h-5 w-8 sm:h-6 sm:w-10 transition-all duration-150 ${
          active
            ? 'bg-gradient-to-b from-amber-400 to-amber-600 shadow-md scale-105'
            : 'bg-gradient-to-b from-slate-400 to-slate-500 group-hover:from-amber-300 group-hover:to-amber-500'
        }`}
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
      />
    </button>
  );
}

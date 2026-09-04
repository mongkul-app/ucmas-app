import { useState } from 'react';
import { Volume2, Moon, Bell, Gauge, Type, Globe, Check } from 'lucide-react';
import { getSettings, saveSettings, type AppSettings } from '../utils/storage';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    document.documentElement.classList.toggle('dark', next.darkMode);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize your training experience.</p>
        </div>
        {saved && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Check size={14} /> Saved
          </span>
        )}
      </div>

      <div className="card divide-y divide-slate-100 dark:divide-navy-700">
        <ToggleRow
          icon={Volume2}
          title="Sound Effects"
          description="Play sounds for correct/wrong answers and completion."
          checked={settings.soundEnabled}
          onChange={(v) => update({ soundEnabled: v })}
        />
        <ToggleRow
          icon={Moon}
          title="Dark Mode"
          description="Switch to a dark color scheme."
          checked={settings.darkMode}
          onChange={(v) => update({ darkMode: v })}
        />
        <ToggleRow
          icon={Bell}
          title="Timer Sound"
          description="Play a warning sound near the end of a timed test."
          checked={settings.timerSound}
          onChange={(v) => update({ timerSound: v })}
        />
        <ToggleRow
          icon={Bell}
          title="Question Transition Sound"
          description="Play a subtle tone when moving to the next question."
          checked={settings.transitionSound}
          onChange={(v) => update({ transitionSound: v })}
        />
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={18} className="text-brand-600" />
          <p className="font-bold text-slate-900 dark:text-white">Number Presentation Speed</p>
        </div>
        <p className="text-xs text-slate-400 mb-3">Controls how fast numbers appear in Mental Arithmetic mode.</p>
        <div className="flex gap-2">
          {[{ label: 'Slower', v: 1.4 }, { label: 'Normal', v: 1 }, { label: 'Faster', v: 0.7 }, { label: 'Fastest', v: 0.45 }].map((opt) => (
            <button
              key={opt.label}
              onClick={() => update({ presentationSpeedMultiplier: opt.v })}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                settings.presentationSpeedMultiplier === opt.v
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10'
                  : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Type size={18} className="text-brand-600" />
          <p className="font-bold text-slate-900 dark:text-white">Font Size</p>
        </div>
        <div className="flex gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <button
              key={size}
              onClick={() => update({ fontSize: size })}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold border-2 transition-colors capitalize ${
                settings.fontSize === size
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10'
                  : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={18} className="text-brand-600" />
          <p className="font-bold text-slate-900 dark:text-white">Language</p>
        </div>
        <div className="flex gap-2">
          {[{ v: 'en', label: 'English' }, { v: 'km', label: 'ខ្មែរ (Khmer)' }].map((opt) => (
            <button
              key={opt.v}
              onClick={() => update({ language: opt.v as AppSettings['language'] })}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold border-2 transition-colors ${
                settings.language === opt.v
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/10'
                  : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {settings.language === 'km' && (
          <p className="text-xs text-slate-400 mt-3">
            ភាសាខ្មែរកំពុងត្រូវបានរៀបចំ — ចំណុចប្រទាក់ភាគច្រើននឹងបន្តជាភាសាអង់គ្លេសសម្រាប់ពេលនេះ។
          </p>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full transition-colors shrink-0 relative ${checked ? 'bg-brand-600' : 'bg-slate-200 dark:bg-navy-700'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

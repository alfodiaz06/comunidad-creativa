import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

const PRESETS = [
  { key: 'today',   label: 'Hoy' },
  { key: '7d',      label: 'Últimos 7 días' },
  { key: '30d',     label: 'Último mes' },
  { key: 'custom',  label: 'Personalizado' },
];

export function getRange(key, custom = {}) {
  const now = new Date(); now.setHours(23,59,59,999);
  const start = new Date(); start.setHours(0,0,0,0);
  if (key === 'today') return { from: start, to: now };
  if (key === '7d')  { start.setDate(start.getDate()-6); return { from: start, to: now }; }
  if (key === '30d') { start.setDate(start.getDate()-29); return { from: start, to: now }; }
  if (key === 'custom' && custom.from && custom.to) {
    const f = new Date(custom.from); f.setHours(0,0,0,0);
    const t = new Date(custom.to);   t.setHours(23,59,59,999);
    return { from: f, to: t };
  }
  // default 30d
  start.setDate(start.getDate()-29);
  return { from: start, to: now };
}

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState({ from: '', to: '' });
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (key) => {
    if (key !== 'custom') { onChange(key, {}); setOpen(false); }
  };

  const applyCustom = () => {
    if (!custom.from || !custom.to) return;
    onChange('custom', custom);
    setOpen(false);
  };

  const preset = PRESETS.find(p => p.key === value) || PRESETS[2];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-obsidian-700 border border-white/10 hover:border-white/20 transition-all text-sm font-body text-slate-300">
        <Calendar className="w-4 h-4 text-brand-400"/>
        <span>{preset.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 glass-strong rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
          <div className="p-2">
            {PRESETS.filter(p => p.key !== 'custom').map(p => (
              <button key={p.key} onClick={() => select(p.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-body transition-all
                  ${value === p.key ? 'bg-brand-500/15 text-brand-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-white/5 p-3 space-y-2">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Personalizado</p>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Desde</label>
              <input type="date" className="input-field py-1.5 text-sm"
                value={custom.from} onChange={e => setCustom(c => ({...c, from: e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Hasta</label>
              <input type="date" className="input-field py-1.5 text-sm"
                value={custom.to} onChange={e => setCustom(c => ({...c, to: e.target.value}))}/>
            </div>
            <button onClick={applyCustom} disabled={!custom.from || !custom.to}
              className="w-full btn-primary py-2 text-sm mt-1 disabled:opacity-40">
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

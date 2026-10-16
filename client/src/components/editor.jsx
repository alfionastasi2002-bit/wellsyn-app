import { Minus, Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../i18n/index.js';

// Piccoli controlli usati negli editor di piani alimentari e schede di allenamento.

/** Gruppo di pulsanti a scelta singola (es. Attivo / Bozza / Archiviato). */
export function Segmented({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl border border-line bg-soft p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
              value === o.value ? 'bg-surface text-brand-800 shadow-card' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Chip cliccabile. */
export function Chip({ active, onClick, children, disabled, title, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line bg-surface text-ink-700 hover:border-brand-300'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Campo numerico con pulsanti − e +. */
export function Stepper({ value, onChange, min = 0, max = 99, step = 1, label, suffix, className = '' }) {
  const n = Number(String(value).replace(',', '.')) || 0;
  const set = (v) => onChange(String(Math.min(max, Math.max(min, v))));
  return (
    <div className={`flex items-center rounded-lg border border-line bg-surface ${className}`}>
      <button type="button" onClick={() => set(n - step)} className="grid h-9 w-8 shrink-0 place-items-center text-ink-500 hover:text-ink-900" aria-label={t('Diminuisci {label}', { label })}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        inputMode="numeric"
        aria-label={label}
        className="w-full min-w-0 bg-transparent py-2 text-center text-sm font-semibold text-ink-900 outline-none"
      />
      {suffix && <span className="pr-1 text-xs text-ink-400">{suffix}</span>}
      <button type="button" onClick={() => set(n + step)} className="grid h-9 w-8 shrink-0 place-items-center text-ink-500 hover:text-ink-900" aria-label={t('Aumenta {label}', { label })}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Campo di testo con suggerimenti mentre scrivi.
 * suggestions(query) -> [{ key, label, detail, value }]; onPick(item) quando se ne sceglie uno.
 */
export function SuggestInput({ value, onChange, onPick, suggestions, placeholder, ariaLabel, className = '', inputClassName = '' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listId = useId();
  const items = open ? suggestions(value).slice(0, 8) : [];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function pick(item) {
    onPick(item);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={`w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${inputClassName}`}
      />
      {items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-float">
          {items.map((item, i) => (
            <li key={item.key} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === active ? 'bg-brand-50' : ''}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink-900">{item.label}</span>
                  {item.sub && <span className="block truncate text-xs text-ink-500">{item.sub}</span>}
                </span>
                {item.detail && <span className="shrink-0 text-xs font-semibold text-brand-800">{item.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Barra di avanzamento rispetto a un obiettivo (verde se vicino, ambra se lontano). */
export function TargetBar({ value, target, className = '' }) {
  if (!target) return null;
  const ratio = value / target;
  const pct = Math.min(100, Math.round(ratio * 100));
  const tone = ratio >= 0.9 && ratio <= 1.1 ? 'bg-brand-500' : 'bg-amber-400';
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-track ${className}`}>
      <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

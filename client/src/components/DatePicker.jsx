import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { locale, t } from '../i18n/index.js';
import { addDaysKey, capitalize, fmtDayKey, todayKey, weekStartKey } from '../lib/format.js';

// Finestrella ancorata a un elemento (sopra a tutto, anche alle finestre modali)

/** Mostra "children" sotto (o sopra, se manca spazio) all'elemento anchorRef. */
export function Popover({ anchorRef, open, onClose, children, className = '', align = 'start' }) {
  const ref = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const box = ref.current;
      if (!anchor || !box) return;
      const margin = 8;
      const { offsetWidth: w, offsetHeight: h } = box;
      const below = window.innerHeight - anchor.bottom;
      const top = below >= h + margin || below > anchor.top ? anchor.bottom + 6 : anchor.top - h - 6;
      let left = align === 'end' ? anchor.right - w : anchor.left;
      left = Math.min(Math.max(margin, left), window.innerWidth - w - margin);
      setPosition({ top: Math.max(margin, top), left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, align]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target) && !anchorRef.current?.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // chiude solo il calendario, non la finestra sotto
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return createPortal(
    <div
      ref={ref}
      className={`fixed z-[70] rounded-2xl border border-line bg-surface shadow-float ${className}`}
      style={position ?? { top: -9999, left: -9999 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

// Calendario del mese

const monthKey = (key) => `${key.slice(0, 7)}-01`;
const shiftMonth = (key, n) => {
  const d = new Date(`${monthKey(key)}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};
const weekdayNames = () =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale(), { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i, 12))),
  );

/**
 * Calendario mensile.
 * value: giorno scelto "YYYY-MM-DD"; min/max: limiti; marks: Set di giorni con un puntino (es. appuntamenti).
 */
export function Calendar({ value, onChange, min, max, marks, autoFocus = false }) {
  const today = todayKey();
  const [month, setMonth] = useState(() => monthKey(value || today));
  const [focused, setFocused] = useState(value || today);
  const [mode, setMode] = useState('days'); // 'days' | 'months'
  const gridRef = useRef(null);

  const disabled = (key) => (min && key < min) || (max && key > max);
  const start = weekStartKey(month);
  const days = Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));

  useEffect(() => {
    if (autoFocus) gridRef.current?.querySelector('[data-focused="true"]')?.focus();
  }, [autoFocus]);

  function moveFocus(key) {
    setFocused(key);
    if (monthKey(key) !== month) setMonth(monthKey(key));
    requestAnimationFrame(() => gridRef.current?.querySelector(`[data-day="${key}"]`)?.focus());
  }

  function onKeyDown(e) {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (steps[e.key]) {
      e.preventDefault();
      moveFocus(addDaysKey(focused, steps[e.key]));
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      moveFocus(shiftMonth(focused, e.key === 'PageUp' ? -1 : 1).slice(0, 8) + focused.slice(8));
    }
  }

  const title = capitalize(fmtDayKey(month, { month: 'long', year: 'numeric' }));
  const year = Number(month.slice(0, 4));

  return (
    <div className="w-[296px] p-3 select-none">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (mode === 'days' ? setMonth(shiftMonth(month, -1)) : setMonth(`${year - 1}${month.slice(4)}`))}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-hover"
          aria-label={mode === 'days' ? t('Mese precedente') : t('Anno precedente')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === 'days' ? 'months' : 'days')}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 font-display text-[15px] font-semibold text-ink-900 hover:bg-hover"
          aria-label={t('Scegli mese e anno')}
        >
          {mode === 'days' ? title : year}
          <ChevronDown className={`h-4 w-4 text-ink-500 transition ${mode === 'months' ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => (mode === 'days' ? setMonth(shiftMonth(month, 1)) : setMonth(`${year + 1}${month.slice(4)}`))}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-hover"
          aria-label={mode === 'days' ? t('Mese successivo') : t('Anno successivo')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {mode === 'months' ? (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {Array.from({ length: 12 }, (_, i) => {
            const key = `${year}-${String(i + 1).padStart(2, '0')}-01`;
            const active = key === month;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMonth(key);
                  setMode('days');
                }}
                className={`rounded-xl py-2.5 text-sm font-medium capitalize transition ${
                  active ? 'bg-primary text-white' : 'text-ink-700 hover:bg-hover'
                }`}
              >
                {fmtDayKey(key, { month: 'short' }).replace('.', '')}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            {weekdayNames().map((d, i) => (
              <span key={i} className="py-1.5">
                {d}
              </span>
            ))}
          </div>
          <div ref={gridRef} role="grid" className="grid grid-cols-7 gap-y-0.5" onKeyDown={onKeyDown}>
            {days.map((key) => {
              const inMonth = key.slice(0, 7) === month.slice(0, 7);
              const selected = key === value;
              const isToday = key === today;
              const off = disabled(key);
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-day={key}
                  data-focused={key === focused}
                  tabIndex={key === focused ? 0 : -1}
                  disabled={off}
                  aria-selected={selected}
                  aria-label={fmtDayKey(key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  onClick={() => onChange(key)}
                  onFocus={() => setFocused(key)}
                  className={`relative mx-auto grid h-9 w-9 place-items-center rounded-full text-sm transition outline-offset-1 ${
                    selected
                      ? 'bg-primary font-semibold text-white shadow-sm'
                      : isToday
                        ? 'font-semibold text-brand-800 ring-1 ring-brand-400 hover:bg-brand-50'
                        : inMonth
                          ? 'text-ink-900 hover:bg-hover'
                          : 'text-ink-300 hover:bg-hover'
                  } ${off ? 'cursor-not-allowed opacity-30 hover:bg-transparent' : ''}`}
                >
                  {Number(key.slice(8))}
                  {marks?.has(key) && (
                    <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? 'bg-white' : 'bg-brand-500'}`} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <button
          type="button"
          disabled={disabled(today)}
          onClick={() => onChange(today)}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-50 disabled:opacity-40"
        >
          {t('Oggi')}
        </button>
        {!disabled(addDaysKey(today, 1)) && (
          <button
            type="button"
            onClick={() => onChange(addDaysKey(today, 1))}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-hover"
          >
            {t('Domani')}
          </button>
        )}
      </div>
    </div>
  );
}

// Campo data con calendario a comparsa

/**
 * Campo per scegliere una data con un calendario a comparsa.
 * value / onChange lavorano con il formato "YYYY-MM-DD" (stringa vuota = nessuna data).
 */
export function DatePicker({ label, value, onChange, min, max, marks, placeholder, clearable = false, hint, className = '', disabled = false }) {
  const id = useId();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const shown = value ? capitalize(fmtDayKey(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) : '';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={anchorRef}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`flex w-full items-center gap-2.5 rounded-xl border bg-surface px-3.5 py-2.5 text-left text-[15px] transition outline-none focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-100 disabled:bg-soft disabled:text-ink-500 ${
            open ? 'border-brand-500 ring-4 ring-brand-100' : 'border-line'
          } ${clearable && value ? 'pr-10' : ''}`}
        >
          <CalendarDays className="h-[18px] w-[18px] shrink-0 text-brand-700" />
          <span className={`min-w-0 flex-1 truncate ${shown ? 'text-ink-900' : 'text-ink-300'}`}>{shown || placeholder || t('Scegli una data')}</span>
        </button>
        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-ink-400 hover:bg-hover hover:text-ink-700"
            aria-label={t('Cancella la data')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <Calendar
          value={value}
          min={min}
          max={max}
          marks={marks}
          autoFocus
          onChange={(key) => {
            onChange(key);
            setOpen(false);
            anchorRef.current?.focus();
          }}
        />
      </Popover>
    </div>
  );
}

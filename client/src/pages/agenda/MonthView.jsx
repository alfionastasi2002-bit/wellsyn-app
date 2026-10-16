import { Plus } from 'lucide-react';
import { locale, t } from '../../i18n/index.js';
import { capitalize, displayName, fmtDayKey, fmtTime, todayKey } from '../../lib/format.js';
import { DOTS, monthGrid, toneOf } from './agendaUtils.js';

const weekdayNames = (style) =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale(), { weekday: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i, 12))),
  );

/**
 * Calendario del mese. Ogni giorno mostra i suoi appuntamenti (o dei puntini su smartphone);
 * cliccando un giorno lo si seleziona e i dettagli compaiono nell'elenco accanto.
 */
export function MonthView({ anchor, selected, onSelect, appointments, viewerRole, onCreate, showCancelled }) {
  const today = todayKey();
  const days = monthGrid(anchor);
  const visible = appointments.filter((a) => showCancelled || a.status !== 'cancelled');
  const byDay = new Map();
  for (const a of visible) byDay.set(a.day, [...(byDay.get(a.day) ?? []), a]);
  const short = weekdayNames('short');

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line">
        {short.map((d) => (
          <span key={d} className="py-2 text-center text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            {d.replace('.', '')}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const list = byDay.get(day) ?? [];
          const inMonth = day.slice(0, 7) === anchor.slice(0, 7);
          const isSelected = day === selected;
          const isToday = day === today;
          return (
            <div
              key={day}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(day)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(day))}
              aria-label={capitalize(fmtDayKey(day, { weekday: 'long', day: 'numeric', month: 'long' })) + (list.length ? ` · ${t('{n} appuntamenti', { n: list.length })}` : '')}
              aria-pressed={isSelected}
              className={`group relative min-h-[64px] cursor-pointer border-line p-1.5 text-left transition sm:min-h-[108px] ${i % 7 ? 'border-l' : ''} ${
                i >= 7 ? 'border-t' : ''
              } ${isSelected ? 'bg-brand-50/70 ring-2 ring-brand-500 ring-inset' : inMonth ? 'hover:bg-soft' : 'bg-soft/60 hover:bg-soft'}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${
                    isToday ? 'bg-primary text-white' : inMonth ? 'text-ink-900' : 'text-ink-300'
                  }`}
                >
                  {Number(day.slice(8))}
                </span>
                {onCreate && day >= today && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreate(day);
                    }}
                    className="hidden h-6 w-6 place-items-center rounded-full text-brand-800 opacity-0 transition group-hover:opacity-100 hover:bg-brand-100 focus:opacity-100 sm:grid"
                    aria-label={t('Nuovo appuntamento il {day}', { day: fmtDayKey(day, { day: 'numeric', month: 'long' }) })}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Smartphone: solo puntini */}
              {list.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {list.slice(0, 4).map((a) => (
                    <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${DOTS[toneOf(a, viewerRole)]}`} />
                  ))}
                </div>
              )}
              {/* Da tablet in su: orario e persona */}
              <ul className="mt-1 hidden space-y-0.5 sm:block">
                {list.slice(0, 3).map((a) => {
                  const person = viewerRole === 'client' ? a.professional : a.client;
                  const tone = toneOf(a, viewerRole);
                  return (
                    <li key={a.id} className={`flex items-center gap-1 truncate text-[11px] leading-tight ${a.status === 'cancelled' ? 'text-ink-400 line-through' : 'text-ink-700'}`}>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`} />
                      <span className="font-semibold">{fmtTime(a.date)}</span>
                      <span className="truncate">{person ? person.firstName : ''}</span>
                    </li>
                  );
                })}
                {list.length > 3 && <li className="text-[11px] font-medium text-brand-800">{t('+{n} altri', { n: list.length - 3 })}</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Elenco degli appuntamenti del giorno selezionato (accanto o sotto al calendario del mese). */
export function DayPanel({ day, appointments, viewerRole, onOpen, onCreate }) {
  const list = appointments.filter((a) => a.day === day).sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="eyebrow text-[10px]">{t('Giorno selezionato')}</p>
          <p className="font-display text-lg font-semibold">{capitalize(fmtDayKey(day, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
        </div>
        {onCreate && day >= todayKey() && (
          <button type="button" className="btn-soft px-3" onClick={() => onCreate(day)} aria-label={t('Nuovo appuntamento')}>
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="mt-4 rounded-xl bg-soft px-3 py-6 text-center text-sm text-ink-500">{t('Nessun appuntamento in questo giorno.')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((a) => {
            const person = viewerRole === 'client' ? a.professional : a.client;
            const tone = toneOf(a, viewerRole);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onOpen(a)}
                  className={`flex w-full items-center gap-3 rounded-xl border border-line p-2.5 text-left transition hover:border-brand-300 ${a.status === 'cancelled' ? 'opacity-60' : ''}`}
                >
                  <span className={`h-9 w-1 shrink-0 rounded-full ${DOTS[tone]}`} />
                  <span className="w-[74px] shrink-0 text-sm font-semibold">
                    {fmtTime(a.date)}
                    <span className="block text-xs font-normal text-ink-500">{fmtTime(a.end)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${a.status === 'cancelled' ? 'line-through' : ''}`}>{person ? displayName(person) : '—'}</span>
                    <span className="block truncate text-xs text-ink-500">{t(a.type)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

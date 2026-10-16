import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n/index.js';
import { addDaysKey, capitalize, displayName, fmtDayKey, fmtTime, minutesOfDay, minutesToTime, todayKey } from '../../lib/format.js';
import { layoutLanes, slotOf, SLOT_MIN, toneOf, TONES } from './agendaUtils.js';

const HOUR_PX = 56; // altezza di un'ora nella griglia
const PX = HOUR_PX / 60;

/** Ora attuale (aggiornata ogni minuto) per la linea "adesso". */
function useNowMinutes() {
  const [now, setNow] = useState(() => minutesOfDay(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(minutesOfDay(new Date())), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Vista a griglia oraria: 7 giorni da computer, un giorno alla volta su smartphone.
 * days: giorni da mostrare; onSlot(day, time) quando si clicca uno spazio libero (solo professionisti).
 */
export function WeekView({ days, appointments, viewerRole, hours, onOpen, onSlot, showCancelled }) {
  const scrollRef = useRef(null);
  const nowMin = useNowMinutes();
  const today = todayKey();

  const items = useMemo(
    () => appointments.filter((a) => showCancelled || a.status !== 'cancelled').map((a) => ({ ...a, ...slotOf(a) })),
    [appointments, showCancelled],
  );

  // Fascia oraria mostrata: orario di lavoro (o 8–20) allargato agli appuntamenti fuori orario
  const inView = items.filter((a) => days.includes(a.day));
  const firstHour = Math.max(0, Math.min(hours ? Math.floor(hours.start / 60) : 8, ...inView.map((a) => Math.floor(a.startMin / 60))) - 1);
  const lastHour = Math.min(24, Math.max(hours ? Math.ceil(hours.end / 60) : 20, ...inView.map((a) => Math.ceil(a.endMin / 60))) + 1);
  const total = (lastHour - firstHour) * 60;
  const hoursList = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);

  // All'apertura la griglia scorre vicino all'ora attuale (o all'inizio della giornata)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = days.includes(today) ? nowMin - 90 : (hours?.start ?? 9 * 60) - 30;
    el.scrollTop = Math.max(0, (target - firstHour * 60) * PX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days[0]]);

  const lanesByDay = useMemo(() => {
    const map = new Map();
    for (const day of days) map.set(day, layoutLanes(items.filter((a) => a.day === day)));
    return map;
  }, [items, days]);

  function handleColumnClick(e, day) {
    if (!onSlot || e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = firstHour * 60 + Math.floor((e.clientY - rect.top) / PX / SLOT_MIN) * SLOT_MIN;
    onSlot(day, minutesToTime(Math.min(minutes, 22 * 60)));
  }

  const isWorking = (day, m) => {
    if (!hours) return true;
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay() || 7;
    return hours.days.includes(weekday) && m >= hours.start && m < hours.end;
  };

  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Intestazione con i giorni (con un giorno solo la mostra già la striscia sopra) */}
      <div className={`grid border-b border-line bg-surface ${days.length === 1 ? 'hidden' : ''}`} style={{ gridTemplateColumns: cols }}>
        <span />
        {days.map((day) => {
          const isToday = day === today;
          const count = items.filter((a) => a.day === day && a.status === 'scheduled').length;
          return (
            <div key={day} className="flex flex-col items-center gap-0.5 border-l border-line py-2.5">
              <span className={`text-[11px] font-semibold tracking-wide uppercase ${isToday ? 'text-brand-700' : 'text-ink-400'}`}>
                {fmtDayKey(day, { weekday: 'short' }).replace('.', '')}
              </span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full font-display text-lg font-semibold ${
                  isToday ? 'bg-primary text-white' : 'text-ink-900'
                }`}
              >
                {Number(day.slice(8))}
              </span>
              <span className="h-3.5 text-[10px] text-ink-400">{count > 0 ? t('{n} app.', { n: count }) : ''}</span>
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="relative max-h-[min(68vh,720px)] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: cols, height: total * PX }}>
          {/* Colonna delle ore */}
          <div className="relative">
            {hoursList.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-400" style={{ top: (h - firstHour) * HOUR_PX }}>
                {h > firstHour ? `${String(h).padStart(2, '0')}:00` : ''}
              </span>
            ))}
          </div>

          {days.map((day) => {
            const lanes = lanesByDay.get(day);
            const dayItems = items.filter((a) => a.day === day);
            const clickable = onSlot && day >= today;
            return (
              <div
                key={day}
                className={`relative border-l border-line ${clickable ? 'cursor-copy' : ''}`}
                onClick={(e) => clickable && handleColumnClick(e, day)}
                title={clickable ? t('Clicca uno spazio libero per fissare un appuntamento') : undefined}
              >
                {/* Ore non lavorative in grigio chiaro */}
                {hoursList.map((h) => (
                  <div
                    key={h}
                    className={`pointer-events-none absolute inset-x-0 border-t border-line/70 ${isWorking(day, h * 60) ? '' : 'bg-soft'}`}
                    style={{ top: (h - firstHour) * HOUR_PX, height: HOUR_PX }}
                  >
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line/50" />
                  </div>
                ))}

                {dayItems.map((a) => {
                  const { lane, lanes: count } = lanes.get(a.id) ?? { lane: 0, lanes: 1 };
                  const top = (a.startMin - firstHour * 60) * PX;
                  const height = Math.max(a.durationMin * PX, 24);
                  const tone = toneOf(a, viewerRole);
                  const person = viewerRole === 'client' ? a.professional : a.client;
                  const compact = height < 44;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onOpen(a)}
                      className={`absolute z-[1] overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left shadow-sm transition ${TONES[tone]}`}
                      style={{ top: top + 1, height: height - 2, left: `calc(${(lane / count) * 100}% + 2px)`, width: `calc(${100 / count}% - 4px)` }}
                      title={`${fmtTime(a.date)}–${fmtTime(a.end)} · ${person ? displayName(person) : ''} · ${t(a.type)}`}
                    >
                      <p className="truncate text-[11px] font-semibold opacity-80">
                        {fmtTime(a.date)}–{fmtTime(a.end)}
                        {compact && person ? ` · ${person.firstName}` : ''}
                      </p>
                      {!compact && <p className="truncate text-[13px] leading-tight font-semibold">{person ? displayName(person) : '—'}</p>}
                      {height >= 64 && <p className="truncate text-[11px] opacity-75">{t(a.type)}</p>}
                    </button>
                  );
                })}

                {/* Linea "adesso" */}
                {day === today && nowMin >= firstHour * 60 && nowMin <= lastHour * 60 && (
                  <div className="pointer-events-none absolute inset-x-0 z-[2]" style={{ top: (nowMin - firstHour * 60) * PX }}>
                    <div className="relative h-0.5 bg-rose-500">
                      <span className="absolute -top-[5px] -left-[5px] h-3 w-3 rounded-full bg-rose-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Striscia dei 7 giorni per scegliere il giorno su smartphone. */
export function DayStrip({ weekStart, selected, onSelect, appointments }) {
  const today = todayKey();
  return (
    <div className="grid grid-cols-7 gap-1 rounded-2xl border border-line bg-surface p-1.5">
      {Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i)).map((day) => {
        const active = day === selected;
        const count = appointments.filter((a) => a.day === day && a.status === 'scheduled').length;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            aria-pressed={active}
            aria-label={capitalize(fmtDayKey(day, { weekday: 'long', day: 'numeric', month: 'long' }))}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${active ? 'bg-primary text-white' : 'hover:bg-hover'}`}
          >
            <span className={`text-[10px] font-semibold uppercase ${active ? 'text-white/80' : day === today ? 'text-brand-700' : 'text-ink-400'}`}>
              {fmtDayKey(day, { weekday: 'short' }).replace('.', '').slice(0, 3)}
            </span>
            <span className="font-display text-base font-semibold">{Number(day.slice(8))}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${count ? (active ? 'bg-white' : 'bg-brand-500') : 'bg-transparent'}`} />
          </button>
        );
      })}
    </div>
  );
}

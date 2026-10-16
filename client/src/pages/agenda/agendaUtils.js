import { localized } from '../../i18n/index.js';
import { addDaysKey, dayKeyOf, minutesOfDay, minutesToTime, timeToMinutes, todayKey } from '../../lib/format.js';

// Calcoli condivisi dalle viste dell'agenda.

export const SLOT_MIN = 15; // gli orari si scelgono a passi di 15 minuti
export const DAY_START = 6 * 60; // primo orario selezionabile (06:00)
export const DAY_END = 23 * 60; // ultimo orario di fine (23:00)

export const APPOINTMENT_TYPES = {
  nutritionist: ['Check-up nutrizionale', 'Controllo piano', 'Prima visita', 'Valutazione progressi'],
  trainer: ['Sessione personal training', 'Valutazione funzionale', 'Forza • Upper Body', 'Forza • Lower Body', 'Cardio e mobilità'],
};
export const LOCATIONS = {
  nutritionist: ['Studio', 'Videochiamata'],
  trainer: ['Palestra Wellsyn', 'Online', "All'aperto"],
};
export const DURATIONS = [30, 45, 60, 90];

export const STATUS_META = {
  scheduled: localized({ label: 'In programma' }),
  done: localized({ label: 'Svolto' }),
  cancelled: localized({ label: 'Annullato' }),
};

/** Inizio/fine di un appuntamento in minuti dalla mezzanotte e giorno di calendario. */
export function slotOf(a) {
  const startMin = minutesOfDay(a.date);
  return { day: a.day ?? dayKeyOf(a.date), startMin, endMin: startMin + a.durationMin };
}

export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

/** Orari "HH:MM" a passi di 15 minuti tra from e to (in minuti). */
export function timeOptions(from = DAY_START, to = DAY_END) {
  const list = [];
  for (let m = from; m <= to; m += SLOT_MIN) list.push(minutesToTime(m));
  return list;
}

/** Arrotonda in avanti al quarto d'ora. */
export const ceilSlot = (min) => Math.ceil(min / SLOT_MIN) * SLOT_MIN;

/**
 * Primo orario libero di un giorno per una certa durata.
 * busy: [{ start, end }] in minuti; hours: orario di lavoro { start, end } in minuti.
 */
export function firstFreeSlot({ day, duration, busy, hours }) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay() || 7;
  if (hours && !hours.days.includes(weekday)) return null; // giorno non lavorativo
  const now = day === todayKey() ? ceilSlot(minutesOfDay(new Date())) : 0;
  const from = Math.max(hours?.start ?? 9 * 60, now, DAY_START);
  const to = Math.min(hours?.end ?? 19 * 60, DAY_END);
  for (let m = from; m + duration <= to; m += SLOT_MIN) {
    if (!busy.some((b) => overlaps(m, m + duration, b.start, b.end))) return m;
  }
  return null;
}

/** Orario di lavoro del professionista in minuti (o null se non impostato). */
export function workingHoursOf(user) {
  const wh = user?.workingHours;
  if (!wh?.start || !wh?.end) return null;
  return { days: wh.days?.length ? wh.days : [1, 2, 3, 4, 5], start: timeToMinutes(wh.start), end: timeToMinutes(wh.end) };
}

/**
 * Disposizione degli appuntamenti sovrapposti nella vista settimanale:
 * restituisce per ogni appuntamento la "corsia" e quante corsie ha il suo gruppo.
 */
export function layoutLanes(appointments) {
  const items = appointments.map((a) => ({ id: a.id, start: a.startMin, end: a.endMin }));
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const result = new Map();
  let group = [];
  let groupEnd = -1;
  const flush = () => {
    const lanes = [];
    for (const it of group) {
      let lane = lanes.findIndex((end) => end <= it.start);
      if (lane === -1) lane = lanes.length;
      lanes[lane] = it.end;
      result.set(it.id, { lane, lanes: 0 });
    }
    for (const it of group) result.get(it.id).lanes = lanes.length;
  };
  for (const it of sorted) {
    if (it.start >= groupEnd && group.length) {
      flush();
      group = [];
    }
    group.push(it);
    groupEnd = Math.max(groupEnd, it.end);
  }
  if (group.length) flush();
  return result;
}

/** Giorni visibili nella griglia del mese (6 settimane da lunedì). */
export function monthGrid(anchor) {
  const first = `${anchor.slice(0, 7)}-01`;
  const w = new Date(`${first}T12:00:00Z`).getUTCDay();
  const start = addDaysKey(first, w === 0 ? -6 : 1 - w);
  return Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));
}

export const shiftMonthKey = (key, n) => {
  const d = new Date(`${key.slice(0, 7)}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

/** Colori per tipo di professionista (vista cliente) o per stato. */
export function toneOf(a, viewerRole) {
  if (a.status === 'cancelled') return 'cancelled';
  if (a.status === 'done') return 'done';
  if (viewerRole === 'client') return a.professional?.role === 'trainer' ? 'iris' : 'brand';
  return 'brand';
}

export const TONES = {
  brand: 'border-brand-500 bg-brand-50 text-brand-900 hover:bg-brand-100',
  iris: 'border-iris-500 bg-iris-50 text-iris-900 hover:bg-iris-100',
  done: 'border-ink-300 bg-muted text-ink-700 hover:bg-track',
  cancelled: 'border-ink-300 bg-soft text-ink-500 line-through opacity-70 hover:opacity-100',
};
export const DOTS = {
  brand: 'bg-brand-500',
  iris: 'bg-iris-500',
  done: 'bg-ink-400',
  cancelled: 'bg-ink-300',
};

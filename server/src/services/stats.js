import { addDays, dayKey, weekdayOf, weekStart } from '../utils/dates.js';

/** Quanti allenamenti erano previsti e quanti sono stati svolti tra due giorni (inclusi). */
export function adherence(logs, plannedDays, fromKey, toKey) {
  const planned = new Set(plannedDays);
  let expected = 0;
  for (let d = fromKey; d <= toKey; d = addDays(d, 1)) {
    if (planned.has(weekdayOf(d))) expected += 1;
  }
  const completed = logs.filter((l) => l.completed && l.day >= fromKey && l.day <= toKey).length;
  return { completed: Math.min(completed, expected), planned: expected };
}

export const percent = ({ completed, planned }) => (planned ? Math.round((completed / planned) * 100) : 0);

/**
 * Costanza settimanale (lunedì-domenica) sommata su uno o più clienti.
 * entries: [{ logs, plannedDays }]. Per la settimana in corso conta solo i giorni già passati.
 */
export function weeklyConsistency(entries, { weeks = 52, today = dayKey() } = {}) {
  const firstLog = entries
    .flatMap((e) => e.logs)
    .reduce((min, l) => (min && min < l.day ? min : l.day), null);
  const current = weekStart(today);
  const out = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const from = addDays(current, -7 * i);
    const to = i === 0 ? today : addDays(from, 6);
    if (!firstLog || to < firstLog) continue;
    let completed = 0;
    let planned = 0;
    for (const e of entries) {
      const a = adherence(e.logs, e.plannedDays, from, to);
      completed += a.completed;
      planned += a.planned;
    }
    out.push({ week: from, completed, planned });
  }
  return out;
}

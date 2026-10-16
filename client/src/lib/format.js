import { locale, localized, t } from '../i18n/index.js';

const TZ = 'Europe/Rome';

// Etichette dei ruoli (tradotte nella lingua attiva quando vengono lette).
export const ROLE_LABELS = localized({
  client: 'Cliente',
  nutritionist: 'Nutrizionista',
  trainer: 'Personal Trainer',
});

const number = (digits) =>
  new Intl.NumberFormat(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtNumber = (n, digits = 1) => (n == null ? '—' : number(digits).format(n));

/** Numero con segno, es. "+0,8" oppure "-1,8". */
export const fmtSigned = (n, digits = 1) => {
  if (n == null) return '—';
  const abs = number(digits).format(Math.abs(n));
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${abs}`;
};

export const fmtDate = (date, options = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat(locale(), { timeZone: TZ, ...options }).format(new Date(date));

export const fmtTime = (date) =>
  new Intl.DateTimeFormat(locale(), { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(date));

/** Data di calendario "YYYY-MM-DD" (senza fuso orario). */
export const fmtDayKey = (key, options = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat(locale(), { timeZone: 'UTC', ...options }).format(new Date(`${key}T12:00:00Z`));

export const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );

/** Sposta una data "YYYY-MM-DD" di n giorni. */
export function addDaysKey(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lunedì della settimana di una data "YYYY-MM-DD". */
export function weekStartKey(key) {
  const w = new Date(`${key}T12:00:00Z`).getUTCDay();
  return addDaysKey(key, w === 0 ? -6 : 1 - w);
}

/** Giorno di calendario (fuso italiano) di un istante. */
export const dayKeyOf = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));

/** Minuti dalla mezzanotte (fuso italiano) di un istante, es. 10:30 → 630. */
export function minutesOfDay(date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(date));
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get('hour') * 60 + get('minute');
}

/** "HH:MM" ↔ minuti dalla mezzanotte. */
export const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
export const minutesToTime = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Durata leggibile: 45 → "45 min", 90 → "1 h 30 min". */
export function fmtDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const dayDiff = (fromKey, toKey) => Math.round((new Date(toKey) - new Date(fromKey)) / 86400000);

/** "Oggi", "Ieri", "3 giorni fa"... */
export function relativeDay(key) {
  if (!key) return '—';
  const diff = dayDiff(key, todayKey());
  if (diff <= 0) return t('Oggi');
  if (diff === 1) return t('Ieri');
  if (diff < 7) return t('{n} giorni fa', { n: diff });
  return fmtDayKey(key);
}

export function relativeTime(date) {
  const key = todayKey();
  const d = new Date(date);
  const dKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
  if (dKey === key) return fmtTime(d);
  if (dayDiff(dKey, key) === 1) return t('Ieri');
  return fmtDate(d, { day: 'numeric', month: 'short' });
}

export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  if (hour < 13) return t('Buongiorno');
  if (hour < 18) return t('Buon pomeriggio');
  return t('Buonasera');
}

export const displayName = (u) => (u ? [u.title, u.firstName, u.lastName].filter(Boolean).join(' ') : '');


// Le date "di calendario" (oggi, settimana, ecc.) sono calcolate sul fuso orario
// italiano, così il server su Vercel (che gira in UTC) non sbaglia giorno a mezzanotte.
export const TZ = 'Europe/Rome';
const DAY_MS = 24 * 60 * 60 * 1000;

const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Giorno di calendario nel formato "YYYY-MM-DD". */
export const dayKey = (date = new Date()) => keyFormatter.format(date);

const keyToUTC = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const addDays = (key, n) => {
  const dt = keyToUTC(key);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
};

/** 1 = lunedì ... 7 = domenica */
export const weekdayOf = (key) => {
  const w = keyToUTC(key).getUTCDay();
  return w === 0 ? 7 : w;
};

export const weekStart = (key) => addDays(key, 1 - weekdayOf(key));

export const daysBetween = (fromKey, toKey) => Math.round((keyToUTC(toKey) - keyToUTC(fromKey)) / DAY_MS);

/** Crea un istante preciso a partire da un giorno e un orario italiani. */
export function zonedDate(key, hours = 0, minutes = 0) {
  const [y, m, d] = key.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hours, minutes);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value]),
  );
  const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (shown - guess));
}

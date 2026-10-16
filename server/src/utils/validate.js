import { HttpError } from './httpError.js';

/** Valida i dati ricevuti con uno schema zod; in caso di errore risponde 400 con il primo messaggio. */
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? 'Dati non validi.');
  }
  return result.data;
}

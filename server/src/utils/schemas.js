import mongoose from 'mongoose';
import { z } from 'zod';

// Pezzi di validazione riutilizzati da più API.

export const objectId = (message = 'Identificativo non valido.') =>
  z.string({ error: message }).refine((v) => mongoose.isValidObjectId(v), message);

export const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida.');
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Orario non valido.');

/** Testo facoltativo: stringa vuota → undefined. */
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Massimo ${max} caratteri.`)
    .optional()
    .nullable()
    .transform((v) => v || undefined);

/** Numero facoltativo entro un intervallo (null/undefined = non indicato). */
export const optionalNumber = (min, max, label) =>
  z
    .number({ error: `${label}: inserisci un numero.` })
    .min(min, `${label}: valore troppo basso.`)
    .max(max, `${label}: valore troppo alto.`)
    .optional()
    .nullable()
    .transform((v) => (v == null ? undefined : v));

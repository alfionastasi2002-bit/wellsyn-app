import { describeDbError } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Risorsa non trovata.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Richiesta non valida.' });
  if (err?.name === 'ValidationError') return res.status(400).json({ error: 'Dati non validi.' });
  if (err?.name === 'CastError') return res.status(400).json({ error: 'Identificativo non valido.' });
  if (err?.code === 11000) return res.status(409).json({ error: 'Elemento già esistente.' });

  const dbHint = describeDbError(err);
  if (dbHint) {
    console.error('[database]', err.message);
    return res.status(503).json({ error: `Database non raggiungibile. ${dbHint}` });
  }

  console.error(err);
  const configError = /^JWT_SECRET/.test(err?.message ?? '');
  res.status(500).json({ error: configError ? err.message : 'Si è verificato un errore imprevisto.' });
}

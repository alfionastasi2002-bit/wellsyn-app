import { translateMessage } from '../i18n/index.js';

export const UNAUTHORIZED_EVENT = 'wellsyn:unauthorized';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Chiama le API del backend. Il cookie di sessione viene inviato automaticamente dal browser. */
export async function api(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, translateMessage('Impossibile contattare il server. Controlla la connessione.'));
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const fallback =
      res.status >= 500 ? 'Il server non risponde in questo momento. Riprova tra qualche istante.' : 'Si è verificato un errore. Riprova.';
    // I messaggi del server sono in italiano: qui vengono tradotti nella lingua scelta.
    throw new ApiError(res.status, translateMessage(data?.error ?? fallback));
  }
  return data;
}

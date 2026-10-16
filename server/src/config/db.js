import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

// Su Vercel ogni richiesta può riusare la stessa istanza della funzione:
// teniamo la connessione in una variabile globale per non riaprirla ogni volta.
const cache = (globalThis.__wellsynMongo ??= { conn: null, promise: null });

export async function connectDB(uri = env.mongoUri) {
  if (cache.conn) return cache.conn;
  if (!uri) {
    throw new Error('MONGODB_URI non configurata: aggiungi la stringa di connessione di MongoDB Atlas.');
  }
  cache.promise ??= mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

/** Traduce gli errori di connessione più comuni in un suggerimento comprensibile. */
export function describeDbError(err) {
  const text = `${err?.name ?? ''} ${err?.message ?? ''}`;
  if (/MONGODB_URI/.test(text)) return 'MONGODB_URI non configurata.';
  if (/bad auth|Authentication failed/i.test(text)) return 'Username o password del database non corretti (controlla Database Access su Atlas).';
  if (/querySrv|ENOTFOUND|Invalid scheme|URI/i.test(text)) return 'Indirizzo del database non valido: ricopia la stringa di connessione da Atlas.';
  if (/ServerSelection|timed out|ECONNREFUSED|whitelist/i.test(text)) return 'Il database non risponde: su Atlas, in Network Access, consenti l\'accesso da 0.0.0.0/0.';
  return null;
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// In locale le variabili arrivano dal file .env nella cartella principale.
// Su Vercel invece si impostano dal pannello (Settings > Environment Variables).
const rootEnvFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (fs.existsSync(rootEnvFile)) process.loadEnvFile(rootEnvFile);

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  isProd,
  mongoUri: process.env.MONGODB_URI?.trim() ?? '',
  port: Number(process.env.API_PORT) || 5000,
};

const DEV_JWT_SECRET = 'wellsyn-dev-secret-solo-per-uso-locale';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (isProd) throw new Error('JWT_SECRET non configurata: aggiungila nelle Environment Variables di Vercel.');
  return DEV_JWT_SECRET;
}

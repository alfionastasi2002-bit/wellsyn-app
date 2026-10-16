import jwt from 'jsonwebtoken';
import { env, getJwtSecret } from '../config/env.js';
import { User } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';

export const AUTH_COOKIE = 'wellsyn_session';

const HOUR_MS = 60 * 60 * 1000;
const cookieOptions = () => ({ httpOnly: true, sameSite: 'lax', secure: env.isProd, path: '/' });

// Il token di accesso viaggia in un cookie "httpOnly": il browser lo invia da solo
// e il codice JavaScript della pagina non può leggerlo (più sicuro contro furti di sessione).
export function setAuthCookie(res, user, remember = false) {
  const maxAgeMs = remember ? 30 * 24 * HOUR_MS : 12 * HOUR_MS;
  const token = jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), {
    expiresIn: Math.floor(maxAgeMs / 1000),
  });
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), ...(remember && { maxAge: maxAgeMs }) });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
}

export async function requireAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) throw new HttpError(401, 'Accedi per continuare.');

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    throw new HttpError(401, 'Sessione scaduta: accedi di nuovo.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account non trovato.');
  req.user = user;
  next();
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new HttpError(403, 'Non hai i permessi per accedere a questa sezione.');
    }
    next();
  };

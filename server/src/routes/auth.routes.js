import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { clearAuthCookie, requireAuth, setAuthCookie } from '../middleware/auth.js';
import { ROLES, User } from '../models/index.js';
import { HttpError } from '../utils/httpError.js';
import { optionalNumber, optionalText } from '../utils/schemas.js';
import { parse } from '../utils/validate.js';

const router = Router();

const ROLE_LABELS = { client: 'Cliente', nutritionist: 'Nutrizionista', trainer: 'Personal Trainer' };

// Limita i tentativi di accesso per rallentare chi prova a indovinare le password.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Troppi tentativi: riprova tra qualche minuto.' },
});

const email = z
  .string({ error: "Inserisci l'email." })
  .trim()
  .toLowerCase()
  .pipe(z.email('Inserisci un indirizzo email valido.'));

const registerSchema = z.object({
  firstName: z.string({ error: 'Inserisci il nome.' }).trim().min(1, 'Inserisci il nome.').max(60),
  lastName: z.string({ error: 'Inserisci il cognome.' }).trim().min(1, 'Inserisci il cognome.').max(60),
  email,
  password: z
    .string({ error: 'Inserisci una password.' })
    .min(8, 'La password deve avere almeno 8 caratteri.')
    .max(128, 'La password è troppo lunga.'),
  role: z.enum(ROLES, { error: 'Seleziona il tuo profilo.' }),
  specialization: z.string().trim().max(80).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string({ error: 'Inserisci la password.' }).min(1, 'Inserisci la password.'),
  role: z.enum(ROLES).optional(),
  remember: z.boolean().optional(),
});

router.post('/register', authLimiter, async (req, res) => {
  const data = parse(registerSchema, req.body);
  if (await User.exists({ email: data.email })) {
    throw new HttpError(409, 'Esiste già un account con questa email.');
  }

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    specialization: data.role === 'client' ? undefined : data.specialization || ROLE_LABELS[data.role],
    passwordHash: await bcrypt.hash(data.password, 12),
  });

  setAuthCookie(res, user, true);
  res.status(201).json({ user });
});

router.post('/login', authLimiter, async (req, res) => {
  const { email: userEmail, password, role, remember } = parse(loginSchema, req.body);
  const user = await User.findOne({ email: userEmail }).select('+passwordHash');
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new HttpError(401, 'Email o password non corretti.');

  if (role && user.role !== role) {
    throw new HttpError(
      403,
      `Questo account è registrato come ${ROLE_LABELS[user.role]}: seleziona la scheda corretta.`,
    );
  }

  setAuthCookie(res, user, remember);
  res.json({ user });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const name = (label) => z.string({ error: 'Inserisci ' + label + '.' }).trim().min(1, 'Inserisci ' + label + '.').max(60);
const PROFILE_FIELDS = {
  common: { firstName: name('il nome'), lastName: name('il cognome'), phone: optionalText(30) },
  professional: { title: optionalText(20), specialization: optionalText(80), bio: optionalText(280) },
  client: {
    goal: optionalText(140),
    heightCm: optionalNumber(100, 250, 'Altezza'),
    startWeightKg: optionalNumber(20, 400, 'Peso iniziale'),
  },
};

// Modifica del proprio profilo: si aggiornano solo i campi inviati (vuoto = cancella).
router.patch('/me', requireAuth, async (req, res) => {
  const user = req.user;
  const shape = {
    ...PROFILE_FIELDS.common,
    ...(user.role === 'client' ? PROFILE_FIELDS.client : PROFILE_FIELDS.professional),
  };
  const data = parse(z.object(shape).partial(), req.body);
  for (const key of Object.keys(shape)) {
    if (key in (req.body ?? {})) user.set(key, data[key]);
  }
  await user.save();
  res.json({ user });
});

const passwordSchema = z.object({
  currentPassword: z.string({ error: 'Inserisci la password attuale.' }).min(1, 'Inserisci la password attuale.'),
  newPassword: z
    .string({ error: 'Inserisci la nuova password.' })
    .min(8, 'La nuova password deve avere almeno 8 caratteri.')
    .max(128, 'La password è troppo lunga.'),
});

router.put('/password', requireAuth, authLimiter, async (req, res) => {
  const { currentPassword, newPassword } = parse(passwordSchema, req.body);
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'La password attuale non è corretta.');
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.status(204).end();
});

export default router;

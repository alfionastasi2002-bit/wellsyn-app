import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CareLink, CheckIn, MealPlan, User, WorkoutLog, WorkoutPlan } from '../models/index.js';
import { requireClientOf } from '../services/access.js';
import { adherence, weeklyConsistency } from '../services/stats.js';
import { addDays, dayKey } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';
import { serializeCheckIn } from './checkins.routes.js';
import { currentWeekOf } from './workoutPlans.routes.js';

// Gestione dei clienti da parte di nutrizionisti e personal trainer.
const router = Router();
router.use(requireAuth, requireRole('nutritionist', 'trainer'));

const addClientSchema = z.object({
  firstName: z.string({ error: 'Inserisci il nome.' }).trim().min(1, 'Inserisci il nome.').max(60),
  lastName: z.string({ error: 'Inserisci il cognome.' }).trim().min(1, 'Inserisci il cognome.').max(60),
  email: z
    .string({ error: "Inserisci l'email." })
    .trim()
    .toLowerCase()
    .pipe(z.email('Inserisci un indirizzo email valido.')),
  program: z.string().trim().max(60).optional(),
});

router.get('/', async (req, res) => {
  const me = req.user;
  const links = await CareLink.find({ professional: me._id, status: { $in: ['active', 'pending'] } })
    .sort({ createdAt: -1 })
    .populate('client')
    .lean();

  // Ultimo controllo visibile a questo professionista: i suoi e le pesate del cliente.
  const lastChecks = await CheckIn.aggregate([
    {
      $match: {
        client: { $in: links.map((l) => l.client._id) },
        $or: [{ professional: me._id }, { source: 'self' }],
      },
    },
    { $sort: { date: -1 } },
    { $group: { _id: '$client', date: { $first: '$date' }, weightKg: { $first: '$weightKg' } } },
  ]);
  const lastByClient = new Map(lastChecks.map((c) => [String(c._id), c]));

  res.json({
    clients: links.map((l) => ({
      linkId: String(l._id),
      status: l.status,
      sharedAccess: l.sharedAccess,
      program: l.program ?? null,
      since: l.createdAt,
      client: { ...publicUser(l.client), email: l.client.email },
      lastCheck: lastByClient.get(String(l.client._id)) ?? null,
    })),
  });
});

// Riepilogo per le liste di clienti (Progressi, Attività fisica, Check nutrizionali).
// Ogni dato rispetta il consenso: le informazioni degli altri professionisti solo con la condivisione attiva.
router.get('/overview', async (req, res) => {
  const me = req.user;
  const today = dayKey();
  const from28 = addDays(today, -27);
  const links = await CareLink.find({ professional: me._id, status: 'active' }).sort({ createdAt: -1 }).populate('client').lean();
  const ids = links.map((l) => l.client._id);
  const sharedIds = new Set(links.filter((l) => l.sharedAccess).map((l) => String(l.client._id)));
  const workoutVisible = (id) => me.role === 'trainer' || sharedIds.has(id);

  const [checkins, workoutPlans, logs] = await Promise.all([
    CheckIn.find({ client: { $in: ids }, date: { $gte: new Date(Date.now() - 366 * 86400000) } }).sort({ date: 1 }).lean(),
    WorkoutPlan.find({ client: { $in: ids }, status: 'active', ...(me.role === 'trainer' && { trainer: me._id }) })
      .sort({ updatedAt: -1 })
      .lean(),
    WorkoutLog.find({ client: { $in: ids }, day: { $gte: addDays(today, -60) } }).lean(),
  ]);

  const visibleCheck = (c, id) =>
    String(c.professional) === String(me._id) || c.source === 'self' || (sharedIds.has(id) && c.source !== 'self');

  res.json({
    clients: links.map((l) => {
      const id = String(l.client._id);
      const own = checkins.filter((c) => String(c.client) === id && visibleCheck(c, id));
      const weights = own.filter((c) => c.weightKg != null);
      const nutritionChecks = sharedIds.has(id) || me.role === 'nutritionist'
        ? own.filter((c) => c.source === 'nutritionist')
        : [];
      let workout = null;
      if (workoutVisible(id)) {
        const plan = workoutPlans.find((p) => String(p.client) === id);
        const clientLogs = logs.filter((x) => String(x.client) === id);
        const plannedDays = (plan?.sessions ?? []).map((s) => s.dayOfWeek).filter(Boolean);
        const lastDay = clientLogs.filter((x) => x.completed).reduce((max, x) => (x.day > max ? x.day : max), '');
        workout = {
          planTitle: plan?.title ?? null,
          sessionsPerWeek: plannedDays.length,
          last28: adherence(clientLogs, plannedDays, from28, today),
          lastWorkout: lastDay || null,
        };
      }
      return {
        linkId: String(l._id),
        client: publicUser(l.client),
        program: l.program ?? null,
        sharedAccess: l.sharedAccess,
        weight: weights.length
          ? {
              current: weights.at(-1).weightKg,
              day: dayKey(weights.at(-1).date),
              first: weights[0].weightKg,
            }
          : null,
        lastCheck: own.length ? dayKey(own.at(-1).date) : null,
        workout,
        nutrition: nutritionChecks.length
          ? { count: nutritionChecks.length, lastDay: dayKey(nutritionChecks.at(-1).date) }
          : null,
      };
    }),
  });
});

// Progressi di un cliente, filtrati in base a cosa può vedere questo professionista:
// sempre i propri controlli e le pesate del cliente; i dati degli altri professionisti
// (controlli o allenamenti) solo se il cliente ha autorizzato la condivisione.
router.get('/:clientId/progress', async (req, res) => {
  const me = req.user;
  const link = await requireClientOf(me, req.params.clientId);
  const clientId = link.client;
  const shared = link.sharedAccess;
  const today = dayKey();

  const checkFilter = { client: clientId, $or: [{ professional: me._id }, { source: 'self' }] };
  if (shared) checkFilter.$or.push({ source: { $in: ['nutritionist', 'trainer'] } });

  const workoutVisible = me.role === 'trainer' || shared;
  const [client, checkins, workoutPlan, logs, mealPlan] = await Promise.all([
    User.findById(clientId).lean(),
    CheckIn.find(checkFilter).sort({ date: 1 }).populate('professional').lean(),
    workoutVisible
      ? WorkoutPlan.findOne({ client: clientId, status: 'active', ...(me.role === 'trainer' && { trainer: me._id }) })
          .sort({ updatedAt: -1 })
          .lean()
      : null,
    workoutVisible ? WorkoutLog.find({ client: clientId, day: { $gte: addDays(today, -371) } }).sort({ day: -1 }).lean() : [],
    me.role === 'nutritionist' || shared
      ? MealPlan.findOne({ client: clientId, status: 'active', ...(me.role === 'nutritionist' && { nutritionist: me._id }) })
          .sort({ updatedAt: -1 })
          .lean()
      : null,
  ]);

  const plannedDays = (workoutPlan?.sessions ?? []).map((s) => s.dayOfWeek).filter(Boolean);
  const from28 = addDays(today, -27);

  res.json({
    client: {
      ...publicUser(client),
      email: client.email,
      goal: client.goal ?? null,
      heightCm: client.heightCm ?? null,
      startWeightKg: client.startWeightKg ?? null,
    },
    link: { id: String(link._id), program: link.program ?? null, sharedAccess: shared, since: link.createdAt },
    checkins: checkins.map(serializeCheckIn),
    workout: workoutVisible
      ? {
          plan: workoutPlan && {
            id: String(workoutPlan._id),
            title: workoutPlan.title,
            level: workoutPlan.level,
            weeks: workoutPlan.weeks,
            currentWeek: currentWeekOf(workoutPlan, today),
            sessions: workoutPlan.sessions.map((s) => ({ name: s.name, dayOfWeek: s.dayOfWeek ?? null })),
          },
          consistency: weeklyConsistency([{ logs, plannedDays }], { today, weeks: 52 }),
          last28: adherence(logs, plannedDays, from28, today),
          days: Array.from({ length: 28 }, (_, i) => {
            const day = addDays(from28, i);
            return { day, on: logs.some((l) => l.day === day && l.completed) };
          }),
          history: logs
            .filter((l) => l.completed)
            .slice(0, 20)
            .map((l) => ({ day: l.day, sessionName: l.sessionName ?? null })),
        }
      : null,
    mealPlan: mealPlan && {
      id: String(mealPlan._id),
      title: mealPlan.title,
      kcalTarget: mealPlan.kcalTarget ?? null,
      goal: mealPlan.goal ?? null,
    },
  });
});

router.post('/', async (req, res) => {
  const me = req.user;
  const data = parse(addClientSchema, req.body);
  const existing = await User.findOne({ email: data.email });

  // Cliente già registrato: gli inviamo una richiesta che dovrà accettare.
  if (existing) {
    if (existing.role !== 'client') throw new HttpError(409, 'Questa email appartiene a un account professionista.');
    const link = await CareLink.findOne({ client: existing._id, professional: me._id });
    if (link && link.status !== 'revoked') throw new HttpError(409, 'Questo cliente è già nella tua lista.');
    if (link) {
      Object.assign(link, { status: 'pending', sharedAccess: false, program: data.program ?? link.program });
      await link.save();
    } else {
      await CareLink.create({
        client: existing._id,
        professional: me._id,
        professionalRole: me.role,
        status: 'pending',
        program: data.program,
      });
    }
    return res.status(201).json({
      status: 'pending',
      message: `Richiesta inviata a ${existing.firstName}: la vedrà nella sezione Professionisti e potrà accettarla.`,
    });
  }

  // Cliente nuovo: creiamo l'account con una password temporanea da comunicargli.
  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const client = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: 'client',
    passwordHash: await bcrypt.hash(tempPassword, 12),
  });
  await CareLink.create({
    client: client._id,
    professional: me._id,
    professionalRole: me.role,
    status: 'active',
    program: data.program,
  });
  res.status(201).json({
    status: 'active',
    tempPassword,
    message: `Account creato per ${client.firstName}. Comunicagli email e password temporanea.`,
  });
});

router.delete('/:linkId', async (req, res) => {
  const link = await CareLink.findOne({ _id: req.params.linkId, professional: req.user._id });
  if (!link) throw new HttpError(404, 'Cliente non trovato.');
  Object.assign(link, { status: 'revoked', sharedAccess: false });
  await link.save();
  res.status(204).end();
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CareLink, CheckIn, MEAL_TYPES, MealLog, MealPlan, Message, WorkoutLog, WorkoutPlan } from '../models/index.js';
import { adherence, weeklyConsistency } from '../services/stats.js';
import { addDays, dayKey, weekdayOf, weekStart, zonedDate } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { dayKeySchema, optionalNumber } from '../utils/schemas.js';
import { publicUser } from '../utils/serialize.js';
import { parse } from '../utils/validate.js';
import { serializeCheckIn } from './checkins.routes.js';
import { currentWeekOf } from './workoutPlans.routes.js';

const router = Router();
router.use(requireAuth);

// Contatori per i badge del menu laterale.
router.get('/summary', async (req, res) => {
  const me = req.user;
  const linkFilter = me.role === 'client' ? { client: me._id } : { professional: me._id };
  const [unreadMessages, pendingRequests] = await Promise.all([
    Message.countDocuments({ to: me._id, readAt: null }),
    CareLink.countDocuments({ ...linkFilter, status: 'pending' }),
  ]);
  res.json({ unreadMessages, pendingRequests });
});

// Il cliente segna come completato (o no) l'allenamento di oggi.
router.put('/workouts/today', requireRole('client'), async (req, res) => {
  const { completed } = parse(z.object({ completed: z.boolean() }), req.body);
  const me = req.user;
  const today = dayKey();

  if (completed) {
    const plan = await WorkoutPlan.findOne({ client: me._id, status: 'active' }).sort({ updatedAt: -1 }).lean();
    const session = plan?.sessions.find((s) => s.dayOfWeek === weekdayOf(today));
    await WorkoutLog.updateOne(
      { client: me._id, day: today },
      { $set: { completed: true, plan: plan?._id, sessionName: session?.name ?? 'Allenamento extra' } },
      { upsert: true },
    );
  } else {
    await WorkoutLog.deleteOne({ client: me._id, day: today });
  }
  res.json({ completed });
});

// Il cliente spunta un pasto di oggi.
router.put('/meals/today', requireRole('client'), async (req, res) => {
  const { mealType, done } = parse(
    z.object({ mealType: z.enum(MEAL_TYPES, { error: 'Pasto non valido.' }), done: z.boolean() }),
    req.body,
  );
  const me = req.user;
  const today = dayKey();

  if (done) {
    const plan = await MealPlan.findOne({ client: me._id, status: 'active' }).sort({ updatedAt: -1 }).lean();
    await MealLog.updateOne(
      { client: me._id, day: today, mealType },
      { $set: { done: true, plan: plan?._id } },
      { upsert: true },
    );
  } else {
    await MealLog.deleteOne({ client: me._id, day: today, mealType });
  }
  res.json({ mealType, done });
});

// Pagine del cliente

// Piano alimentare attivo, completo di tutti i giorni
router.get('/meal-plan', requireRole('client'), async (req, res) => {
  const me = req.user;
  const today = dayKey();
  const [plan, logs] = await Promise.all([
    MealPlan.findOne({ client: me._id, status: 'active' }).sort({ updatedAt: -1 }).populate('nutritionist').lean(),
    MealLog.find({ client: me._id, day: today, done: true }).lean(),
  ]);
  res.json({
    plan: plan && {
      id: String(plan._id),
      title: plan.title,
      goal: plan.goal ?? null,
      kcalTarget: plan.kcalTarget ?? null,
      guidelines: plan.guidelines ?? '',
      updatedAt: plan.updatedAt,
      days: plan.days ?? [],
      nutritionist: publicUser(plan.nutritionist),
    },
    todayIndex: weekdayOf(today),
    todayDone: logs.map((l) => l.mealType),
  });
});

// Scheda di allenamento attiva + settimana in corso + storico
router.get('/workout-plan', requireRole('client'), async (req, res) => {
  const me = req.user;
  const today = dayKey();
  const [plan, logs] = await Promise.all([
    WorkoutPlan.findOne({ client: me._id, status: 'active' }).sort({ updatedAt: -1 }).populate('trainer').lean(),
    WorkoutLog.find({ client: me._id, day: { $gte: addDays(today, -371) } }).sort({ day: -1 }).lean(),
  ]);
  const sessions = plan?.sessions ?? [];
  const plannedDays = sessions.map((s) => s.dayOfWeek).filter(Boolean);
  const monday = weekStart(today);

  res.json({
    plan: plan && {
      id: String(plan._id),
      title: plan.title,
      level: plan.level,
      weeks: plan.weeks,
      currentWeek: currentWeekOf(plan, today),
      trainer: publicUser(plan.trainer),
      sessions: sessions.map((s) => ({ ...s, id: String(s._id), _id: undefined })),
    },
    today,
    todayWeekday: weekdayOf(today),
    completedToday: logs.some((l) => l.day === today && l.completed),
    week: {
      ...adherence(logs, plannedDays, monday, addDays(monday, 6)),
      days: Array.from({ length: 7 }, (_, i) => {
        const day = addDays(monday, i);
        return {
          day,
          weekday: i + 1,
          session: sessions.find((s) => s.dayOfWeek === i + 1)?.name ?? null,
          completed: logs.some((l) => l.day === day && l.completed),
        };
      }),
    },
    consistency: weeklyConsistency([{ logs, plannedDays }], { today, weeks: 26 }),
    history: logs.filter((l) => l.completed).slice(0, 30).map((l) => ({ day: l.day, sessionName: l.sessionName ?? null })),
  });
});

// Tutte le misurazioni del cliente (sue e dei professionisti)
router.get('/checkins', requireRole('client'), async (req, res) => {
  const me = req.user;
  const checkins = await CheckIn.find({ client: me._id }).sort({ date: 1 }).populate('professional').lean();
  res.json({
    profile: { goal: me.goal ?? null, startWeightKg: me.startWeightKg ?? null, heightCm: me.heightCm ?? null },
    checkins: checkins.map(serializeCheckIn),
  });
});

const selfCheckInSchema = z.object({
  weightKg: optionalNumber(20, 400, 'Peso').refine((v) => v != null, 'Inserisci il peso.'),
  day: dayKeySchema.optional(),
});

// Pesata registrata dal cliente
router.post('/checkins', requireRole('client'), async (req, res) => {
  const { weightKg, day } = parse(selfCheckInSchema, req.body);
  if (day && day > dayKey()) throw new HttpError(400, 'La data non può essere nel futuro.');
  const checkin = await CheckIn.create({
    client: req.user._id,
    source: 'self',
    weightKg,
    date: day && day !== dayKey() ? zonedDate(day, 12) : new Date(),
  });
  res.status(201).json({ checkin: serializeCheckIn(checkin.toObject()) });
});

router.delete('/checkins/:id', requireRole('client'), async (req, res) => {
  const checkin = await CheckIn.findOne({ _id: req.params.id, client: req.user._id, source: 'self' });
  if (!checkin) throw new HttpError(404, 'Puoi eliminare solo le pesate inserite da te.');
  await checkin.deleteOne();
  res.status(204).end();
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CareLink, MEAL_TYPES, MealLog, MealPlan, Message, WorkoutLog, WorkoutPlan } from '../models/index.js';
import { dayKey, weekdayOf } from '../utils/dates.js';
import { parse } from '../utils/validate.js';

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

export default router;

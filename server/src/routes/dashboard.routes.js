import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  Appointment,
  CareLink,
  CheckIn,
  MealLog,
  MealPlan,
  Message,
  WorkoutLog,
  WorkoutPlan,
} from '../models/index.js';
import { adherence, percent, weeklyConsistency } from '../services/stats.js';
import { addDays, dayKey, daysBetween, weekdayOf, weekStart, zonedDate } from '../utils/dates.js';
import { pickMetrics, publicUser, round1 } from '../utils/serialize.js';

const router = Router();
router.use(requireAuth);

const DAY_MS = 24 * 60 * 60 * 1000;
const sameId = (a, b) => String(a) === String(b);
const plannedDaysOf = (plan) => (plan?.sessions ?? []).map((s) => s.dayOfWeek).filter(Boolean);

const serializeAppointment = (a) => ({
  id: String(a._id),
  date: a.date,
  durationMin: a.durationMin,
  kind: a.kind,
  type: a.type,
  location: a.location ?? null,
  notes: a.notes ?? null,
  client: a.client?.firstName ? publicUser(a.client) : undefined,
  professional: a.professional?.firstName ? publicUser(a.professional) : undefined,
});

const serializeMessages = (messages) =>
  messages.map((m) => ({
    id: String(m._id),
    from: publicUser(m.from),
    text: m.text,
    createdAt: m.createdAt,
    unread: !m.readAt,
  }));

function recentMessages(userId) {
  return Promise.all([
    Message.find({ to: userId }).sort({ createdAt: -1 }).limit(4).populate('from').lean(),
    Message.countDocuments({ to: userId, readAt: null }),
  ]);
}

function sessionSummary(session) {
  return (
    session && {
      id: String(session._id),
      name: session.name,
      focus: session.focus ?? null,
      description: session.description ?? null,
      durationMin: session.durationMin ?? null,
      dayOfWeek: session.dayOfWeek,
      exercises: session.exercises ?? [],
    }
  );
}

/** Ultimo controllo + quello precedente dello stesso cliente, per calcolare le differenze. */
function latestWithPrevious(checkins) {
  const latest = checkins.at(-1);
  if (!latest) return null;
  const sameClient = checkins.filter((c) => sameId(c.client, latest.client));
  const previous = sameClient.at(-2);
  return { latest, previous };
}

// CLIENTE
router.get('/client', requireRole('client'), async (req, res) => {
  const me = req.user;
  const now = new Date();
  const today = dayKey(now);
  const weekday = weekdayOf(today);

  const [links, pendingRequests, mealPlan, workoutPlan, checkins, nextChecks, workoutLogs, mealLogs, unread] =
    await Promise.all([
      CareLink.find({ client: me._id, status: 'active' }).populate('professional').lean(),
      CareLink.countDocuments({ client: me._id, status: 'pending' }),
      MealPlan.findOne({ client: me._id, status: 'active' }).sort({ updatedAt: -1 }).lean(),
      WorkoutPlan.findOne({ client: me._id, status: 'active' }).sort({ updatedAt: -1 }).lean(),
      CheckIn.find({ client: me._id, weightKg: { $ne: null } }).sort({ date: 1 }).lean(),
      Appointment.find({ client: me._id, kind: 'check', status: 'scheduled', date: { $gte: now } })
        .sort({ date: 1 })
        .limit(1)
        .populate('professional')
        .lean(),
      WorkoutLog.find({ client: me._id, day: { $gte: addDays(today, -371) } }).lean(),
      MealLog.find({ client: me._id, day: today }).lean(),
      Message.countDocuments({ to: me._id, readAt: null }),
    ]);

  // Allenamento di oggi
  const sessions = workoutPlan?.sessions ?? [];
  const todaySession = sessions.find((s) => s.dayOfWeek === weekday);
  const upcoming = [...sessions]
    .filter((s) => s.dayOfWeek)
    .sort((a, b) => ((a.dayOfWeek - weekday + 7) % 7) - ((b.dayOfWeek - weekday + 7) % 7))
    .find((s) => s.dayOfWeek !== weekday);
  const plannedDays = plannedDaysOf(workoutPlan);
  const thisWeek = adherence(workoutLogs, plannedDays, weekStart(today), addDays(weekStart(today), 6));

  // Pasti di oggi
  const days = mealPlan?.days ?? [];
  const mealDay = days.find((d) => d.dayIndex === weekday) ?? days[(weekday - 1) % (days.length || 1)];
  const doneMeals = new Set(mealLogs.filter((l) => l.done).map((l) => l.mealType));
  const meals = (mealDay?.meals ?? []).map((m) => ({ ...m, done: doneMeals.has(m.type) }));

  // Peso
  const weightTrend = checkins.map((c) => ({ day: dayKey(c.date), weightKg: c.weightKg }));
  const currentWeight = weightTrend.at(-1)?.weightKg ?? null;
  const startWeight = me.startWeightKg ?? weightTrend[0]?.weightKg ?? null;

  res.json({
    user: { firstName: me.firstName, goal: me.goal ?? null },
    weight: {
      current: currentWeight,
      start: startWeight,
      delta: currentWeight != null && startWeight != null ? round1(currentWeight - startWeight) : null,
      trend: weightTrend,
    },
    workout: workoutPlan && {
      planId: String(workoutPlan._id),
      planTitle: workoutPlan.title,
      level: workoutPlan.level,
      today: sessionSummary(todaySession),
      next: sessionSummary(upcoming),
      completedToday: workoutLogs.some((l) => l.day === today && l.completed),
      week: thisWeek,
    },
    meals: mealPlan && {
      planId: String(mealPlan._id),
      planTitle: mealPlan.title,
      today: meals,
      completed: meals.filter((m) => m.done).length,
    },
    consistency: weeklyConsistency([{ logs: workoutLogs, plannedDays }], { today }),
    nextCheck: nextChecks[0] ? serializeAppointment(nextChecks[0]) : null,
    professionals: links.map((l) => ({
      linkId: String(l._id),
      role: l.professionalRole,
      sharedAccess: l.sharedAccess,
      professional: publicUser(l.professional),
    })),
    pendingRequests,
    unreadMessages: unread,
  });
});

// NUTRIZIONISTA
router.get('/nutritionist', requireRole('nutritionist'), async (req, res) => {
  const me = req.user;
  const now = new Date();
  const today = dayKey(now);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);
  const inAWeek = new Date(now.getTime() + 7 * DAY_MS);

  const links = await CareLink.find({ professional: me._id, status: 'active' }).populate('client').lean();
  const clientIds = links.map((l) => l.client._id);
  const sharedLinks = links.filter((l) => l.sharedAccess);
  const sharedIds = sharedLinks.map((l) => l.client._id);

  const [
    activePlans,
    newPlans,
    plansToReview,
    featuredPlan,
    checkins,
    appointments,
    [messages, unread],
    sharedWorkoutPlans,
    sharedWorkoutLogs,
  ] = await Promise.all([
    MealPlan.countDocuments({ nutritionist: me._id, status: 'active' }),
    MealPlan.countDocuments({ nutritionist: me._id, status: 'active', createdAt: { $gte: monthAgo } }),
    MealPlan.countDocuments({ nutritionist: me._id, needsReview: true, status: { $ne: 'archived' } }),
    MealPlan.findOne({ nutritionist: me._id, status: 'active' }).sort({ updatedAt: -1 }).populate('client').lean(),
    CheckIn.find({
      client: { $in: clientIds },
      professional: me._id,
      date: { $gte: new Date(now.getTime() - 366 * DAY_MS) },
    })
      .sort({ date: 1 })
      .lean(),
    Appointment.find({ professional: me._id, status: 'scheduled', date: { $gte: zonedDate(today) } })
      .sort({ date: 1 })
      .limit(30)
      .populate('client')
      .lean(),
    recentMessages(me._id),
    // Dati del personal trainer: solo per i clienti che hanno autorizzato la condivisione
    WorkoutPlan.find({ client: { $in: sharedIds }, status: 'active' }).lean(),
    WorkoutLog.find({ client: { $in: sharedIds }, day: { $gte: addDays(today, -13) } }).lean(),
  ]);

  const lastCheckByClient = new Map();
  for (const c of checkins) lastCheckByClient.set(String(c.client), c);

  const recentClients = links
    .map((l) => {
      const last = lastCheckByClient.get(String(l.client._id));
      const fresh = last && daysBetween(dayKey(last.date), today) <= 21;
      return {
        linkId: String(l._id),
        client: publicUser(l.client),
        program: l.program ?? null,
        lastCheck: last?.date ?? null,
        status: fresh ? 'on_track' : 'needs_attention',
      };
    })
    .sort((a, b) => (b.lastCheck?.getTime() ?? 0) - (a.lastCheck?.getTime() ?? 0))
    .slice(0, 5);

  const last = latestWithPrevious(checkins);
  const lastCheck = last && {
    client: publicUser(links.find((l) => sameId(l.client._id, last.latest.client))?.client),
    date: last.latest.date,
    current: pickMetrics(last.latest),
    previous: pickMetrics(last.previous),
    notes: last.latest.notes ?? null,
  };

  const trainerData = sharedLinks.map((l) => {
    const id = String(l.client._id);
    const plan = sharedWorkoutPlans.find((p) => sameId(p.client, id));
    const logs = sharedWorkoutLogs.filter((x) => sameId(x.client, id));
    const plannedDays = plannedDaysOf(plan);
    const from = addDays(today, -13);
    return {
      client: publicUser(l.client),
      hasPlan: Boolean(plan),
      days: Array.from({ length: 14 }, (_, i) => {
        const day = addDays(from, i);
        return { day, on: logs.some((x) => x.day === day && x.completed) };
      }),
      ...adherence(logs, plannedDays, from, today),
    };
  });

  res.json({
    user: { firstName: me.firstName, title: me.title ?? null },
    today: {
      date: today,
      checkups: appointments.filter((a) => dayKey(a.date) === today).length,
      unreadMessages: unread,
      plansToReview,
    },
    stats: {
      clients: { total: links.length, newThisMonth: links.filter((l) => l.createdAt >= monthAgo).length },
      upcomingCheckups: appointments.filter((a) => a.date >= now && a.date < inAWeek).length,
      activePlans: { total: activePlans, newThisMonth: newPlans },
      plansToReview,
    },
    recentClients,
    featuredPlan: featuredPlan && {
      id: String(featuredPlan._id),
      title: featuredPlan.title,
      goal: featuredPlan.goal ?? null,
      kcalTarget: featuredPlan.kcalTarget ?? null,
      client: publicUser(featuredPlan.client),
      day: featuredPlan.days?.[0] ?? null,
    },
    lastCheck,
    trend: {
      clients: links.map((l) => publicUser(l.client)),
      points: checkins.map((c) => ({
        clientId: String(c.client),
        day: dayKey(c.date),
        weightKg: c.weightKg ?? null,
        bodyFatPct: c.bodyFatPct ?? null,
        muscleMassKg: c.muscleMassKg ?? null,
      })),
    },
    trainerData: { clients: trainerData, lockedCount: links.length - sharedLinks.length },
    appointments: appointments
      .filter((a) => a.date >= now)
      .slice(0, 4)
      .map(serializeAppointment),
    messages: serializeMessages(messages),
  });
});

// PERSONAL TRAINER
router.get('/trainer', requireRole('trainer'), async (req, res) => {
  const me = req.user;
  const now = new Date();
  const today = dayKey(now);
  const weekday = weekdayOf(today);
  const yesterday = addDays(today, -1);
  const thisWeek = weekStart(today);
  const lastWeek = addDays(thisWeek, -7);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

  const links = await CareLink.find({ professional: me._id, status: 'active' }).populate('client').lean();
  const clientIds = links.map((l) => l.client._id);
  const sharedIds = links.filter((l) => l.sharedAccess).map((l) => l.client._id);

  const [plans, logs, appointments, [messages, unread], plansToReview, nutritionChecks] = await Promise.all([
    WorkoutPlan.find({ trainer: me._id, status: 'active' }).sort({ updatedAt: -1 }).populate('client').lean(),
    WorkoutLog.find({ client: { $in: clientIds }, day: { $gte: addDays(today, -371) } }).lean(),
    Appointment.find({ professional: me._id, status: { $ne: 'cancelled' }, date: { $gte: zonedDate(lastWeek) } })
      .sort({ date: 1 })
      .populate('client')
      .lean(),
    recentMessages(me._id),
    WorkoutPlan.countDocuments({ trainer: me._id, needsReview: true, status: { $ne: 'archived' } }),
    // Check nutrizionali: solo per i clienti che hanno autorizzato la condivisione
    CheckIn.find({ client: { $in: sharedIds }, source: 'nutritionist' })
      .sort({ date: -1 })
      .limit(40)
      .populate('professional')
      .lean(),
  ]);

  const completed = logs.filter((l) => l.completed);
  const countDays = (from, to) => completed.filter((l) => l.day >= from && l.day <= to).length;
  const sessionsInWeek = (start) =>
    appointments.filter((a) => a.kind === 'session' && weekStart(dayKey(a.date)) === start).length;

  const todaysSessions = appointments.filter((a) => a.kind === 'session' && dayKey(a.date) === today);
  const nextToday = todaysSessions.find((a) => a.date > now);
  const nextSession = appointments.find((a) => a.kind === 'session' && a.date > now);

  const workoutsThisWeek = countDays(thisWeek, today);
  const workoutsLastWeekSamePeriod = countDays(lastWeek, addDays(lastWeek, weekday - 1));

  const planByClient = new Map(plans.map((p) => [String(p.client._id), p]));

  const recentClients = links
    .map((l) => {
      const id = String(l.client._id);
      const clientLogs = completed.filter((x) => sameId(x.client, id));
      const plannedDays = plannedDaysOf(planByClient.get(id));
      const current = percent(adherence(clientLogs, plannedDays, addDays(today, -27), today));
      const previous = percent(adherence(clientLogs, plannedDays, addDays(today, -55), addDays(today, -28)));
      const lastDay = clientLogs.reduce((max, x) => (x.day > max ? x.day : max), '');
      return {
        linkId: String(l._id),
        client: publicUser(l.client),
        program: l.program ?? null,
        lastWorkout: lastDay || null,
        adherence: current,
        trend: current - previous,
      };
    })
    .sort((a, b) => (b.lastWorkout ?? '').localeCompare(a.lastWorkout ?? ''))
    .slice(0, 5);

  const featured = plans[0];
  const featuredSession = featured?.sessions.find((s) => s.dayOfWeek === weekday) ?? featured?.sessions[0];
  const startKey = featured?.startDate ? dayKey(featured.startDate) : today;
  const currentWeek = Math.min(Math.max(Math.floor(daysBetween(startKey, today) / 7) + 1, 1), featured?.weeks ?? 1);

  const latestNutrition = nutritionChecks[0];
  const previousNutrition = latestNutrition
    && nutritionChecks.find((c) => sameId(c.client, latestNutrition.client) && c.date < latestNutrition.date);

  res.json({
    user: { firstName: me.firstName },
    today: {
      sessions: todaysSessions.length,
      nextInMinutes: nextToday ? Math.round((nextToday.date - now) / 60000) : null,
      completedToday: countDays(today, today),
      completedYesterday: countDays(yesterday, yesterday),
      activeClients: links.length,
      newClientsThisMonth: links.filter((l) => l.createdAt >= monthAgo).length,
    },
    stats: {
      activeClients: { total: links.length, newThisMonth: links.filter((l) => l.createdAt >= monthAgo).length },
      sessionsThisWeek: { total: sessionsInWeek(thisWeek), lastWeek: sessionsInWeek(lastWeek) },
      workoutsThisWeek: {
        total: workoutsThisWeek,
        changePct: workoutsLastWeekSamePeriod
          ? Math.round(((workoutsThisWeek - workoutsLastWeekSamePeriod) / workoutsLastWeekSamePeriod) * 100)
          : null,
      },
      plansToReview,
    },
    recentClients,
    featuredPlan: featured && {
      id: String(featured._id),
      title: featured.title,
      level: featured.level,
      weeks: featured.weeks,
      currentWeek,
      client: publicUser(featured.client),
      session: sessionSummary(featuredSession),
    },
    lastNutritionCheck: latestNutrition && {
      client: publicUser(links.find((l) => sameId(l.client._id, latestNutrition.client))?.client),
      nutritionist: publicUser(latestNutrition.professional),
      date: latestNutrition.date,
      current: pickMetrics(latestNutrition),
      previous: pickMetrics(previousNutrition),
      notes: latestNutrition.notes ?? null,
    },
    sharingLockedCount: links.length - sharedIds.length,
    consistency: weeklyConsistency(
      plans.map((p) => ({
        logs: completed.filter((x) => sameId(x.client, p.client._id)),
        plannedDays: plannedDaysOf(p),
      })),
      { today },
    ),
    nextSession: nextSession ? serializeAppointment(nextSession) : null,
    messages: serializeMessages(messages),
  });
});

export default router;

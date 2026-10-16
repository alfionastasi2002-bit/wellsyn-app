// Tanti clienti demo in più, per vedere come si comporta l'app con un lavoro "pieno".
// Usato solo dal database di prova in memoria (npm run dev): non tocca il database online.
import { Appointment, CareLink, CheckIn, MealPlan, Message, User, WorkoutLog, WorkoutPlan } from '../models/index.js';
import { addDays, weekdayOf, zonedDate } from '../utils/dates.js';

const FIRST_NAMES = [
  'Alessandro', 'Francesca', 'Lorenzo', 'Sofia', 'Matteo', 'Aurora', 'Leonardo', 'Ginevra', 'Tommaso', 'Alice',
  'Riccardo', 'Beatrice', 'Gabriele', 'Vittoria', 'Edoardo', 'Ludovica', 'Pietro', 'Camilla', 'Federico', 'Anna',
  'Simone', 'Noemi', 'Nicolò', 'Greta', 'Filippo', 'Irene', 'Stefano', 'Valentina', 'Michele', 'Serena',
  'Giorgio', 'Laura', 'Paolo', 'Silvia', 'Emanuele', 'Marta',
];
const LAST_NAMES = [
  'Ricci', 'Marino', 'Gallo', 'Costa', 'Fontana', 'Caruso', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti',
  'Barbieri', 'Santoro', 'Mariani', 'Rinaldi', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile',
  'Martinelli', 'Vitale', 'Serra', 'Coppola', 'De Santis', "D'Angelo", 'Marchetti', 'Parisi', 'Villa', 'Conte',
  'Ferraro', 'Fabbri', 'Bianco', 'Marini', 'Grasso', 'Valentini',
];

// Profilo tipo: obiettivo, percorso, andamento del peso al mese
const PROFILES = [
  { goal: 'Perdere peso in modo sostenibile', program: 'Dimagrimento', trend: -1.2 },
  { goal: 'Tonificare e definire', program: 'Definizione', trend: -0.6 },
  { goal: 'Aumentare la massa muscolare', program: 'Massa muscolare', trend: 0.7 },
  { goal: 'Migliorare la composizione corporea', program: 'Ricomposizione', trend: -0.3 },
  { goal: 'Mangiare meglio e con regolarità', program: 'Educazione alimentare', trend: -0.2 },
  { goal: 'Diventare più forte', program: 'Forza', trend: 0.2 },
  { goal: 'Stare bene e muovermi con regolarità', program: 'Benessere generale', trend: -0.1 },
];

const SESSION_SETS = [
  ['upper', 'lower', 'core'],
  ['full', 'cardio', 'core'],
  ['upper', 'lower', 'full', 'core'],
  ['lower', 'upper', 'cardio', 'full'],
  ['upper', 'lower', 'core', 'full', 'cardio'],
];
const PLAN_TITLES = {
  Dimagrimento: 'Dimagrimento – Fase 1',
  Definizione: 'Definizione e tono',
  'Massa muscolare': 'Massa muscolare – Blocco 1',
  Ricomposizione: 'Ricomposizione corporea',
  'Educazione alimentare': 'Benessere in movimento',
  Forza: 'Forza di base',
  'Benessere generale': 'Benessere in movimento',
};
const MESSAGES_TO_PRO = [
  'Buongiorno! Posso spostare il controllo della prossima settimana?',
  'Ho seguito il piano tutta la settimana, mi sento bene!',
  'Una domanda: posso sostituire il pranzo di giovedì?',
  'Grazie per i consigli, oggi allenamento fatto!',
  'Questa settimana sono un po’ stanco, possiamo alleggerire?',
  'Ho dimenticato la pesata di ieri, la faccio domani mattina.',
];

/**
 * Crea `count` clienti in più collegati alla nutrizionista e/o al personal trainer demo,
 * con controlli, pesate, piani, schede, allenamenti, appuntamenti (senza sovrapposizioni) e messaggi.
 */
export async function seedCrowd({ count, elena, luca, passwordHash, random, today, daysAgo, SESSIONS, MENU, domain }) {
  const pick = (list) => list[Math.floor(random() * list.length)];
  const between = (a, b) => a + random() * (b - a);
  const round1 = (n) => Math.round(n * 10) / 10;

  // Persone
  const people = Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length];
    const profile = PROFILES[i % PROFILES.length];
    const heightCm = Math.round(between(155, 192));
    const bmi = profile.trend > 0.3 ? between(20, 24) : between(22, 31);
    return {
      firstName,
      lastName,
      email: `${firstName}.${lastName}${domain}`.toLowerCase().replace(/[^a-z0-9.@]/g, ''),
      role: 'client',
      passwordHash,
      goal: profile.goal,
      heightCm,
      startWeightKg: round1(bmi * (heightCm / 100) ** 2),
      _profile: profile,
    };
  });
  const users = await User.insertMany(people.map(({ _profile, ...p }) => p));

  // Chi segue chi: un terzo entrambi, un terzo solo la nutrizionista, un terzo solo il trainer.
  const links = [];
  const roster = users.map((user, i) => {
    const followsElena = i % 3 !== 2;
    const followsLuca = i % 3 !== 1;
    const since = Math.round(between(8, 300));
    const shared = followsElena && followsLuca ? random() < 0.65 : random() < 0.3;
    const pending = i >= count - 4; // gli ultimi in attesa di conferma
    return { user, profile: people[i]._profile, followsElena, followsLuca, since, shared, pending };
  });
  for (const r of roster) {
    const status = r.pending ? 'pending' : 'active';
    if (r.followsElena) links.push({ client: r.user._id, professional: elena._id, professionalRole: 'nutritionist', program: r.profile.program, sharedAccess: !r.pending && r.shared, status, createdAt: daysAgo(r.pending ? 1 : r.since) });
    if (r.followsLuca) links.push({ client: r.user._id, professional: luca._id, professionalRole: 'trainer', program: r.profile.program, sharedAccess: !r.pending && r.shared, status, createdAt: daysAgo(r.pending ? 2 : r.since) });
  }
  await CareLink.insertMany(links);
  const active = roster.filter((r) => !r.pending);

  // Controlli della nutrizionista e pesate dei clienti
  const checkins = [];
  for (const r of active.filter((x) => x.followsElena)) {
    const weeks = Math.min(26, Math.floor(r.since / 7));
    const lastDaysAgo = Math.round(between(1, 40)); // alcuni sono "da seguire" (ultimo controllo > 3 settimane)
    const perWeek = r.profile.trend / 4.3;
    const selfWeighIns = random() < 0.5;
    for (let w = weeks; w >= 0; w -= 1) {
      const progress = weeks - w;
      const weightKg = round1(r.user.startWeightKg + perWeek * progress + (w === 0 ? 0 : (random() - 0.5) * 0.6));
      const date = daysAgo(lastDaysAgo + w * 7);
      if (w % 2 === 0) {
        const fat = between(16, 32) - progress * 0.08;
        checkins.push({
          client: r.user._id,
          professional: elena._id,
          source: 'nutritionist',
          date,
          weightKg,
          bodyFatPct: round1(fat),
          muscleMassKg: round1(weightKg * between(0.36, 0.45)),
          waistCm: Math.round(r.user.heightCm * between(0.42, 0.52)),
          hipsCm: Math.round(r.user.heightCm * between(0.55, 0.62)),
          ...(w === 0 && random() < 0.5 && { notes: pick(['Buona aderenza al piano.', 'Aumentare l’idratazione.', 'Ottimi progressi, continuiamo così.', 'Ridurre gli spuntini serali.']) }),
        });
      } else if (selfWeighIns) {
        checkins.push({ client: r.user._id, source: 'self', date, weightKg });
      }
    }
  }
  await CheckIn.insertMany(checkins);

  // Piani alimentari (circa 3 clienti su 4 della nutrizionista)
  for (const r of active.filter((x) => x.followsElena && random() < 0.75)) {
    const kcalTarget = Math.round((r.user.startWeightKg * between(24, 32)) / 50) * 50;
    const shift = Math.floor(random() * 7);
    await MealPlan.create({
      client: r.user._id,
      nutritionist: elena._id,
      title: `Piano ${r.profile.program.toLowerCase()}`,
      goal: r.profile.program,
      kcalTarget,
      guidelines: 'Bere almeno 2 litri di acqua al giorno. Verdura a volontà a pranzo e cena.',
      status: random() < 0.9 ? 'active' : 'draft',
      needsReview: random() < 0.25,
      startDate: daysAgo(Math.min(r.since, 60)),
      createdAt: daysAgo(Math.min(r.since, 60)),
      days: Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i + 1,
        meals: ['colazione', 'pranzo', 'cena'].map((type) => {
          const [name, description, kcal] = MENU[type][(i + shift) % MENU[type].length];
          return { type, name, description, kcal };
        }),
      })),
    });
  }

  // Schede e storico allenamenti (clienti del trainer)
  const workoutLogs = [];
  for (const r of active.filter((x) => x.followsLuca && random() < 0.85)) {
    const keys = pick(SESSION_SETS);
    const firstDay = Math.floor(random() * 2) + 1;
    const step = keys.length >= 5 ? 1 : 2;
    const sessions = keys.map((key, i) => ({ ...SESSIONS[key], dayOfWeek: ((firstDay - 1 + i * step) % 7) + 1 }));
    const started = Math.min(r.since, 120);
    const plan = await WorkoutPlan.create({
      client: r.user._id,
      trainer: luca._id,
      title: PLAN_TITLES[r.profile.program],
      level: pick(['principiante', 'intermedio', 'intermedio', 'avanzato']),
      weeks: pick([4, 6, 8, 12]),
      startDate: daysAgo(Math.min(started, 40)),
      createdAt: daysAgo(Math.min(started, 40)),
      needsReview: random() < 0.25,
      sessions,
    });
    const consistency = between(0.45, 0.95);
    const planned = new Map(sessions.map((s) => [s.dayOfWeek, s.name]));
    for (let i = started; i >= 1; i -= 1) {
      const day = addDays(today, -i);
      const sessionName = planned.get(weekdayOf(day));
      if (sessionName && random() < consistency) workoutLogs.push({ client: r.user._id, plan: plan._id, sessionName, day, completed: true });
    }
  }
  await WorkoutLog.insertMany(workoutLogs);

  // Appuntamenti: nessuna sovrapposizione per il professionista né per il cliente
  const existing = await Appointment.find({ status: 'scheduled' }).lean();
  const busy = new Map(); // id -> [[inizio, fine]]
  const book = (id, start, end) => busy.set(id, [...(busy.get(id) ?? []), [start, end]]);
  const free = (id, start, end) => !(busy.get(id) ?? []).some(([s, e]) => start < e && s < end);
  for (const a of existing) {
    const start = a.date.getTime();
    const end = start + a.durationMin * 60000;
    book(String(a.professional), start, end);
    book(String(a.client), start, end);
  }
  const appointments = [];
  function schedule({ client, professional, kind, durationMin, type, location, days, hours, workdays }) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const day = addDays(today, Math.round(between(days[0], days[1])));
      if (!workdays.includes(weekdayOf(day))) continue;
      const minutes = Math.round(between(hours[0] * 60, hours[1] * 60 - durationMin) / 15) * 15;
      const date = zonedDate(day, Math.floor(minutes / 60), minutes % 60);
      const start = date.getTime();
      const end = start + durationMin * 60000;
      if (!free(String(professional), start, end) || !free(String(client), start, end)) continue;
      book(String(professional), start, end);
      book(String(client), start, end);
      const past = end < Date.now();
      appointments.push({
        client,
        professional,
        date,
        durationMin,
        kind,
        type,
        location,
        status: past ? (random() < 0.85 ? 'done' : 'cancelled') : random() < 0.06 ? 'cancelled' : 'scheduled',
      });
      return;
    }
  }
  for (const r of active) {
    if (r.followsElena) {
      schedule({ client: r.user._id, professional: elena._id, kind: 'check', durationMin: pick([30, 45, 45, 60]), type: pick(['Check-up nutrizionale', 'Controllo piano', 'Valutazione progressi']), location: pick(['Studio', 'Videochiamata']), days: [-14, -1], hours: [9, 18], workdays: [1, 2, 3, 4, 5] });
      schedule({ client: r.user._id, professional: elena._id, kind: 'check', durationMin: pick([30, 45, 45, 60]), type: pick(['Check-up nutrizionale', 'Controllo piano', 'Valutazione progressi']), location: pick(['Studio', 'Videochiamata']), days: [0, 24], hours: [9, 18], workdays: [1, 2, 3, 4, 5] });
    }
    if (r.followsLuca && random() < 0.7) {
      for (let k = 0; k < 4; k += 1) {
        schedule({ client: r.user._id, professional: luca._id, kind: 'session', durationMin: 60, type: pick(['Sessione personal training', 'Forza • Upper Body', 'Forza • Lower Body', 'Cardio e mobilità']), location: 'Palestra Wellsyn', days: k < 2 ? [-10, -1] : [0, 14], hours: [8, 21], workdays: [1, 2, 3, 4, 5, 6] });
      }
    }
  }
  await Appointment.insertMany(appointments);

  // Qualche messaggio dai nuovi clienti
  const now = Date.now();
  const messages = active.slice(0, 10).map((r, i) => ({
    from: r.user._id,
    to: r.followsElena && (i % 2 === 0 || !r.followsLuca) ? elena._id : luca._id,
    text: MESSAGES_TO_PRO[i % MESSAGES_TO_PRO.length],
    createdAt: new Date(now - (i + 1) * 3.5 * 3600000),
    ...(i > 3 && { readAt: new Date(now - i * 3 * 3600000) }),
  }));
  await Message.insertMany(messages);

  return { clients: users.length, checkins: checkins.length, workouts: workoutLogs.length, appointments: appointments.length };
}

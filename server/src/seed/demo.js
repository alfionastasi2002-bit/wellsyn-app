// Dati dimostrativi ispirati ai mockup: servono per provare l'app senza inserire tutto a mano.
// Account demo (password uguale per tutti: DEMO_PASSWORD):
//   Cliente        giulia.rossi@wellsyn.demo
//   Nutrizionista  elena.bianchi@wellsyn.demo
//   Personal Trainer luca.ferrari@wellsyn.demo
import bcrypt from 'bcryptjs';
import {
  Appointment,
  CareLink,
  CheckIn,
  MealLog,
  MealPlan,
  Message,
  User,
  WorkoutLog,
  WorkoutPlan,
} from '../models/index.js';
import { addDays, dayKey, weekdayOf, zonedDate } from '../utils/dates.js';

export const DEMO_PASSWORD = 'Wellsyn2026!';
export const DEMO_DOMAIN = '@wellsyn.demo';

// Generatore pseudo-casuale con seme fisso: i dati demo sono sempre uguali.
function createRandom(seed) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SESSIONS = {
  upper: {
    name: 'Forza parte superiore',
    focus: 'Upper Body',
    description: 'Costruisci forza e stabilità nella parte superiore del corpo, con focus sulla postura e sul core.',
    durationMin: 45,
    exercises: [
      { name: 'Panca piana bilanciere', sets: 4, reps: '8 - 10', restSec: 90 },
      { name: 'Rematore manubri', sets: 3, reps: '10 - 12', restSec: 60 },
      { name: 'Lat machine', sets: 3, reps: '10 - 12', restSec: 60 },
      { name: 'Shoulder press', sets: 3, reps: '8 - 10', restSec: 60 },
      { name: 'Alzate laterali', sets: 3, reps: '12 - 15', restSec: 45 },
    ],
  },
  lower: {
    name: 'Gambe e glutei',
    focus: 'Lower Body',
    description: 'Forza e controllo di gambe e glutei, con attenzione alla tecnica.',
    durationMin: 50,
    exercises: [
      { name: 'Squat bilanciere', sets: 4, reps: '6 - 8', restSec: 120 },
      { name: 'Affondi camminati', sets: 3, reps: '10 per gamba', restSec: 60 },
      { name: 'Hip thrust', sets: 4, reps: '8 - 10', restSec: 90 },
      { name: 'Leg curl', sets: 3, reps: '12', restSec: 60 },
      { name: 'Calf raise', sets: 3, reps: '15', restSec: 45 },
    ],
  },
  core: {
    name: 'Core e mobilità',
    focus: 'Core',
    description: 'Stabilità del tronco e mobilità articolare per muoverti meglio ogni giorno.',
    durationMin: 35,
    exercises: [
      { name: 'Plank', sets: 3, reps: '45 sec', restSec: 30 },
      { name: 'Dead bug', sets: 3, reps: '12', restSec: 30 },
      { name: 'Pallof press', sets: 3, reps: '10 per lato', restSec: 45 },
      { name: 'Mobilità anche', sets: 2, reps: '8', restSec: 30 },
    ],
  },
  full: {
    name: 'Full body funzionale',
    focus: 'Full Body',
    description: 'Circuito funzionale per forza e condizionamento generale.',
    durationMin: 45,
    exercises: [
      { name: 'Stacco rumeno', sets: 4, reps: '8', restSec: 90 },
      { name: 'Push up', sets: 3, reps: '12', restSec: 60 },
      { name: 'Kettlebell swing', sets: 4, reps: '15', restSec: 60 },
      { name: 'Trazioni assistite', sets: 3, reps: '8', restSec: 90 },
    ],
  },
  cardio: {
    name: 'Cardio e resistenza',
    focus: 'Cardio',
    description: 'Lavoro aerobico a intensità moderata per resistenza e recupero.',
    durationMin: 40,
    exercises: [
      { name: 'Tapis roulant', sets: 1, reps: '20 min', restSec: 0 },
      { name: 'Vogatore', sets: 4, reps: '500 m', restSec: 90 },
      { name: 'Bike a intervalli', sets: 6, reps: '30 sec', restSec: 60 },
    ],
  },
};

const MENU = {
  colazione: [
    ["Porridge d'avena con frutti di bosco", 'Fiocchi di avena, latte parzialmente scremato, frutti di bosco e mandorle', 380],
    ['Yogurt greco con granola', 'Yogurt greco 0%, granola senza zuccheri aggiunti e miele', 340],
    ['Pane integrale con avocado e uovo', 'Pane di segale, avocado, uovo in camicia', 400],
    ['Pancake proteici con frutta', 'Albumi, avena, banana e fragole fresche', 360],
    ['Smoothie bowl', 'Banana, frutti rossi, semi di chia e cocco', 350],
    ['Fette integrali con ricotta', 'Fette biscottate integrali, ricotta e marmellata senza zucchero', 320],
    ['Omelette con spinaci', 'Due uova, spinaci, pane di segale tostato', 390],
  ],
  pranzo: [
    ['Bowl di pollo grigliato', 'Petto di pollo alla griglia con quinoa e verdure di stagione', 560],
    ['Insalata di farro e ceci', 'Farro, ceci, pomodorini, cetrioli e feta', 540],
    ['Pasta integrale al pomodoro', 'Pasta integrale, pomodoro fresco, basilico e parmigiano', 580],
    ['Riso venere con gamberi', 'Riso venere, gamberi, zucchine e lime', 550],
    ['Burger di lenticchie', 'Burger di lenticchie con insalata mista e patate al forno', 570],
    ['Poke di tonno', 'Riso, tonno fresco, edamame, avocado e sesamo', 590],
    ['Couscous di verdure', 'Couscous integrale con verdure grigliate e feta', 530],
  ],
  cena: [
    ['Salmone con quinoa e verdure', 'Filetto di salmone al forno, quinoa e verdure al vapore', 520],
    ['Tacchino con patate al forno', 'Fesa di tacchino alla piastra con patate e rosmarino', 500],
    ['Zuppa di legumi', 'Zuppa di legumi misti con crostini integrali', 460],
    ['Merluzzo con broccoli', 'Merluzzo al forno con broccoli e olio a crudo', 430],
    ['Frittata di verdure', 'Frittata al forno con zucchine e insalata', 450],
    ['Tofu saltato con riso', 'Tofu, verdure saltate e riso basmati', 480],
    ['Orata al cartoccio', 'Orata al cartoccio con verdure grigliate', 470],
  ],
};

export async function seedDemoData() {
  const random = createRandom(2026);
  const now = new Date();
  const today = dayKey(now);
  const weekday = weekdayOf(today);
  // Giorno della settimana (1-7) a "offset" giorni da oggi.
  const dow = (offset) => ((weekday - 1 + offset) % 7) + 1;
  const daysAgo = (n) => zonedDate(addDays(today, -n), 9, 0);

  await Promise.all(
    [User, CareLink, MealPlan, WorkoutPlan, WorkoutLog, MealLog, CheckIn, Appointment, Message].map((M) =>
      M.deleteMany({}),
    ),
  );

  // Utenti
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const person = (firstName, lastName, role, extra = {}) => ({
    firstName,
    lastName,
    role,
    passwordHash,
    email: `${firstName}.${lastName}${DEMO_DOMAIN}`.toLowerCase().replace(/\s/g, ''),
    ...extra,
  });

  const [elena, luca, giulia, marco, martina, andrea, sara, davide, elenaR, chiara] = await User.insertMany([
    person('Elena', 'Bianchi', 'nutritionist', {
      title: 'Dott.ssa',
      specialization: 'Biologa Nutrizionista',
      bio: 'Specializzata in alimentazione personalizzata e abitudini sostenibili.',
    }),
    person('Luca', 'Ferrari', 'trainer', {
      specialization: 'Personal Trainer',
      bio: 'Forza, mobilità e performance a lungo termine.',
    }),
    person('Giulia', 'Rossi', 'client', {
      goal: 'Aumentare la forza e sentirmi più energica',
      startWeightKg: 66,
      heightCm: 168,
    }),
    person('Marco', 'Bianchi', 'client', { goal: 'Aumentare la massa muscolare', startWeightKg: 74, heightCm: 180 }),
    person('Martina', 'Conti', 'client', { goal: 'Migliorare la composizione corporea', startWeightKg: 62.5 }),
    person('Andrea', 'Greco', 'client', { goal: 'Perdere peso in modo sostenibile', startWeightKg: 92 }),
    person('Sara', 'Conti', 'client', { goal: 'Tonificare e definire' }),
    person('Davide', 'Esposito', 'client', { goal: 'Aumentare la forza massimale' }),
    person('Elena', 'Romano', 'client', { goal: 'Stare bene e muovermi con regolarità' }),
    person('Chiara', 'Moretti', 'client', { goal: 'Migliorare le abitudini alimentari' }),
  ]);

  // Collegamenti cliente ↔ professionista (con autorizzazioni)
  const link = (client, professional, program, sharedAccess, status = 'active', since = 120) => ({
    client: client._id,
    professional: professional._id,
    professionalRole: professional.role,
    program,
    sharedAccess,
    status,
    createdAt: daysAgo(since),
  });
  await CareLink.insertMany([
    link(giulia, elena, 'Definizione', true, 'active', 190),
    link(marco, elena, 'Massa muscolare', true, 'active', 160),
    link(martina, elena, 'Ricomposizione', false, 'active', 140),
    link(andrea, elena, 'Dimagrimento', true, 'active', 12),
    link(chiara, elena, 'Educazione alimentare', false, 'pending', 2),
    link(giulia, luca, 'Ricomposizione', true, 'active', 190),
    link(marco, luca, 'Massa muscolare', true, 'active', 150),
    link(sara, luca, 'Definizione', false, 'active', 90),
    link(davide, luca, 'Forza', true, 'active', 20),
    link(elenaR, luca, 'Benessere generale', false, 'active', 60),
  ]);

  // Schede di allenamento (Luca)
  const plan = (client, title, level, sessions, extra = {}) => ({
    client: client._id,
    trainer: luca._id,
    title,
    level,
    weeks: 4,
    startDate: daysAgo(10),
    createdAt: daysAgo(10),
    sessions: sessions.map(([key, offset]) => ({ ...SESSIONS[key], dayOfWeek: dow(offset) })),
    ...extra,
  });
  const workoutPlans = [];
  for (const p of [
    plan(elenaR, 'Benessere in movimento', 'principiante', [['core', 0], ['cardio', 2], ['full', 4]]),
    plan(sara, 'Definizione – Fase 1', 'principiante', [['full', 0], ['cardio', 2], ['core', 4]], { needsReview: true }),
    plan(davide, 'Forza massimale', 'avanzato', [['upper', 1], ['lower', 3], ['full', 5], ['core', 6]], { needsReview: true }),
    plan(marco, 'Massa muscolare – Blocco 1', 'intermedio', [['lower', 0], ['upper', 1], ['full', 3], ['core', 5]], { needsReview: true }),
    plan(giulia, 'Ricomposizione corporea', 'intermedio', [['upper', 0], ['lower', 1], ['core', 2], ['full', 4], ['cardio', 5]], {
      createdAt: daysAgo(9), // la più recente: è quella mostrata in evidenza al trainer
    }),
  ]) {
    // creati uno alla volta: l'ultimo (Giulia) risulta il più recente
    workoutPlans.push(await WorkoutPlan.create(p));
  }

  // Storico allenamenti (circa 6 mesi)
  const consistencyByClient = new Map([
    [String(giulia._id), 0.8],
    [String(marco._id), 0.86],
    [String(sara._id), 0.7],
    [String(davide._id), 0.82],
    [String(elenaR._id), 0.6],
  ]);
  const completedToday = new Set([String(sara._id), String(elenaR._id)]);
  const workoutLogs = [];
  for (const wp of workoutPlans) {
    const id = String(wp.client);
    const plannedDays = new Map(wp.sessions.map((s) => [s.dayOfWeek, s.name]));
    let weekFactor = 1;
    for (let i = 182; i >= 0; i -= 1) {
      const day = addDays(today, -i);
      if (weekdayOf(day) === 1) weekFactor = 0.8 + random() * 0.35;
      const sessionName = plannedDays.get(weekdayOf(day));
      if (!sessionName) continue;
      const done = i === 0 ? completedToday.has(id) : random() < consistencyByClient.get(id) * weekFactor;
      if (done) workoutLogs.push({ client: wp.client, plan: wp._id, sessionName, day, completed: true });
    }
  }
  await WorkoutLog.insertMany(workoutLogs);

  // Piani alimentari (Elena)
  const mealPlan = (client, title, goal, kcalTarget, extra = {}) => ({
    client: client._id,
    nutritionist: elena._id,
    title,
    goal,
    kcalTarget,
    guidelines: 'Obiettivi, linee guida e menù settimanale',
    startDate: daysAgo(40),
    createdAt: daysAgo(40),
    days: Array.from({ length: 7 }, (_, i) => {
      const dayIndex = i + 1;
      const option = (dayIndex - weekday + 7) % 7; // oggi = opzione 0, come nel mockup
      return {
        dayIndex,
        meals: ['colazione', 'pranzo', 'cena'].map((type) => {
          const [name, description, kcal] = MENU[type][option];
          return { type, name, description, kcal };
        }),
      };
    }),
    ...extra,
  });
  for (const p of [
    mealPlan(andrea, 'Piano dimagrimento graduale', 'Dimagrimento', 1900, { needsReview: true, createdAt: daysAgo(10) }),
    mealPlan(martina, 'Piano ricomposizione', 'Ricomposizione', 1700, { needsReview: true }),
    mealPlan(marco, 'Piano massa pulita', 'Massa muscolare', 2800, { needsReview: true }),
    mealPlan(giulia, 'Piano alimentare personalizzato', 'Definizione', 1750, { createdAt: daysAgo(5) }),
  ]) {
    await MealPlan.create(p);
  }

  // Pasti già spuntati oggi da Giulia
  await MealLog.insertMany(
    ['colazione', 'pranzo'].map((mealType) => ({ client: giulia._id, day: today, mealType, done: true })),
  );

  // Controlli e pesate
  const checkins = [];
  const series = (client, { from, to, weeks, lastDaysAgo = 3, fat, muscle, waist, hips, selfWeighIns = false }) => {
    for (let w = weeks; w >= 0; w -= 1) {
      const progress = 1 - w / weeks;
      const eased = 1 - (1 - progress) ** 1.6;
      const noise = w === 0 ? 0 : (random() - 0.5) * 0.6;
      const weightKg = Math.round((from + (to - from) * eased + noise) * 10) / 10;
      const date = daysAgo(lastDaysAgo + w * 7);
      const isProfessionalCheck = w % 2 === 0;
      if (isProfessionalCheck) {
        checkins.push({
          client: client._id,
          professional: elena._id,
          source: 'nutritionist',
          date,
          weightKg,
          bodyFatPct: Math.round((fat[0] + (fat[1] - fat[0]) * eased) * 10) / 10,
          muscleMassKg: Math.round((muscle[0] + (muscle[1] - muscle[0]) * eased) * 10) / 10,
          waistCm: Math.round(waist[0] + (waist[1] - waist[0]) * eased),
          hipsCm: Math.round(hips[0] + (hips[1] - hips[0]) * eased),
        });
      } else if (selfWeighIns) {
        checkins.push({ client: client._id, source: 'self', date, weightKg });
      }
    }
  };
  series(giulia, { from: 66, to: 64.2, weeks: 26, fat: [25.8, 22.4], muscle: [23.6, 24.8], waist: [77, 72], hips: [99, 96], selfWeighIns: true });
  series(marco, { from: 74, to: 76.4, weeks: 22, lastDaysAgo: 5, fat: [17.5, 15.9], muscle: [33.1, 35.2], waist: [84, 83], hips: [97, 98] });
  series(martina, { from: 62.5, to: 60.8, weeks: 20, lastDaysAgo: 25, fat: [27.1, 25.2], muscle: [21.8, 22.4], waist: [74, 71], hips: [98, 96] });
  series(andrea, { from: 92, to: 89.6, weeks: 2, lastDaysAgo: 1, fat: [29.5, 28.4], muscle: [34.0, 34.2], waist: [101, 98], hips: [106, 104] });
  // Nota sull'ultimo controllo di Giulia (come nel mockup)
  const lastGiulia = checkins.findLast((c) => String(c.client) === String(giulia._id) && c.source === 'nutritionist');
  lastGiulia.notes =
    "Ottimi progressi. Maggiore energia e miglior qualità del sonno. Mantenere l'attuale piano con lieve aumento delle calorie nei giorni di allenamento.";
  await CheckIn.insertMany(checkins);

  // Appuntamenti
  const at = (offsetDays, h, m) => zonedDate(addDays(today, offsetDays), h, m);
  const appointments = [
    // Nutrizionista
    { client: andrea, professional: elena, date: at(0, 9, 30), durationMin: 45, type: 'Check-up nutrizionale' },
    { client: martina, professional: elena, date: at(0, 11, 0), durationMin: 30, type: 'Controllo piano' },
    { client: marco, professional: elena, date: at(0, 15, 0), durationMin: 45, type: 'Check-up nutrizionale' },
    { client: chiara, professional: elena, date: at(1, 11, 0), durationMin: 60, type: 'Prima visita' },
    { client: andrea, professional: elena, date: at(4, 10, 0), durationMin: 30, type: 'Controllo piano' },
    { client: giulia, professional: elena, date: at(24, 10, 0), durationMin: 45, type: 'Valutazione nutrizione e progressi' },
    // Personal trainer: sessioni di oggi
    { client: sara, professional: luca, date: at(0, 8, 30), kind: 'session', type: 'Full Body', location: 'Palestra Wellsyn', notes: 'Focus: circuito funzionale' },
    { client: marco, professional: luca, date: at(0, 17, 0), kind: 'session', type: 'Forza • Lower Body', location: 'Palestra Wellsyn', notes: 'Focus: forza arti inferiori' },
    { client: davide, professional: luca, date: at(0, 19, 0), kind: 'session', type: 'Forza • Upper Body', location: 'Palestra Wellsyn', notes: 'Focus: panca piana e trazioni' },
  ].map((a) => ({ kind: 'check', ...a, client: a.client._id, professional: a.professional._id }));

  // Altre sessioni del trainer nella settimana scorsa, in questa e nella prossima (lun-sab)
  const trainerClients = [giulia, marco, sara, davide, elenaR];
  const monday = addDays(today, 1 - weekday);
  for (const week of [-1, 0, 1]) {
    trainerClients.forEach((client, idx) => {
      for (const extra of [0, 3]) {
        const day = addDays(monday, week * 7 + ((idx + extra) % 6));
        if (day === today) continue;
        if (week === -1 && random() < 0.3) continue; // la settimana scorsa ne sono state fatte meno
        appointments.push({
          client: client._id,
          professional: luca._id,
          date: zonedDate(day, 17 + (idx % 3), 0),
          kind: 'session',
          type: 'Sessione personal training',
          location: 'Palestra Wellsyn',
        });
      }
    });
  }
  await Appointment.insertMany(appointments);

  // Messaggi
  const minutesAgo = (n) => new Date(now.getTime() - n * 60000);
  await Message.insertMany([
    { from: luca._id, to: elena._id, text: 'Ciao Elena, ho una domanda sul piano alimentare di Marco nei giorni di carico.', createdAt: minutesAgo(35) },
    { from: giulia._id, to: elena._id, text: 'Grazie! Questa settimana mi sento molto più energica.', createdAt: minutesAgo(180) },
    { from: elena._id, to: luca._id, text: 'Ho aggiornato il check nutrizionale di Giulia. Ottimi progressi!', createdAt: minutesAgo(50) },
    { from: marco._id, to: luca._id, text: 'Ci vediamo alle 17:00!', createdAt: minutesAgo(95) },
    { from: sara._id, to: luca._id, text: 'Grazie per la nuova scheda!', createdAt: minutesAgo(60 * 20) },
    { from: elena._id, to: giulia._id, text: 'Brava Giulia, continua così! Ci vediamo al prossimo controllo.', createdAt: minutesAgo(60 * 26), readAt: minutesAgo(60 * 25) },
    { from: luca._id, to: giulia._id, text: 'Oggi spingiamo sulla parte superiore: ricordati il riscaldamento!', createdAt: minutesAgo(70) },
  ]);

  console.log(`✓ Dati demo caricati (${workoutLogs.length} allenamenti, ${checkins.length} controlli).`);
}

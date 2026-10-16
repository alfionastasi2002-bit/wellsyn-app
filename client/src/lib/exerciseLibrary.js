// Esercizi pronti per le schede: nome, gruppo muscolare e valori di partenza (serie, ripetizioni, recupero in secondi).

const ex = (name, group, sets, reps, restSec) => ({ name, group, sets, reps, restSec });

export const EXERCISES = [
  // Petto
  ex('Panca piana bilanciere', 'Petto', 4, '8 - 10', 90),
  ex('Panca inclinata manubri', 'Petto', 3, '10 - 12', 75),
  ex('Croci ai cavi', 'Petto', 3, '12 - 15', 60),
  ex('Push up', 'Petto', 3, '12', 60),
  ex('Chest press', 'Petto', 3, '10 - 12', 60),
  // Dorso
  ex('Trazioni alla sbarra', 'Dorso', 4, '6 - 8', 120),
  ex('Trazioni assistite', 'Dorso', 3, '8', 90),
  ex('Lat machine', 'Dorso', 3, '10 - 12', 60),
  ex('Rematore manubri', 'Dorso', 3, '10 - 12', 60),
  ex('Rematore bilanciere', 'Dorso', 4, '8 - 10', 90),
  ex('Pulley basso', 'Dorso', 3, '12', 60),
  // Spalle
  ex('Shoulder press', 'Spalle', 3, '8 - 10', 75),
  ex('Lento avanti bilanciere', 'Spalle', 4, '6 - 8', 90),
  ex('Alzate laterali', 'Spalle', 3, '12 - 15', 45),
  ex('Face pull', 'Spalle', 3, '15', 45),
  // Braccia
  ex('Curl bilanciere', 'Braccia', 3, '10 - 12', 60),
  ex('Curl a martello', 'Braccia', 3, '12', 45),
  ex('French press', 'Braccia', 3, '10 - 12', 60),
  ex('Push down ai cavi', 'Braccia', 3, '12 - 15', 45),
  ex('Dip alle parallele', 'Braccia', 3, '8 - 10', 75),
  // Gambe
  ex('Squat bilanciere', 'Gambe', 4, '6 - 8', 120),
  ex('Goblet squat', 'Gambe', 3, '10 - 12', 75),
  ex('Leg press', 'Gambe', 4, '10 - 12', 90),
  ex('Affondi camminati', 'Gambe', 3, '10 per gamba', 60),
  ex('Bulgarian split squat', 'Gambe', 3, '8 per gamba', 75),
  ex('Stacco rumeno', 'Gambe', 4, '8', 90),
  ex('Stacco da terra', 'Gambe', 4, '5', 150),
  ex('Leg curl', 'Gambe', 3, '12', 60),
  ex('Leg extension', 'Gambe', 3, '12 - 15', 60),
  ex('Calf raise', 'Gambe', 3, '15', 45),
  // Glutei
  ex('Hip thrust', 'Glutei', 4, '8 - 10', 90),
  ex('Glute bridge', 'Glutei', 3, '15', 45),
  ex('Abductor machine', 'Glutei', 3, '15', 45),
  // Core
  ex('Plank', 'Core', 3, '45 sec', 30),
  ex('Plank laterale', 'Core', 3, '30 sec per lato', 30),
  ex('Dead bug', 'Core', 3, '12', 30),
  ex('Pallof press', 'Core', 3, '10 per lato', 45),
  ex('Crunch inverso', 'Core', 3, '15', 30),
  ex('Russian twist', 'Core', 3, '20', 30),
  // Full body e funzionale
  ex('Kettlebell swing', 'Full body', 4, '15', 60),
  ex('Burpees', 'Full body', 3, '10', 60),
  ex('Thruster manubri', 'Full body', 3, '10', 75),
  ex('Farmer walk', 'Full body', 3, '30 m', 60),
  // Cardio
  ex('Tapis roulant', 'Cardio', 1, '20 min', 0),
  ex('Vogatore', 'Cardio', 4, '500 m', 90),
  ex('Bike a intervalli', 'Cardio', 6, '30 sec', 60),
  ex('Ellittica', 'Cardio', 1, '15 min', 0),
  ex('Corda', 'Cardio', 5, '1 min', 45),
  // Mobilità
  ex('Mobilità anche', 'Mobilità', 2, '8', 30),
  ex('Mobilità toracica', 'Mobilità', 2, '10', 30),
  ex('Stretching catena posteriore', 'Mobilità', 2, '45 sec', 15),
];

export const MUSCLE_GROUPS = [...new Set(EXERCISES.map((e) => e.group))];

export function searchExercises(query = '') {
  const q = query.trim().toLowerCase();
  return EXERCISES.filter((e) => !q || e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q));
}

export const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180];
export const REPS_PRESETS = ['5', '6 - 8', '8 - 10', '10 - 12', '12 - 15', '15 - 20', '30 sec', '45 sec', '1 min'];
export const FOCUS_OPTIONS = ['Upper Body', 'Lower Body', 'Full Body', 'Push', 'Pull', 'Core', 'Cardio', 'Mobilità'];

/** Sessioni modello: riempiono nome, focus, descrizione ed esercizi con un clic. */
export const SESSION_TEMPLATES = [
  {
    id: 'upper',
    name: 'Forza parte superiore',
    focus: 'Upper Body',
    description: 'Forza e stabilità della parte superiore, con attenzione a postura e core.',
    exercises: ['Panca piana bilanciere', 'Rematore manubri', 'Lat machine', 'Shoulder press', 'Alzate laterali'],
  },
  {
    id: 'lower',
    name: 'Gambe e glutei',
    focus: 'Lower Body',
    description: 'Forza e controllo di gambe e glutei, con attenzione alla tecnica.',
    exercises: ['Squat bilanciere', 'Affondi camminati', 'Hip thrust', 'Leg curl', 'Calf raise'],
  },
  {
    id: 'full',
    name: 'Full body funzionale',
    focus: 'Full Body',
    description: 'Circuito funzionale per forza e condizionamento generale.',
    exercises: ['Stacco rumeno', 'Push up', 'Kettlebell swing', 'Trazioni assistite', 'Plank'],
  },
  {
    id: 'push',
    name: 'Spinta (Push)',
    focus: 'Push',
    description: 'Petto, spalle e tricipiti.',
    exercises: ['Panca piana bilanciere', 'Panca inclinata manubri', 'Shoulder press', 'Alzate laterali', 'Push down ai cavi'],
  },
  {
    id: 'pull',
    name: 'Tirata (Pull)',
    focus: 'Pull',
    description: 'Dorso e bicipiti, con lavoro per la postura.',
    exercises: ['Trazioni alla sbarra', 'Rematore bilanciere', 'Pulley basso', 'Face pull', 'Curl bilanciere'],
  },
  {
    id: 'core',
    name: 'Core e mobilità',
    focus: 'Core',
    description: 'Stabilità del tronco e mobilità articolare per muoverti meglio ogni giorno.',
    exercises: ['Plank', 'Dead bug', 'Pallof press', 'Mobilità anche', 'Mobilità toracica'],
  },
  {
    id: 'cardio',
    name: 'Cardio e resistenza',
    focus: 'Cardio',
    description: 'Lavoro aerobico a intensità moderata per resistenza e recupero.',
    exercises: ['Tapis roulant', 'Vogatore', 'Bike a intervalli'],
  },
];

export const exerciseByName = (name) => EXERCISES.find((e) => e.name === name);

/** Durata stimata di una sessione in minuti: riscaldamento + serie (≈ 40 s di lavoro) + recuperi. */
export function estimateMinutes(exercises) {
  const seconds = exercises.reduce((s, e) => {
    const sets = Number(e.sets) || 0;
    const rest = Number(e.restSec) || 0;
    const work = /min/.test(e.reps ?? '') ? (parseInt(e.reps, 10) || 1) * 60 : 40;
    return s + sets * work + Math.max(0, sets - 1) * rest;
  }, 0);
  return seconds ? Math.round((seconds / 60 + 8) / 5) * 5 : 0;
}

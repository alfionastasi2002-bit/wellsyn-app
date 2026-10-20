import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

export const MEAL_TYPES = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'];
export const FOOD_UNITS = ['g', 'ml', 'pz', 'fetta', 'cucchiaio', 'cucchiaino', 'tazza', 'porzione', 'q.b.'];
export const MAX_PLAN_DAYS = 14;

// Un alimento del pasto: quantità, unità, alternativa e valori nutrizionali per quella quantità.
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    food: { type: String, trim: true }, // codice dell'alimento nella libreria (se scelto da lì)
    // Alimento della banca dati o prodotto confezionato: valori per 100 g (o 100 ml) e peso di una porzione,
    // per ricalcolare calorie e macronutrienti quando cambiano quantità o unità
    foodInfo: {
      type: new mongoose.Schema({ kcal: Number, protein: Number, carbs: Number, fat: Number, portion: Number, emoji: String }, { _id: false }),
      default: undefined,
    },
    quantity: Number,
    unit: { type: String, enum: FOOD_UNITS },
    alternative: { type: String, trim: true },
    kcal: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
  },
  { _id: false },
);

const mealSchema = new mongoose.Schema(
  {
    type: { type: String, enum: MEAL_TYPES, required: true },
    label: { type: String, trim: true }, // nome personalizzato (es. "Spuntino mattutino")
    start: String, // "HH:MM"
    end: String,
    items: [itemSchema],
    note: { type: String, trim: true },
    // Riepilogo: elenco degli alimenti (o il piatto, nei piani creati prima degli alimenti)
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    // Totali del pasto (calcolati dagli alimenti)
    kcal: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
  },
  { _id: false },
);

const daySchema = new mongoose.Schema(
  {
    // Con 7 giorni il giorno 1 è il lunedì; con un numero diverso i giorni ruotano dalla data di inizio.
    dayIndex: { type: Number, min: 1, max: MAX_PLAN_DAYS, required: true },
    meals: [mealSchema],
  },
  { _id: false },
);

const mealPlanSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    nutritionist: { type: ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    goal: { type: String, trim: true },
    // Introduzione e obiettivi del piano (testo formattato, già ripulito dal server)
    intro: String,
    // Vecchie linee guida in testo semplice (piani creati prima dell'introduzione formattata)
    guidelines: { type: String, trim: true },
    // Fabbisogni giornalieri
    kcalTarget: Number,
    proteinTarget: Number,
    carbsTarget: Number,
    fatTarget: Number,
    waterLiters: Number,
    // Note e preferenze del cliente per questo piano
    notes: [{ type: String, trim: true }],
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
    needsReview: { type: Boolean, default: false },
    startDate: Date,
    days: [daySchema],
  },
  { timestamps: true },
);

export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

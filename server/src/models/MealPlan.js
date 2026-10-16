import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

export const MEAL_TYPES = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'];

const mealSchema = new mongoose.Schema(
  {
    type: { type: String, enum: MEAL_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    kcal: Number,
    // Macronutrienti in grammi (facoltativi)
    protein: Number,
    carbs: Number,
    fat: Number,
  },
  { _id: false },
);

const daySchema = new mongoose.Schema(
  {
    dayIndex: { type: Number, min: 1, max: 7, required: true }, // 1 = lunedì
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
    kcalTarget: Number,
    guidelines: { type: String, trim: true },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
    needsReview: { type: Boolean, default: false },
    startDate: Date,
    days: [daySchema],
  },
  { timestamps: true },
);

export const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

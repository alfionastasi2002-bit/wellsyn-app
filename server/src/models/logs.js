import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Registro degli allenamenti svolti dal cliente (uno al giorno).
const workoutLogSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true },
    plan: { type: ObjectId, ref: 'WorkoutPlan' },
    sessionName: String,
    day: { type: String, required: true }, // "YYYY-MM-DD"
    completed: { type: Boolean, default: true },
  },
  { timestamps: true },
);
workoutLogSchema.index({ client: 1, day: 1 }, { unique: true });

// Registro dei pasti consumati dal cliente.
const mealLogSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true },
    plan: { type: ObjectId, ref: 'MealPlan' },
    day: { type: String, required: true },
    mealType: { type: String, required: true },
    done: { type: Boolean, default: true },
  },
  { timestamps: true },
);
mealLogSchema.index({ client: 1, day: 1, mealType: 1 }, { unique: true });

export const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);
export const MealLog = mongoose.model('MealLog', mealLogSchema);

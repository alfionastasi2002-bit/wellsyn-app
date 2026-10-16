import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sets: Number,
    reps: String, // es. "8 - 10"
    restSec: Number,
    notes: String,
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // es. "Forza parte superiore"
  focus: String, // es. "Upper Body"
  description: String,
  durationMin: Number,
  dayOfWeek: { type: Number, min: 1, max: 7 }, // 1 = lunedì
  exercises: [exerciseSchema],
});

const workoutPlanSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    trainer: { type: ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    level: { type: String, enum: ['principiante', 'intermedio', 'avanzato'], default: 'intermedio' },
    weeks: { type: Number, default: 4 },
    startDate: Date,
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
    needsReview: { type: Boolean, default: false },
    sessions: [sessionSchema],
  },
  { timestamps: true },
);

export const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Controllo/misurazione del cliente: registrato da un professionista
// oppure dal cliente stesso (es. pesata settimanale).
const checkInSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true },
    professional: { type: ObjectId, ref: 'User' },
    source: { type: String, enum: ['nutritionist', 'trainer', 'self'], required: true },
    date: { type: Date, required: true },
    weightKg: Number,
    waistCm: Number,
    hipsCm: Number,
    bodyFatPct: Number,
    muscleMassKg: Number,
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);
checkInSchema.index({ client: 1, date: -1 });

export const CheckIn = mongoose.model('CheckIn', checkInSchema);

import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const appointmentSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    professional: { type: ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    durationMin: { type: Number, default: 60 },
    // "check" = controllo/visita, "session" = sessione di allenamento
    kind: { type: String, enum: ['check', 'session'], default: 'check' },
    type: { type: String, required: true, trim: true }, // es. "Check-up nutrizionale"
    location: String,
    notes: String,
    status: { type: String, enum: ['scheduled', 'done', 'cancelled'], default: 'scheduled' },
  },
  { timestamps: true },
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);

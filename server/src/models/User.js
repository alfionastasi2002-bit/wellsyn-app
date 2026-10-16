import mongoose from 'mongoose';

export const ROLES = ['client', 'nutritionist', 'trainer'];
export const PROFESSIONAL_ROLES = ['nutritionist', 'trainer'];
export const AVATAR_COLORS = ['mint', 'peach', 'indigo', 'rose', 'olive', 'sky'];
export const COVER_STYLES = ['mint', 'ocean', 'sunset', 'forest', 'lavender', 'sand'];
export const ACTIVITY_LEVELS = ['sedentario', 'leggero', 'moderato', 'attivo', 'molto_attivo'];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    title: { type: String, trim: true, maxlength: 20 }, // es. "Dott.ssa"
    avatarUrl: String, // foto profilo (immagine piccola salvata come data URL)
    avatarColor: { type: String, enum: AVATAR_COLORS },
    coverStyle: { type: String, enum: COVER_STYLES },
    phone: String,
    city: { type: String, trim: true, maxlength: 60 },
    birthDate: String, // "YYYY-MM-DD"
    // Professionisti
    specialization: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, trim: true, maxlength: 280 },
    specialties: [{ type: String, trim: true, maxlength: 40 }],
    yearsExperience: Number,
    studioAddress: { type: String, trim: true, maxlength: 120 },
    onlineSessions: Boolean,
    // Orario di lavoro: l'agenda lo evidenzia e propone gli orari liberi
    workingHours: {
      days: [{ type: Number, min: 1, max: 7 }],
      start: String, // "09:00"
      end: String, // "18:00"
    },
    appointmentMinutes: Number, // durata predefinita di un nuovo appuntamento
    // Clienti
    goal: { type: String, trim: true, maxlength: 140 },
    startWeightKg: Number,
    targetWeightKg: Number,
    heightCm: Number,
    activityLevel: { type: String, enum: ACTIVITY_LEVELS },
    dietPreferences: [{ type: String, trim: true, maxlength: 40 }],
    allergies: { type: String, trim: true, maxlength: 200 },
    // Interfaccia
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'] },
      language: { type: String, enum: ['it', 'en'] },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

export const User = mongoose.model('User', userSchema);

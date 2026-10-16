import mongoose from 'mongoose';

export const ROLES = ['client', 'nutritionist', 'trainer'];
export const PROFESSIONAL_ROLES = ['nutritionist', 'trainer'];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    title: { type: String, trim: true, maxlength: 20 }, // es. "Dott.ssa"
    avatarUrl: String,
    phone: String,
    // Professionisti
    specialization: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, trim: true, maxlength: 280 },
    // Clienti
    goal: { type: String, trim: true, maxlength: 140 },
    startWeightKg: Number,
    heightCm: Number,
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

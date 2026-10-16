import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// Collegamento tra un cliente e un professionista.
// - status: "pending" finché il cliente non accetta, poi "active".
// - sharedAccess: autorizzazione del cliente. Se true, questo professionista può
//   vedere i dati pertinenti raccolti dagli altri professionisti del cliente
//   (es. il trainer vede i check nutrizionali, la nutrizionista vede l'aderenza agli allenamenti).
const careLinkSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'User', required: true, index: true },
    professional: { type: ObjectId, ref: 'User', required: true, index: true },
    professionalRole: { type: String, enum: ['nutritionist', 'trainer'], required: true },
    status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
    sharedAccess: { type: Boolean, default: false },
    program: { type: String, trim: true, maxlength: 60 }, // es. "Definizione"
    invitedBy: { type: String, enum: ['professional', 'client'], default: 'professional' },
  },
  { timestamps: true },
);

careLinkSchema.index({ client: 1, professional: 1 }, { unique: true });

export const CareLink = mongoose.model('CareLink', careLinkSchema);

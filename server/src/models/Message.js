import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    from: { type: ObjectId, ref: 'User', required: true },
    to: { type: ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: Date,
  },
  { timestamps: true },
);

export const Message = mongoose.model('Message', messageSchema);

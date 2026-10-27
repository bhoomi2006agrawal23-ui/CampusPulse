import mongoose, { Document, Schema } from 'mongoose';

export interface IJudge extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roleDescription?: string;
  assignedAt: Date;
  isFinalized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JudgeSchema = new Schema<IJudge>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    roleDescription: {
      type: String,
      maxlength: 150,
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isFinalized: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

JudgeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Judge = mongoose.models.Judge || mongoose.model<IJudge>('Judge', JudgeSchema);

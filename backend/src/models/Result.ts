import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  participantId: mongoose.Types.ObjectId;
  registrationId: mongoose.Types.ObjectId;
  judgeId?: mongoose.Types.ObjectId;
  rank?: number;
  score: number;
  criteriaScores?: {
    innovation?: number;
    technical?: number;
    impact?: number;
    presentation?: number;
  };
  awardTitle?: string;
  judgeFeedback?: string;
  isPublished: boolean;
  isFinalized?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant is required'],
      index: true,
    },
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Registration',
      required: [true, 'Registration is required'],
    },
    judgeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    rank: {
      type: Number,
      min: 1,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
      max: [1000, 'Score cannot exceed 1000'],
    },
    criteriaScores: {
      innovation: { type: Number, min: 0, max: 100 },
      technical: { type: Number, min: 0, max: 100 },
      impact: { type: Number, min: 0, max: 100 },
      presentation: { type: Number, min: 0, max: 100 },
    },
    awardTitle: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    judgeFeedback: {
      type: String,
      maxlength: 1000,
    },
    isPublished: {
      type: Boolean,
      default: false,
      required: true,
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ResultSchema.index({ eventId: 1, participantId: 1 }, { unique: true });
ResultSchema.index({ eventId: 1, rank: 1 });
ResultSchema.index({ eventId: 1, judgeId: 1 });

export const Result = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);

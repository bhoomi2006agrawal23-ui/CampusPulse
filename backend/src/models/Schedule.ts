import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  venueId?: mongoose.Types.ObjectId;
  trackName?: string;
  speakerOrLead?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    startDateTime: {
      type: Date,
      required: [true, 'Start date & time is required'],
    },
    endDateTime: {
      type: Date,
      required: [true, 'End date & time is required'],
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: false,
    },
    trackName: {
      type: String,
      default: 'Main Track',
      trim: true,
    },
    speakerOrLead: {
      type: String,
      maxlength: 100,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ScheduleSchema.index({ eventId: 1, startDateTime: 1 });
ScheduleSchema.index({ venueId: 1 });

export const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);

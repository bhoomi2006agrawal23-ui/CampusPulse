import mongoose, { Document, Schema } from 'mongoose';

export interface IVolunteer extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assignedRole: string;
  shiftStart?: Date;
  shiftEnd?: Date;
  location?: string;
  isCheckedIn?: boolean;
  checkedInAt?: Date;
  notes?: string;
  status: 'Assigned' | 'Confirmed' | 'Completed' | 'Declined';
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerSchema = new Schema<IVolunteer>(
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
    assignedRole: {
      type: String,
      required: [true, 'Assigned role is required'],
      maxlength: 100,
      trim: true,
    },
    shiftStart: {
      type: Date,
    },
    shiftEnd: {
      type: Date,
    },
    location: {
      type: String,
      maxlength: 150,
      trim: true,
    },
    isCheckedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['Assigned', 'Confirmed', 'Completed', 'Declined'],
      default: 'Assigned',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

VolunteerSchema.index({ eventId: 1, userId: 1 }, { unique: true });
VolunteerSchema.index({ userId: 1, shiftStart: 1, shiftEnd: 1 });

export const Volunteer =
  mongoose.models.Volunteer || mongoose.model<IVolunteer>('Volunteer', VolunteerSchema);

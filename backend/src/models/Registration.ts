import mongoose, { Document, Schema } from 'mongoose';

export interface IRegistration extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  registrationCode: string;
  status: 'Confirmed' | 'Cancelled' | 'Waitlisted';
  registeredAt: Date;
  attendanceStatus: 'Unmarked' | 'Attended' | 'Absent' | 'Excused';
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
      index: true,
    },
    registrationCode: {
      type: String,
      required: [true, 'Registration code is required'],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled', 'Waitlisted'],
      default: 'Confirmed',
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    attendanceStatus: {
      type: String,
      enum: ['Unmarked', 'Attended', 'Absent', 'Excused'],
      default: 'Unmarked',
      required: true,
      index: true,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// Locked requirement: Compound unique index for duplicate registration prevention
RegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
RegistrationSchema.index({ registrationCode: 1 }, { unique: true });
RegistrationSchema.index({ studentId: 1, status: 1 });
RegistrationSchema.index({ eventId: 1, attendanceStatus: 1 });

export const Registration =
  mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);

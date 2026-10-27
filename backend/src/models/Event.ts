import mongoose, { Document, Schema } from 'mongoose';
import { EVENT_LIFECYCLE_STATES, EventLifecycleState } from '../constants/lifecycle.js';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  eventCode: string;
  slug: string;
  description: string;
  collegeName?: string;
  categoryId: mongoose.Types.ObjectId;
  organizerId: mongoose.Types.ObjectId;
  primaryVenueId: mongoose.Types.ObjectId; // MANDATORY
  startDateTime: Date;
  endDateTime: Date;
  registrationStart: Date;
  registrationEnd: Date;
  capacity: number;
  registeredCount: number;
  status: EventLifecycleState;
  bannerUrl?: string;
  eligibility?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    eventCode: {
      type: String,
      required: [true, 'Event code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },
    collegeName: {
      type: String,
      required: false,
      trim: true,
      index: true,
      maxlength: 150,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
      index: true,
    },
    primaryVenueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Primary venue is mandatory'],
      index: true,
    },
    startDateTime: {
      type: Date,
      required: [true, 'Start date & time is required'],
    },
    endDateTime: {
      type: Date,
      required: [true, 'End date & time is required'],
    },
    registrationStart: {
      type: Date,
      required: [true, 'Registration start date & time is required'],
    },
    registrationEnd: {
      type: Date,
      required: [true, 'Registration end date & time is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: EVENT_LIFECYCLE_STATES,
        message: 'Invalid event lifecycle state',
      },
      default: 'Draft',
      required: true,
      index: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    eligibility: {
      type: String,
      maxlength: 500,
    },
    instructions: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ eventCode: 1 }, { unique: true });
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ categoryId: 1 });
EventSchema.index({ organizerId: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ startDateTime: 1, endDateTime: 1 });
EventSchema.index({ primaryVenueId: 1, startDateTime: 1, endDateTime: 1 }); // Query acceleration index

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

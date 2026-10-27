import mongoose, { Document, Schema } from 'mongoose';

export interface IVenue extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  collegeName?: string;
  building: string;
  capacity: number;
  amenities: string[];
  contactPerson?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true,
      maxlength: 100,
    },
    collegeName: {
      type: String,
      required: false,
      trim: true,
      index: true,
      maxlength: 150,
    },
    building: {
      type: String,
      required: [true, 'Building or zone name is required'],
      trim: true,
      maxlength: 100,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

VenueSchema.index({ name: 1, collegeName: 1 }, { unique: true });
VenueSchema.index({ collegeName: 1 });
VenueSchema.index({ capacity: 1 });

export const Venue = mongoose.models.Venue || mongoose.model<IVenue>('Venue', VenueSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  _id: mongoose.Types.ObjectId;
  certificateId: string;
  eventId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientName: string;
  certificateType: 'Participation' | 'Merit' | 'Appreciation' | 'Organizer';
  issueDate: Date;
  verificationHash: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: {
      type: String,
      required: [true, 'Certificate ID is required'],
      unique: true,
      trim: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    certificateType: {
      type: String,
      enum: ['Participation', 'Merit', 'Appreciation', 'Organizer'],
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    verificationHash: {
      type: String,
      required: [true, 'Verification hash is required'],
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

CertificateSchema.index({ certificateId: 1 }, { unique: true });
CertificateSchema.index({ eventId: 1, recipientId: 1, certificateType: 1 }, { unique: true });

export const Certificate =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);

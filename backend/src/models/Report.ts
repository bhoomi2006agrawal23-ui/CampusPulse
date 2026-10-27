import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  reportType: 'EventSummary' | 'AttendanceAudit' | 'RegistrationDemographics' | 'SystemMetrics';
  eventId?: mongoose.Types.ObjectId;
  generatedById: mongoose.Types.ObjectId;
  parameters?: Record<string, unknown>;
  dataSummary: Record<string, unknown>;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportType: {
      type: String,
      enum: ['EventSummary', 'AttendanceAudit', 'RegistrationDemographics', 'SystemMetrics'],
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: false,
    },
    generatedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    parameters: {
      type: Schema.Types.Mixed,
    },
    dataSummary: {
      type: Schema.Types.Mixed,
      required: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ generatedById: 1, createdAt: -1 });
ReportSchema.index({ eventId: 1 });

export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

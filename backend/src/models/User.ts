import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, UserRole, VALID_ROLES } from '../constants/roles.js';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  loginId?: string;
  mustChangePassword?: boolean;
  passwordHash: string;
  role: UserRole;
  collegeName?: string;
  phoneNumber?: string;
  bio?: string;
  profileInfo?: {
    collegeName?: string;
    department?: string;
    studentId?: string;
    year?: number;
    avatarUrl?: string;
  };
  status: 'Active' | 'Suspended' | 'Pending';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    loginId: {
      type: String,
      required: false,
      sparse: true,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Login ID cannot exceed 50 characters'],
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    collegeName: {
      type: String,
      required: false,
      trim: true,
      maxlength: [150, 'College name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address format'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return passwordHash in standard queries
    },
    role: {
      type: String,
      enum: {
        values: VALID_ROLES,
        message: 'Invalid user role',
      },
      default: ROLES.STUDENT,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    bio: {
      type: String,
      required: false,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      trim: true,
    },
    profileInfo: {
      collegeName: { type: String, trim: true },
      department: { type: String, trim: true },
      studentId: { type: String, trim: true },
      year: { type: Number },
      avatarUrl: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Pending'],
      default: 'Active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ loginId: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

import { Schema, model, Document } from 'mongoose';

export interface UserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';

  // anti-spam / blocking
  warning_count: number;
  last_warning_at?: Date;
  is_online_booking_blocked: boolean;
  block_reason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // anti-spam / blocking
    warning_count: { type: Number, default: 0 },
    last_warning_at: { type: Date },
    is_online_booking_blocked: { type: Boolean, default: false },
    block_reason: { type: String },
  },
  { timestamps: true },
);

export const User = model<UserDoc>('User', UserSchema);

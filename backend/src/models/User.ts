import { Schema, model, Document, Types } from 'mongoose';

export interface UserDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;          // stored hash
  role: 'user' | 'admin';
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
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true },
);

export const User = model<UserDoc>('User', UserSchema);

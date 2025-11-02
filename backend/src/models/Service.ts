import { Schema, model, type Document } from 'mongoose';

export interface ServiceDoc extends Document {
  name: string;
  durationMin: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<ServiceDoc>(
  {
    name: { type: String, required: true, trim: true },
    durationMin: { type: Number, required: true, min: 5 },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// 🔒 Enforce unique names at the DB level
ServiceSchema.index({ name: 1 }, { unique: true });

export const Service = model<ServiceDoc>('Service', ServiceSchema);

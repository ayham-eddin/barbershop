import { Schema, model, Document, Types } from 'mongoose';

export interface ServiceItem {
  name: string;
  durationMin: number; // 15–180
  price: number;       // cents or basic number
}

export interface WorkingBlock {
  // weekday: 0=Sun … 6=Sat
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string; // "09:00"
  end: string;   // "17:30"
}

export interface BarberDoc extends Document<Types.ObjectId> {
  name: string;
  specialties: string[];
  services: ServiceItem[];
  workingHours: WorkingBlock[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<ServiceItem>(
  {
    name: { type: String, required: true, trim: true },
    durationMin: { type: Number, required: true, min: 5, max: 480 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const WorkingSchema = new Schema<WorkingBlock>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true }, // "HH:mm"
    end: { type: String, required: true },
  },
  { _id: false },
);

const BarberSchema = new Schema<BarberDoc>(
  {
    name: { type: String, required: true, trim: true },
    specialties: { type: [String], default: [] },
    services: { type: [ServiceSchema], default: [] },
    workingHours: { type: [WorkingSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Barber = model<BarberDoc>('Barber', BarberSchema);

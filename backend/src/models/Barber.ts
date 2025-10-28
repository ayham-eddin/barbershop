import { Schema, model, type Document, Types } from 'mongoose';

export interface WorkingHour {
  day: 0|1|2|3|4|5|6;   // 0 = Sunday
  start: string;        // "09:00"
  end: string;          // "17:00"
}

export interface BarberDoc extends Document {
  name: string;
  workingHours: WorkingHour[];
  services: Types.ObjectId[]; // refs Service
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHourSchema = new Schema<WorkingHour>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false },
);

const BarberSchema = new Schema<BarberDoc>(
  {
    name: { type: String, required: true, trim: true },
    workingHours: { type: [WorkingHourSchema], default: [] },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  },
  { timestamps: true },
);

export const Barber = model<BarberDoc>('Barber', BarberSchema);

import { Schema, model, Document, Types } from 'mongoose';

export type ApptStatus = 'booked' | 'cancelled' | 'completed';

export interface AppointmentDoc extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  barberId: Types.ObjectId;
  serviceName: string;
  durationMin: number;
  startsAt: Date;
  endsAt: Date;
  status: ApptStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<AppointmentDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    barberId: { type: Schema.Types.ObjectId, ref: 'Barber', required: true },
    serviceName: { type: String, required: true },
    durationMin: { type: Number, required: true, min: 5, max: 480 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['booked', 'cancelled', 'completed'],
      default: 'booked',
    },
    notes: { type: String },
  },
  { timestamps: true },
);

AppointmentSchema.index(
  { barberId: 1, startsAt: 1, endsAt: 1 },
);

export const Appointment = model<AppointmentDoc>(
  'Appointment',
  AppointmentSchema,
);

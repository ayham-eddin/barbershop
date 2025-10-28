import { Schema, model, type Document, Types } from 'mongoose';

export interface TimeOffDoc extends Document {
  barberId: Types.ObjectId;
  start: Date;         // inclusive
  end: Date;           // exclusive
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeOffSchema = new Schema<TimeOffDoc>(
  {
    barberId: { type: Schema.Types.ObjectId, ref: 'Barber', required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    reason: { type: String },
  },
  { timestamps: true },
);

TimeOffSchema.index({ barberId: 1, start: 1, end: 1 });

export const TimeOff = model<TimeOffDoc>('TimeOff', TimeOffSchema);

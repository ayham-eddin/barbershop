// src/models/AuditLog.ts
import { Schema, model, type Document, Types } from 'mongoose';

export interface AuditLogDoc extends Document<Types.ObjectId> {
  actorId: Types.ObjectId | null;   // who did it (can be null for system)
  action: string;                   // e.g., "booking.create", "booking.no_show", "user.unblock"
  entityType: 'booking' | 'user' | 'service' | 'barber';
  entityId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, trim: true },
    entityType: {
      type: String,
      enum: ['booking', 'user', 'service', 'barber'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLog = model<AuditLogDoc>('AuditLog', AuditLogSchema);

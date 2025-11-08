import { Schema, model, Document, Types } from 'mongoose';

export interface AuditLogDoc extends Document<Types.ObjectId> {
  actorId: Types.ObjectId | null; // null for system
  action: string; // e.g. "booking.create", "booking.reschedule", "booking.no_show", "user.unblock"
  entityType: 'booking' | 'user';
  entityId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    entityType: { type: String, enum: ['booking', 'user'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditLog = model<AuditLogDoc>('AuditLog', AuditLogSchema);

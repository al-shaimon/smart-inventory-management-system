import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLogDoc extends Document {
  action: string;
  entityType: 'Order' | 'Product' | 'Restock' | 'Category' | 'Auth';
  entityId?: string;
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLogDoc>(
  {
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['Order', 'Product', 'Restock', 'Category', 'Auth'],
      required: true,
    },
    entityId: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });

if (mongoose.models.ActivityLog) {
  delete mongoose.models.ActivityLog;
}
const ActivityLog = mongoose.model<IActivityLogDoc>('ActivityLog', ActivityLogSchema);
export default ActivityLog;

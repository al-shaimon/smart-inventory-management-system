import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLogDoc extends Document {
  action: string;
  entityType: 'Order' | 'Product' | 'Restock' | 'Category' | 'Auth';
  entityId?: string;
  userId: mongoose.Types.ObjectId;
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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });

const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model<IActivityLogDoc>('ActivityLog', ActivityLogSchema);
export default ActivityLog;

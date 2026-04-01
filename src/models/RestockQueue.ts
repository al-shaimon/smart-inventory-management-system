import mongoose, { Schema, Document } from 'mongoose';

export interface IRestockQueueDoc extends Document {
  product: mongoose.Types.ObjectId;
  currentStock: number;
  threshold: number;
  priority: 'High' | 'Medium' | 'Low';
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RestockQueueSchema = new Schema<IRestockQueueDoc>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    currentStock: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0 },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

if (mongoose.models.RestockQueue) {
  delete mongoose.models.RestockQueue;
}
const RestockQueue = mongoose.model<IRestockQueueDoc>('RestockQueue', RestockQueueSchema);
export default RestockQueue;

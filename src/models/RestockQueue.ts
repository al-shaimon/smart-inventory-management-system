import mongoose, { Schema, Document } from 'mongoose';

export interface IRestockQueueDoc extends Document {
  product: mongoose.Types.ObjectId;
  currentStock: number;
  threshold: number;
  priority: 'High' | 'Medium' | 'Low';
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RestockQueueSchema = new Schema<IRestockQueueDoc>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    currentStock: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0 },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const RestockQueue =
  mongoose.models.RestockQueue || mongoose.model<IRestockQueueDoc>('RestockQueue', RestockQueueSchema);
export default RestockQueue;

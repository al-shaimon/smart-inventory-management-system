// Store-scoped category model
import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDoc extends Document {
  name: string;
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ name: 1, adminId: 1 }, { unique: true });

if (mongoose.models.Category) {
  delete mongoose.models.Category;
}
const Category = mongoose.model<ICategoryDoc>('Category', CategorySchema);
export default Category;

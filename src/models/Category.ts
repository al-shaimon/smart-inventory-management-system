import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDoc extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ name: 1, userId: 1 }, { unique: true });

const Category = mongoose.models.Category || mongoose.model<ICategoryDoc>('Category', CategorySchema);
export default Category;

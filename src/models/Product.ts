import mongoose, { Schema, Document } from 'mongoose';

export interface IProductDoc extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  price: number;
  stockQuantity: number;
  minStockThreshold: number;
  status: 'Active' | 'Out of Stock';
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ProductSchema = new Schema<IProductDoc>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    minStockThreshold: { type: Number, required: true, min: 0, default: 5 },
    status: { type: String, enum: ['Active', 'Out of Stock'], default: 'Active' },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text' });

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
const Product = mongoose.model<IProductDoc>('Product', ProductSchema);
export default Product;

import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItemDoc {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrderDoc extends Document {
  orderNumber: number;
  customerName: string;
  items: IOrderItemDoc[];
  totalPrice: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItemDoc>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDoc>(
  {
    orderNumber: { type: Number, unique: true },
    customerName: { type: String, required: true, trim: true },
    items: { type: [OrderItemSchema], required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-increment orderNumber
OrderSchema.pre('save', async function () {
  if (this.isNew) {
    const lastOrder = await mongoose.models.Order
      .findOne({}, { orderNumber: 1 })
      .sort({ orderNumber: -1 })
      .lean();
    this.orderNumber = lastOrder ? (lastOrder as IOrderDoc).orderNumber + 1 : 1001;
  }
});

const Order = mongoose.models.Order || mongoose.model<IOrderDoc>('Order', OrderSchema);
export default Order;

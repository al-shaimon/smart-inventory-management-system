import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────
export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long.' })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }).trim(),
});

// ─── Category Schemas ────────────────────────────────────────────────
export const CategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Category name must be at least 2 characters.' })
    .trim(),
});

// ─── Product Schemas ─────────────────────────────────────────────────
export const ProductSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Product name must be at least 2 characters.' })
    .trim(),
  category: z.string().min(1, { message: 'Category is required.' }),
  price: z.number().positive({ message: 'Price must be positive.' }),
  stockQuantity: z
    .number()
    .int()
    .min(0, { message: 'Stock cannot be negative.' }),
  minStockThreshold: z
    .number()
    .int()
    .min(0, { message: 'Threshold cannot be negative.' }),
});

// ─── Order Schemas ───────────────────────────────────────────────────
export const OrderItemSchema = z.object({
  product: z.string().min(1, { message: 'Product is required.' }),
  quantity: z.number().int().positive({ message: 'Quantity must be at least 1.' }),
  price: z.number().positive(),
});

export const OrderSchema = z.object({
  customerName: z
    .string()
    .min(2, { message: 'Customer name must be at least 2 characters.' })
    .trim(),
  items: z
    .array(OrderItemSchema)
    .min(1, { message: 'At least one item is required.' }),
});

// ─── Types ───────────────────────────────────────────────────────────
export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | undefined;

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type ProductStatus = 'Active' | 'Out of Stock';
export type RestockPriority = 'High' | 'Medium' | 'Low';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager';
  adminId?: string;
  createdAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  adminId: string;
  createdAt: Date;
}

export interface IProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  minStockThreshold: number;
  status: ProductStatus;
  adminId: string;
  createdAt: Date;
}

export interface IPopulatedProduct extends Omit<IProduct, 'category'> {
  category: { _id: string; name: string };
}

export interface IOrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface IPopulatedOrderItem extends Omit<IOrderItem, 'product'> {
  product: { _id: string; name: string };
}

export interface IOrder {
  _id: string;
  orderNumber: number;
  customerName: string;
  items: IOrderItem[];
  totalPrice: number;
  status: OrderStatus;
  adminId: string;
  createdAt: Date;
}

export interface IPopulatedOrder extends Omit<IOrder, 'items'> {
  items: IPopulatedOrderItem[];
}

export interface IRestockQueue {
  _id: string;
  product: string;
  currentStock: number;
  threshold: number;
  priority: RestockPriority;
  adminId: string;
  createdAt: Date;
}

export interface IPopulatedRestockQueue extends Omit<IRestockQueue, 'product'> {
  product: IPopulatedProduct;
}

export interface IActivityLog {
  _id: string;
  action: string;
  entityType: 'Order' | 'Product' | 'Restock' | 'Category' | 'Auth';
  entityId?: string;
  adminId: string;
  createdAt: Date;
}

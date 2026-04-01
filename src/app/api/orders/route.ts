import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Order from '@/models/Order';
import Product from '@/models/Product';
import RestockQueue from '@/models/RestockQueue';
import { IPopulatedOrder, OrderSchema } from '@/lib/definitions';
import { logActivity } from '@/lib/activity';

function getRestockPriority(stock: number, threshold: number): 'High' | 'Medium' | 'Low' {
  if (stock === 0) return 'High';
  if (stock <= threshold * 0.5) return 'High';
  if (stock <= threshold) return 'Medium';
  return 'Low';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: { adminId: string; orderNumber?: number; customerName?: { $regex: string; $options: string }; status?: string; createdAt?: { $gte?: Date; $lte?: Date } } = { adminId: session.adminId };

    if (search) {
      const orderNum = parseInt(search);
      if (!isNaN(orderNum)) {
        filter.orderNumber = orderNum;
      } else {
        filter.customerName = { $regex: search, $options: 'i' };
      }
    }
    if (status) {
      filter.status = status;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) (filter.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (filter.createdAt as Record<string, Date>).$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as unknown as Promise<IPopulatedOrder[]>,
      Order.countDocuments(filter),
    ]);

    return Response.json({
      orders: orders.map((o) => ({
        ...o,
        _id: String(o._id),
        adminId: String(o.adminId),
        items: o.items.map((item) => ({
          ...item,
          product: item.product
            ? { _id: String(item.product._id), name: item.product.name }
            : null,
        })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = OrderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await dbConnect();

    const { customerName, items } = parsed.data;

    // Conflict Detection: Check for duplicate products in the order
    const productIds = items.map((item) => item.product);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      return Response.json(
        { error: 'This product is already added to the order.' },
        { status: 400 }
      );
    }

    // Validate all products and check stock
    const products = await Product.find({ _id: { $in: productIds }, adminId: session.adminId });

    if (products.length !== productIds.length) {
      return Response.json(
        { error: 'One or more products not found.' },
        { status: 404 }
      );
    }

    const errors: string[] = [];
    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.product);
      if (!product) continue;

      // Conflict Detection: Prevent ordering inactive products
      if (product.status === 'Out of Stock') {
        errors.push(`"${product.name}" is currently unavailable.`);
        continue;
      }

      // Stock validation
      if (item.quantity > product.stockQuantity) {
        errors.push(`Only ${product.stockQuantity} items available for "${product.name}".`);
      }
    }

    if (errors.length > 0) {
      return Response.json({ error: errors.join(' ') }, { status: 400 });
    }

    // Calculate total price and prepare items
    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product)!;
      return {
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create the order
    const order = await Order.create({
      customerName,
      items: orderItems,
      totalPrice,
      status: 'Pending',
      adminId: session.adminId,
    });

    // Deduct stock and update product status / restock queue
    for (const item of orderItems) {
      const product = products.find((p) => p._id.toString() === item.product.toString())!;
      const newStock = product.stockQuantity - item.quantity;

      await Product.findByIdAndUpdate(product._id, {
        stockQuantity: newStock,
        status: newStock === 0 ? 'Out of Stock' : 'Active',
      });

      // Add to restock queue if below threshold
      if (newStock <= product.minStockThreshold) {
        await RestockQueue.findOneAndUpdate(
          { product: product._id },
          {
            product: product._id,
            currentStock: newStock,
            threshold: product.minStockThreshold,
            priority: getRestockPriority(newStock, product.minStockThreshold),
            adminId: session.adminId,
          },
          { upsert: true, new: true }
        );

        if (newStock <= product.minStockThreshold) {
          await logActivity(
            `Product "${product.name}" added to Restock Queue`,
            'Restock',
            session.adminId,
            product._id.toString()
          );
        }
      }
    }

    await logActivity(
      `Order #${order.orderNumber} created by user`,
      'Order',
      session.adminId,
      order._id.toString()
    );

    return Response.json(
      { ...order.toObject(), _id: String(order._id), adminId: String(order.adminId) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Orders POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

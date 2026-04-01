import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Order from '@/models/Order';
import Product from '@/models/Product';
import RestockQueue from '@/models/RestockQueue';
import { IPopulatedOrder } from '@/lib/definitions';
import { logActivity } from '@/lib/activity';

function getRestockPriority(stock: number, threshold: number): 'High' | 'Medium' | 'Low' {
  if (stock === 0) return 'High';
  if (stock <= threshold * 0.5) return 'High';
  if (stock <= threshold) return 'Medium';
  return 'Low';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const order = await Order.findOne({ _id: id, adminId: session.adminId })
      .populate('items.product', 'name price stockQuantity status')
      .lean() as unknown as IPopulatedOrder | null;

    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    return Response.json({
      ...order,
      _id: String(order._id),
      adminId: String(order.adminId),
      items: order.items.map((item) => ({
        ...item,
        product: item.product
          ? { _id: String(item.product._id), name: item.product.name }
          : null,
      })),
    });
  } catch (error) {
    console.error('Order GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findOne({ _id: id, adminId: session.adminId });
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

    const oldStatus = order.status;

    // If cancelling, restore stock
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const newStock = product.stockQuantity + item.quantity;
          await Product.findByIdAndUpdate(product._id, {
            stockQuantity: newStock,
            status: newStock > 0 ? 'Active' : 'Out of Stock',
          });

          // Update restock queue
          if (newStock > product.minStockThreshold) {
            await RestockQueue.deleteOne({ product: product._id });
          } else {
            await RestockQueue.findOneAndUpdate(
              { product: product._id },
              {
                currentStock: newStock,
                priority: getRestockPriority(newStock, product.minStockThreshold),
              }
            );
          }
        }
      }
    }

    order.status = status;
    await order.save();

    await logActivity(
      `Order #${order.orderNumber} marked as ${status}`,
      'Order',
      session.adminId,
      id
    );

    return Response.json({
      ...order.toObject(),
      _id: String(order._id),
      adminId: String(order.adminId),
    });
  } catch (error) {
    console.error('Order PUT error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

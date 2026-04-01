import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import RestockQueue from '@/models/RestockQueue';
import Product from '@/models/Product';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const queue = await RestockQueue.find({ userId: session.userId })
      .populate('product', 'name price stockQuantity minStockThreshold status category')
      .sort({ currentStock: 1 })
      .lean();

    return Response.json(
      queue.map((item) => ({
        ...item,
        _id: String(item._id),
        userId: String(item.userId),
        product: item.product
          ? {
              ...item.product as Record<string, unknown>,
              _id: String((item.product as Record<string, unknown>)._id),
            }
          : null,
      }))
    );
  } catch (error) {
    console.error('Restock GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || !quantity || quantity <= 0) {
      return Response.json({ error: 'Valid product ID and quantity required' }, { status: 400 });
    }

    await dbConnect();

    const product = await Product.findOne({ _id: productId, userId: session.userId });
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    const newStock = product.stockQuantity + quantity;

    // Update product stock
    await Product.findByIdAndUpdate(productId, {
      stockQuantity: newStock,
      status: newStock > 0 ? 'Active' : 'Out of Stock',
    });

    // Remove from restock queue if above threshold
    if (newStock > product.minStockThreshold) {
      await RestockQueue.deleteOne({ product: productId });
    } else {
      // Update the queue entry
      const priority =
        newStock === 0
          ? 'High'
          : newStock <= product.minStockThreshold * 0.5
          ? 'High'
          : 'Medium';
      await RestockQueue.findOneAndUpdate(
        { product: productId },
        { currentStock: newStock, priority }
      );
    }

    await logActivity(
      `Stock updated for "${product.name}" (+${quantity} units)`,
      'Restock',
      session.userId,
      productId
    );

    return Response.json({ message: 'Stock updated successfully', newStock });
  } catch (error) {
    console.error('Restock POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

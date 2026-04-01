import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Product from '@/models/Product';
import RestockQueue from '@/models/RestockQueue';
import { ProductSchema } from '@/lib/definitions';
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

    const product = await Product.findOne({ _id: id, userId: session.userId })
      .populate('category', 'name')
      .lean();

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({
      ...product,
      _id: String(product._id),
      userId: String(product.userId),
    });
  } catch (error) {
    console.error('Product GET error:', error);
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
    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await dbConnect();

    const { name, category, price, stockQuantity, minStockThreshold } = parsed.data;

    const product = await Product.findOneAndUpdate(
      { _id: id, userId: session.userId },
      {
        name,
        category,
        price,
        stockQuantity,
        minStockThreshold,
        status: stockQuantity === 0 ? 'Out of Stock' : 'Active',
      },
      { new: true }
    );

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update restock queue
    if (stockQuantity <= minStockThreshold) {
      await RestockQueue.findOneAndUpdate(
        { product: product._id },
        {
          product: product._id,
          currentStock: stockQuantity,
          threshold: minStockThreshold,
          priority: getRestockPriority(stockQuantity, minStockThreshold),
          userId: session.userId,
        },
        { upsert: true, new: true }
      );
    } else {
      await RestockQueue.deleteOne({ product: product._id });
    }

    await logActivity(`Product "${product.name}" updated`, 'Product', session.userId, id);

    return Response.json({ ...product.toObject(), _id: String(product._id), userId: String(product.userId) });
  } catch (error) {
    console.error('Product PUT error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const product = await Product.findOneAndDelete({ _id: id, userId: session.userId });
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Remove from restock queue
    await RestockQueue.deleteOne({ product: id });

    await logActivity(`Product "${product.name}" deleted`, 'Product', session.userId, id);

    return Response.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

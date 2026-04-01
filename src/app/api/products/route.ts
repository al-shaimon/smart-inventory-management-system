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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter
    const filter: Record<string, unknown> = { userId: session.userId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return Response.json({
      products: products.map((p) => ({
        ...p,
        _id: String(p._id),
        userId: String(p.userId),
        category: p.category
          ? { _id: String((p.category as Record<string, unknown>)._id), name: (p.category as Record<string, unknown>).name }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await dbConnect();

    const { name, category, price, stockQuantity, minStockThreshold } = parsed.data;

    const product = await Product.create({
      name,
      category,
      price,
      stockQuantity,
      minStockThreshold,
      status: stockQuantity === 0 ? 'Out of Stock' : 'Active',
      userId: session.userId,
    });

    // Auto-add to restock queue if stock below threshold
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
    }

    await logActivity(`Product "${product.name}" added`, 'Product', session.userId, product._id.toString());

    return Response.json(
      { ...product.toObject(), _id: String(product._id), userId: String(product.userId) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Products POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Category from '@/models/Category';
import { CategorySchema } from '@/lib/definitions';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const categories = await Category.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(categories.map((c) => ({ ...c, _id: String(c._id), userId: String(c.userId) })));
  } catch (error) {
    console.error('Categories GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = CategorySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await dbConnect();

    // Check for duplicates
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${parsed.data.name}$`, 'i') },
      userId: session.userId,
    });
    if (existing) {
      return Response.json({ error: 'Category already exists' }, { status: 409 });
    }

    const category = await Category.create({
      name: parsed.data.name,
      userId: session.userId,
    });

    await logActivity(`Category "${category.name}" created`, 'Category', session.userId, category._id.toString());

    return Response.json(
      { ...category.toObject(), _id: String(category._id), userId: String(category.userId) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Categories POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

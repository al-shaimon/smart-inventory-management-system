import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Category from '@/models/Category';
import { CategorySchema } from '@/lib/definitions';
import { logActivity } from '@/lib/activity';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const parsed = CategorySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await dbConnect();

    // Check for name conflict
    const existing = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${parsed.data.name}$`, 'i') },
      adminId: session.adminId,
    });
    if (existing) {
      return Response.json({ error: 'Category name already exists' }, { status: 409 });
    }

    const category = await Category.findOneAndUpdate(
      { _id: id, adminId: session.adminId },
      { name: parsed.data.name },
      { new: true }
    );

    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    await logActivity(`Category updated to "${category.name}"`, 'Category', session.adminId, id);

    return Response.json({ ...category.toObject(), _id: String(category._id), adminId: String(category.adminId) });
  } catch (error) {
    console.error('Category PUT error:', error);
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
    if (session.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await dbConnect();

    const category = await Category.findOneAndDelete({ _id: id, adminId: session.adminId });
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    await logActivity(`Category "${category.name}" deleted`, 'Category', session.adminId, id);

    return Response.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Category DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

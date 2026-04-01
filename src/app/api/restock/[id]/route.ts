import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import RestockQueue from '@/models/RestockQueue';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const item = await RestockQueue.findOneAndDelete({ _id: id, userId: session.userId });
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

    return Response.json({ message: 'Removed from restock queue' });
  } catch (error) {
    console.error('Restock DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

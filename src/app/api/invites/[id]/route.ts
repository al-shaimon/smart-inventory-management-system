import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Invite from '@/models/Invite';

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

    const invite = await Invite.findOneAndDelete({ _id: id, adminId: session.adminId });
    if (!invite) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return Response.json({ message: 'Invitation revoked' });
  } catch (error) {
    console.error('Invite DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import ActivityLog from '@/models/ActivityLog';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const activities = await ActivityLog.find({ adminId: session.adminId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return Response.json(
      activities.map((a) => ({
        ...a,
        _id: String(a._id),
        adminId: String(a.adminId),
      }))
    );
  } catch (error) {
    console.error('Activity GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

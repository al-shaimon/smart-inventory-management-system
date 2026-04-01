import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Invite from '@/models/Invite';
import User from '@/models/User';
import { z } from 'zod';

const InviteCreateSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim().lowercase(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const [invites, managers] = await Promise.all([
      Invite.find({ adminId: session.adminId }).sort({ createdAt: -1 }).lean(),
      User.find({ adminId: session.adminId, role: 'manager' }).sort({ createdAt: -1 }).lean(),
    ]);

    return Response.json({
      invites: invites.map(i => ({ ...i, _id: String(i._id), adminId: String(i.adminId) })),
      managers: managers.map(m => ({
        _id: String(m._id),
        name: m.name,
        email: m.email,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Invites GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const parsed = InviteCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email } = parsed.data;

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    // Check if invite already exists
    const existingInvite = await Invite.findOne({ email });
    if (existingInvite) {
      return Response.json({ error: 'An invitation has already been sent to this email.' }, { status: 409 });
    }

    const invite = await Invite.create({
      email,
      adminId: session.adminId,
    });

    return Response.json({ ...invite.toObject(), _id: String(invite._id), adminId: String(invite.adminId) }, { status: 201 });
  } catch (error) {
    console.error('Invites POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

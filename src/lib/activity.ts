import dbConnect from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';

export async function logActivity(
  action: string,
  entityType: 'Order' | 'Product' | 'Restock' | 'Category' | 'Auth',
  adminId: string,
  entityId?: string
) {
  try {
    await dbConnect();
    await ActivityLog.create({
      action,
      entityType,
      entityId,
      adminId,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

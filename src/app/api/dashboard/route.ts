import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { getSession } from '@/lib/session';
import Order from '@/models/Order';
import Product from '@/models/Product';
import RestockQueue from '@/models/RestockQueue';
import ActivityLog, { IActivityLogDoc } from '@/models/ActivityLog';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const adminId = session.adminId;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get date range from query params (default: last 7 days)
    const searchParams = request.nextUrl.searchParams;
    const chartDays = parseInt(searchParams.get('chartDays') || '7');
    const chartStart = new Date(now.getTime() - chartDays * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [
      todayOrders,
      pendingOrders,
      completedOrders,
      lowStockCount,
      revenueToday,
      productSummary,
      recentActivity,
      chartData,
    ] = await Promise.all([
      // Total orders today
      Order.countDocuments({
        adminId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }),
      // Pending orders
      Order.countDocuments({ adminId, status: 'Pending' }),
      // Completed (Delivered) orders
      Order.countDocuments({ adminId, status: 'Delivered' }),
      // Low stock items
      RestockQueue.countDocuments({ adminId }),
      // Revenue today
      Order.aggregate([
        {
          $match: {
            adminId: new mongoose.Types.ObjectId(adminId),
            createdAt: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: 'Cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      // Product summary (first 10)
      Product.find({ adminId })
        .select('name stockQuantity minStockThreshold status')
        .sort({ stockQuantity: 1 })
        .limit(10)
        .lean(),
      // Recent activities
      ActivityLog.find({ adminId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Chart data - orders per day
      Order.aggregate([
        {
          $match: {
            adminId: new mongoose.Types.ObjectId(adminId),
            createdAt: { $gte: chartStart },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Fill in missing days for chart
    const filledChartData = [];
    for (let i = 0; i < chartDays; i++) {
      const date = new Date(chartStart.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const existing = chartData.find((d: { _id: string }) => d._id === dateStr);
      filledChartData.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: existing?.orders || 0,
        revenue: existing?.revenue || 0,
      });
    }

    return Response.json({
      todayOrders,
      pendingOrders,
      completedOrders,
      lowStockCount,
      revenueToday: revenueToday[0]?.total || 0,
      productSummary,
      recentActivity: recentActivity.map((a: IActivityLogDoc) => ({
        ...a,
        _id: String(a._id),
        adminId: String(a.adminId),
      })),
      chartData: filledChartData,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

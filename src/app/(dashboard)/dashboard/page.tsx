'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockCount: number;
  revenueToday: number;
  productSummary: Array<{
    _id: string;
    name: string;
    stockQuantity: number;
    minStockThreshold: number;
    status: string;
  }>;
  recentActivity: Array<{
    _id: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
  chartData: Array<{
    date: string;
    label: string;
    orders: number;
    revenue: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg" style={{ background: 'var(--surface)' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20" style={{ color: 'var(--muted-fg)' }}>Failed to load dashboard data</div>;
  }

  const stats = [
    {
      label: 'Orders Today',
      value: data.todayOrders,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.12)',
    },
    {
      label: 'Pending Orders',
      value: data.pendingOrders,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      label: 'Low Stock Items',
      value: data.lowStockCount,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
    },
    {
      label: 'Revenue Today',
      value: `$${data.revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.12)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
          Welcome back! Here&apos;s your inventory overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card stat-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-fg)' }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              <div
                className="p-2.5 rounded-xl"
                style={{ background: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="text-lg font-semibold mb-4">Orders Overview (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--muted-fg)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-fg)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    color: 'var(--foreground)',
                  }}
                />
                <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>No recent activity</p>
            ) : (
              data.recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 p-3 rounded-lg transition-colors"
                  style={{ background: 'var(--surface-hover)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{
                      background:
                        activity.entityType === 'Order'
                          ? '#6366f1'
                          : activity.entityType === 'Product'
                          ? '#22c55e'
                          : activity.entityType === 'Restock'
                          ? '#f59e0b'
                          : '#3b82f6',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{activity.action}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>
                      {new Date(activity.createdAt).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Product Summary */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold mb-4">Product Summary</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.productSummary.map((product) => (
                <tr key={product._id}>
                  <td className="font-medium">{product.name}</td>
                  <td>
                    <span
                      className="font-semibold"
                      style={{
                        color:
                          product.stockQuantity === 0
                            ? '#ef4444'
                            : product.stockQuantity <= product.minStockThreshold
                            ? '#f59e0b'
                            : '#22c55e',
                      }}
                    >
                      {product.stockQuantity}
                    </span>
                    {' units'}
                  </td>
                  <td style={{ color: 'var(--muted-fg)' }}>{product.minStockThreshold}</td>
                  <td>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.status === 'Active'
                          ? product.stockQuantity <= product.minStockThreshold
                            ? 'badge-pending'
                            : 'badge-active'
                          : 'badge-out-of-stock'
                      }`}
                    >
                      {product.status === 'Active' && product.stockQuantity <= product.minStockThreshold
                        ? 'Low Stock'
                        : product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

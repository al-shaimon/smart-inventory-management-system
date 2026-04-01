'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Order {
  _id: string; orderNumber: number; customerName: string; totalPrice: number;
  status: string; createdAt: string;
  items: Array<{ product: { _id: string; name: string } | null; quantity: number; price: number }>;
}
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.orders);
        setPagination(json.pagination);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchOrders(pagination.page);
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  };

  const badgeClass = (status: string) => {
    const map: Record<string, string> = {
      Pending: 'badge-pending', Confirmed: 'badge-confirmed',
      Shipped: 'badge-shipped', Delivered: 'badge-delivered', Cancelled: 'badge-cancelled',
    };
    return map[status] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>Manage customer orders and fulfillment</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search by customer or order #..." className="input-field sm:max-w-xs"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select-field sm:max-w-[180px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: 'var(--surface-hover)', width: '60px' }} /></td>
                  ))}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--muted-fg)' }}>No orders found</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-semibold" style={{ color: 'var(--accent-hover)' }}>#{o.orderNumber}</td>
                    <td className="font-medium">{o.customerName}</td>
                    <td style={{ color: 'var(--muted-fg)' }}>
                      {o.items.map((item, i) => (
                        <span key={i}>{item.product?.name || 'Unknown'}{i < o.items.length - 1 ? ', ' : ''}</span>
                      ))}
                    </td>
                    <td className="font-semibold">${o.totalPrice.toFixed(2)}</td>
                    <td>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted-fg)', fontSize: '0.8125rem' }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {o.status !== 'Delivered' && o.status !== 'Cancelled' ? (
                        <select
                          className="select-field"
                          style={{ padding: '0.375rem 2rem 0.375rem 0.5rem', fontSize: '0.75rem', minWidth: '110px' }}
                          value={o.status}
                          disabled={updatingId === o._id}
                          onChange={(e) => updateStatus(o._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="pagination">
              <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchOrders(pagination.page - 1)}>Prev</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).slice(
                Math.max(0, pagination.page - 3), Math.min(pagination.totalPages, pagination.page + 2)
              ).map((p) => (
                <button key={p} className={`page-btn ${p === pagination.page ? 'active' : ''}`} onClick={() => fetchOrders(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchOrders(pagination.page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

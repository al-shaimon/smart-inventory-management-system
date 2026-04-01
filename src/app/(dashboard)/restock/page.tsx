'use client';

import { useState, useEffect, useCallback } from 'react';

interface RestockItem {
  _id: string;
  currentStock: number;
  threshold: number;
  priority: 'High' | 'Medium' | 'Low';
  product: {
    _id: string;
    name: string;
    price: number;
    stockQuantity: number;
    minStockThreshold: number;
    status: string;
  } | null;
  createdAt: string;
}

export default function RestockPage() {
  const [queue, setQueue] = useState<RestockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restocking, setRestocking] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/restock');
      if (res.ok) setQueue(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleRestock = async (productId: string) => {
    const qty = parseInt(restockQty[productId] || '0');
    if (qty <= 0) return;

    setRestocking(productId);
    try {
      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      if (res.ok) {
        setRestockQty((prev) => ({ ...prev, [productId]: '' }));
        fetchQueue();
      }
    } catch (err) { console.error(err); }
    finally { setRestocking(null); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove from restock queue?')) return;
    await fetch(`/api/restock/${id}`, { method: 'DELETE' });
    fetchQueue();
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return map[priority] || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Restock Queue</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>
          Products below their minimum stock threshold · sorted by lowest stock first
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(34, 197, 94, 0.12)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="font-medium mb-1">All stocked up!</p>
          <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>No products need restocking right now.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {queue.map((item) => (
            <div key={item._id} className="glass-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{item.product?.name || 'Unknown Product'}</h3>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted-fg)' }}>
                    <span>
                      Current Stock:{' '}
                      <span style={{ color: item.currentStock === 0 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                        {item.currentStock}
                      </span>
                    </span>
                    <span>Threshold: {item.threshold}</span>
                    <span>Price: ${item.product?.price?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="input-field"
                    style={{ width: '80px', textAlign: 'center' }}
                    value={restockQty[item.product?._id || ''] || ''}
                    onChange={(e) =>
                      setRestockQty((prev) => ({
                        ...prev,
                        [item.product?._id || '']: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => item.product && handleRestock(item.product._id)}
                    disabled={restocking === item.product?._id || !restockQty[item.product?._id || '']}
                    className="btn btn-primary btn-sm"
                  >
                    {restocking === item.product?._id ? 'Updating...' : 'Restock'}
                  </button>
                  <button onClick={() => handleRemove(item._id)} className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

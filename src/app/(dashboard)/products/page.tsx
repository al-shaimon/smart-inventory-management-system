'use client';

import { useState, useEffect, useCallback } from 'react';

interface Category { _id: string; name: string; }
interface Product {
  _id: string; name: string; price: number; stockQuantity: number;
  minStockThreshold: number; status: string;
  category: { _id: string; name: string } | null;
  createdAt: string;
}
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: '', stockQuantity: '', minStockThreshold: '5' });

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products);
        setPagination(json.pagination);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, filterCategory, filterStatus]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', category: '', price: '', stockQuantity: '', minStockThreshold: '5' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      category: p.category?._id || '',
      price: String(p.price),
      stockQuantity: String(p.stockQuantity),
      minStockThreshold: String(p.minStockThreshold),
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: parseFloat(form.price),
          stockQuantity: parseInt(form.stockQuantity),
          minStockThreshold: parseInt(form.minStockThreshold),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : 'Validation error');
        return;
      }
      setShowModal(false);
      fetchProducts(pagination.page);
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts(pagination.page);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>Manage your product inventory</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" placeholder="Search products..." className="input-field sm:max-w-xs"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select-field sm:max-w-[180px]" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="select-field sm:max-w-[180px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="h-4 rounded animate-pulse" style={{ background: 'var(--surface-hover)', width: j === 0 ? '120px' : '60px' }} /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--muted-fg)' }}>No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id}>
                    <td className="font-medium">{p.name}</td>
                    <td style={{ color: 'var(--muted-fg)' }}>{p.category?.name || '—'}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>
                      <span style={{ color: p.stockQuantity === 0 ? '#ef4444' : p.stockQuantity <= p.minStockThreshold ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted-fg)' }}>{p.minStockThreshold}</td>
                    <td>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.status === 'Active' ? 'badge-active' : 'badge-out-of-stock'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="btn btn-ghost btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="pagination">
              <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchProducts(pagination.page - 1)}>Prev</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).slice(
                Math.max(0, pagination.page - 3), Math.min(pagination.totalPages, pagination.page + 2)
              ).map((p) => (
                <button key={p} className={`page-btn ${p === pagination.page ? 'active' : ''}`} onClick={() => fetchProducts(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchProducts(pagination.page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Product' : 'Add Product'}</h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="prod-name" className="input-label">Product Name</label>
                <input id="prod-name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
              </div>
              <div>
                <label htmlFor="prod-cat" className="input-label">Category</label>
                <select id="prod-cat" className="select-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prod-price" className="input-label">Price ($)</label>
                  <input id="prod-price" type="number" step="0.01" min="0" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="prod-stock" className="input-label">Stock</label>
                  <input id="prod-stock" type="number" min="0" className="input-field" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required />
                </div>
                <div>
                  <label htmlFor="prod-thresh" className="input-label">Min Threshold</label>
                  <input id="prod-thresh" type="number" min="0" className="input-field" value={form.minStockThreshold} onChange={(e) => setForm({ ...form, minStockThreshold: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string; name: string; price: number; stockQuantity: number; status: string;
  category: { _id: string; name: string } | null;
}
interface OrderItem { productId: string; name: string; price: number; quantity: number; maxStock: number; }

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?limit=200');
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const addItem = () => {
    if (!selectedProduct) return;
    const product = products.find((p) => p._id === selectedProduct);
    if (!product) return;

    // Conflict Detection: Prevent duplicate products
    if (items.some((item) => item.productId === selectedProduct)) {
      setError('This product is already added to the order.');
      return;
    }

    // Conflict Detection: Prevent ordering inactive products
    if (product.status === 'Out of Stock') {
      setError('This product is currently unavailable.');
      return;
    }

    setError('');
    setItems([...items, {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      maxStock: product.stockQuantity,
    }]);
    setSelectedProduct('');
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;

    // Stock warning
    const newWarnings: string[] = [];
    newItems.forEach((item) => {
      if (item.quantity > item.maxStock) {
        newWarnings.push(`Only ${item.maxStock} items available in stock for "${item.name}".`);
      }
    });
    setWarnings(newWarnings);
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    // Recalculate warnings
    const newWarnings: string[] = [];
    newItems.forEach((item) => {
      if (item.quantity > item.maxStock) {
        newWarnings.push(`Only ${item.maxStock} items available for "${item.name}".`);
      }
    });
    setWarnings(newWarnings);
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { setError('Add at least one item.'); return; }

    // Check stock before submit
    const overStocked = items.some((item) => item.quantity > item.maxStock);
    if (overStocked) { setError('Cannot place order. Some items exceed available stock.'); return; }

    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          items: items.map((item) => ({
            product: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : 'Failed to create order');
        return;
      }

      router.push('/orders');
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const availableProducts = products.filter(
    (p) => p.status === 'Active' && !items.some((item) => item.productId === p._id)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Order</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-fg)' }}>Add products and quantities to create a customer order</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {warnings.map((w, i) => (
        <div key={i} className="p-3 rounded-lg text-sm" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          ⚠️ {w}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Name */}
        <div className="glass-card p-5">
          <label htmlFor="customer" className="input-label">Customer Name</label>
          <input
            id="customer" className="input-field" value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name" required
          />
        </div>

        {/* Add Products */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Order Items</h3>
          <div className="flex gap-3 mb-4">
            <select
              className="select-field flex-1" value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setError(''); }}
            >
              <option value="">Select a product to add...</option>
              {loading ? (
                <option disabled>Loading products...</option>
              ) : (
                availableProducts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ${p.price.toFixed(2)} ({p.stockQuantity} in stock)
                  </option>
                ))
              )}
              {/* Show out-of-stock products as disabled */}
              {products.filter((p) => p.status === 'Out of Stock').map((p) => (
                <option key={p._id} value={p._id} disabled>
                  {p.name} — Out of Stock
                </option>
              ))}
            </select>
            <button type="button" onClick={addItem} className="btn btn-secondary" disabled={!selectedProduct}>
              Add
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--muted-fg)' }}>
              <p className="text-sm">No items added yet. Select a product above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 p-3 rounded-xl animate-fade-in"
                  style={{ background: 'var(--surface-hover)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      ${item.price.toFixed(2)} each · {item.maxStock} in stock
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor={`qty-${index}`} className="sr-only">Quantity</label>
                    <input
                      id={`qty-${index}`}
                      type="number" min="1" max={item.maxStock}
                      className="input-field" style={{ width: '80px', textAlign: 'center' }}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <p className="font-semibold text-sm w-24 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button type="button" onClick={() => removeItem(index)} className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {items.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold gradient-text">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.push('/orders')} className="btn btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving || warnings.length > 0} className="btn btn-primary flex-1">
                {saving ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

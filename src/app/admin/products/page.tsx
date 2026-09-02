'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Package, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { fetchWithCache, getCachedData, invalidateCache } from '@/lib/api-cache';

export default function AdminProductsPage() {
  const cachedInitial = getCachedData('/api/admin/products');
  const [products, setProducts] = useState<any[]>(cachedInitial ? cachedInitial.products || [] : []);
  const [loading, setLoading] = useState(!cachedInitial);
  const toast = useToast();

  const fetchProducts = async (force = false) => {
    try {
      const data = await fetchWithCache('/api/admin/products', { ttl: 20000, forceRefresh: force });
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        invalidateCache('/api/admin');
        setProducts(prev => prev.filter(p => p.id !== productId));
      } else {
        toast.error('Failed to delete product');
      }
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" />
        <span className="admin-loading__text">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <Package size={24} />
            Manage Products
          </h2>
          <p className="admin-page-desc">Create, update, or remove items from your store catalog</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setLoading(true); fetchProducts(); }} className="btn btn-ghost btn-sm">
            <RefreshCw size={16} />
          </button>
          <Link href="/admin/products/add" className="btn btn-primary btn-sm md:btn-md">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Grid Container */}
      <div className="admin-card">
        {products.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <Package size={28} />
            </div>
            <div className="admin-empty__title">No products found</div>
            <div className="admin-empty__desc">
              Get started by creating your very first catalog product.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID / Slug</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                  <th>Units Sold</th>
                  <th className="col-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="col-primary">{product.id}</div>
                      <div className="col-muted">{product.slug}</div>
                    </td>
                    <td className="col-primary font-bold">{product.name}</td>
                    <td className="capitalize">{product.category}</td>
                    <td className="col-bold">{formatPrice(product.price)}</td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`status-badge ${
                          product.stock > 0 ? 'status-badge--success' : 'status-badge--error'
                        }`}>
                          {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                        </span>
                        {product.languages && (
                          <span className="text-[10px] font-bold text-(--color-text-muted) uppercase tracking-wider pl-1">
                            {(() => {
                              try {
                                const langs = typeof product.languages === 'string' ? JSON.parse(product.languages) : product.languages;
                                return langs.map((l: any) => `${l.code.toUpperCase()}: ${l.stock || 0}`).join(' | ');
                              } catch (e) {
                                return null;
                              }
                            })()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        (product.totalSold || 0) > 0 ? 'status-badge--indigo' : 'status-badge--neutral'
                      }`}>
                        {product.totalSold || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/admin/products/${product.id}`} 
                          className="admin-action-btn admin-action-btn--edit"
                          title="Edit Product"
                        >
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="admin-action-btn admin-action-btn--delete"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

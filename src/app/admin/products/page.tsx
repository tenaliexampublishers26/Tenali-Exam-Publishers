'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { formatPrice } from '@/lib/utils';
import { Package, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { fetchWithCache, getCachedData, invalidateCache } from '@/lib/api-cache';
import { AdminPageHeader, AdminTableRow, AdminConfirmDialog, SPRING_PRESS } from '@/components/admin/AdminUI';

export default function AdminProductsPage() {
  const cachedInitial = getCachedData('/api/admin/products');
  const [products, setProducts] = useState<any[]>(cachedInitial ? cachedInitial.products || [] : []);
  const [loading, setLoading] = useState(!cachedInitial);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${pendingDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        invalidateCache('/api/admin');
        setProducts(prev => prev.filter(p => p.id !== pendingDelete.id));
        setPendingDelete(null);
      } else {
        toast.error('Failed to delete product');
      }
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
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
      <AdminPageHeader
        icon={<Package size={24} />}
        title="Manage Products"
        description="Create, update, or remove items from your store catalog"
        actions={
          <>
            <motion.button
              onClick={() => { setRefreshing(true); fetchProducts(true); }}
              whileTap={{ scale: 0.92, rotate: 180 }}
              transition={SPRING_PRESS}
              className="btn btn-ghost btn-sm"
              aria-label="Refresh products"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </motion.button>
            <motion.div whileTap={{ scale: 0.96 }} transition={SPRING_PRESS}>
              <Link href="/admin/products/add" className="btn btn-primary btn-sm md:btn-md">
                <Plus size={16} /> Add Product
              </Link>
            </motion.div>
          </>
        }
      />

      {/* Grid Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.05 }}
        className="admin-card"
      >
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
                {products.map((product, index) => (
                  <AdminTableRow key={product.id} index={index}>
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
                        <motion.div whileTap={{ scale: 0.9 }} transition={SPRING_PRESS} className="admin-action-btn admin-action-btn--edit" style={{ padding: 0 }}>
                          <Link href={`/admin/products/${product.id}`} className="flex items-center justify-center w-full h-full px-2 py-1.5" title="Edit Product">
                            <Edit size={16} />
                          </Link>
                        </motion.div>
                        <motion.button
                          onClick={() => setPendingDelete(product)}
                          whileTap={{ scale: 0.9 }}
                          transition={SPRING_PRESS}
                          className="admin-action-btn admin-action-btn--delete"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </AdminTableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AdminConfirmDialog
        open={!!pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this product?"
        description={pendingDelete ? `"${pendingDelete.name}" will be permanently removed from your catalog. This cannot be undone.` : ''}
        confirmLabel="Delete Product"
      />
    </div>
  );
}

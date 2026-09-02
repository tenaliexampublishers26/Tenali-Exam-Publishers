import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { fetchWithCache, getCachedData } from '@/lib/api-cache';

export function useProducts() {
  const cached = getCachedData<{ products: Product[] }>('/api/products');
  const [products, setProducts] = useState<Product[]>(cached ? cached.products || [] : []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await fetchWithCache<{ products: Product[] }>('/api/products', { ttl: 60000 });
        setProducts(data.products || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}

export function useProduct(slug: string) {
  const url = slug ? `/api/products/${slug}` : '';
  const cached = url ? getCachedData<{ product: Product }>(url) : null;
  const [product, setProduct] = useState<Product | null>(cached ? cached.product || null : null);
  const [loading, setLoading] = useState(Boolean(slug && !cached));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      try {
        const data = await fetchWithCache<{ product: Product }>(`/api/products/${slug}`, { ttl: 60000 });
        setProduct(data.product || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  return { product, loading, error };
}

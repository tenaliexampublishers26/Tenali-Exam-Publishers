'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useToast } from '@/contexts/ToastContext';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ImageUpload';
import { SPRING_UI, SPRING_PRESS } from '@/components/admin/AdminUI';
import ProductMediumsEditor, { MediumItem } from '@/components/admin/ProductMediumsEditor';
import { invalidateCache } from '@/lib/api-cache';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: '',
    images: [] as string[],
    bundleTitle: '',
    booksIncluded: '',
    badge: ''
  });

  const [mediums, setMediums] = useState<MediumItem[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Failed to load product');
        const data = await res.json();
        const p = data.product;
        
        let rawLangs: any = p.languages;
        if (typeof rawLangs === 'string') {
          try {
            rawLangs = JSON.parse(rawLangs);
            if (typeof rawLangs === 'string') rawLangs = JSON.parse(rawLangs);
          } catch (e) {
            rawLangs = [];
          }
        }

        if (Array.isArray(rawLangs) && rawLangs.length > 0) {
          setMediums(
            rawLangs.map((l: any) => ({
              code: String(l.code || 'en').toLowerCase(),
              name: String(l.name || l.code || 'English'),
              stock: Math.max(0, parseInt(String(l.stock), 10) || 0),
            }))
          );
        } else {
          setMediums([
            { code: 'en', name: 'English', stock: Math.max(0, parseInt(String(p.stock), 10) || 0) },
            { code: 'te', name: 'Telugu', stock: 0 },
            { code: 'hi', name: 'Hindi', stock: 0 },
          ]);
        }

        let initialImages: string[] = [];
        if (Array.isArray(p.images)) {
          initialImages = p.images.map((img: any) => String(img)).filter(Boolean);
        } else if (typeof p.images === 'string') {
          try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed)) {
              initialImages = parsed.map((img: any) => String(img)).filter(Boolean);
            }
          } catch (e) {}
        }
        if (initialImages.length === 0 && p.image) {
          initialImages = [p.image];
        }

        setFormData({
          name: p.name || '',
          category: p.category || 'books',
          price: p.price?.toString() || '0',
          description: p.description || '',
          image: p.image || initialImages[0] || '',
          images: initialImages,
          bundleTitle: p.bundleTitle || '',
          booksIncluded: p.booksIncluded?.toString() || '1',
          badge: p.badge || ''
        });
      } catch (err) {
        toast.error('Failed to load product details');
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalImages = formData.images.length > 0
        ? formData.images
        : (formData.image ? [formData.image] : []);
      const primaryImage = finalImages[0] || formData.image || '';

      if (!primaryImage) {
        toast.error('Please upload at least one product image');
        setSaving(false);
        return;
      }

      const payload = {
        ...formData,
        image: primaryImage,
        images: finalImages,
        price: parseFloat(formData.price),
        booksIncluded: parseInt(formData.booksIncluded),
        languages: mediums.map(m => ({
          code: m.code.trim().toLowerCase(),
          name: m.name.trim(),
          stock: Math.max(0, parseInt(String(m.stock), 10) || 0)
        }))
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        invalidateCache('/api/admin/products');
        invalidateCache('/api/products');
        invalidateCache(`/api/products/${id}`);
        invalidateCache('/api/admin');
        toast.success('Product updated successfully');
        router.push('/admin/products');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update product');
      }
    } catch (err) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" />
        <span className="admin-loading__text">Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_UI}
        className="admin-page-header"
      >
        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.9 }} transition={SPRING_PRESS}>
            <Link href="/admin/products" className="btn btn-ghost btn-sm btn-icon" title="Go Back">
              <ArrowLeft size={20} />
            </Link>
          </motion.div>
          <div>
            <h2 className="admin-page-title">
              <Package size={24} />
              Edit Product: {id}
            </h2>
            <p className="admin-page-desc">Modify product details, category, pricing, or stock</p>
          </div>
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_UI, delay: 0.06 }}
        className="admin-card space-y-8"
      >
        
        {/* Section 1: Basic Info */}
        <div className="admin-form-section">
          <h3 className="admin-form-section__title">Basic Catalog Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group sm:col-span-2">
              <label className="form-label">Product Title / Name</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select required name="category" value={formData.category} onChange={handleChange} className="form-select">
                <option value="books">Books</option>
                <option value="materials">Materials</option>
                <option value="bundles">Bundles</option>
              </select>
            </div>

            <ImageUpload
              images={formData.images}
              value={formData.image}
              onChange={(newImages, primaryImage) => {
                setFormData(prev => ({
                  ...prev,
                  images: newImages,
                  image: primaryImage || newImages[0] || ''
                }));
              }}
              required
            />

            <div className="form-group sm:col-span-2">
              <label className="form-label">Detailed Description</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} className="form-input" rows={4} />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="admin-form-section space-y-6">
          <h3 className="admin-form-section__title">Pricing & Inventory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Books Included Count</label>
              <input required type="number" name="booksIncluded" value={formData.booksIncluded} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <ProductMediumsEditor mediums={mediums} onChange={setMediums} />
        </div>

        {/* Section 3: Marketing Labels */}
        <div className="admin-form-section">
          <h3 className="admin-form-section__title">Marketing & Extras</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="form-label">Bundle Subtitle (Optional)</label>
              <input name="bundleTitle" value={formData.bundleTitle} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Promo Tag / Badge (Optional)</label>
              <input name="badge" value={formData.badge} onChange={handleChange} className="form-input" />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-(--color-border)">
          <motion.div whileTap={{ scale: 0.97 }} transition={SPRING_PRESS} className="w-full sm:w-auto">
            <Link href="/admin/products" className="btn btn-secondary w-full sm:w-auto text-center justify-center">
              Cancel
            </Link>
          </motion.div>
          <motion.button
            type="submit"
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_PRESS}
            className="btn btn-primary w-full sm:w-auto justify-center disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}

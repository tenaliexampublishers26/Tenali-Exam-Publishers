'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { INDIAN_STATES } from '@/lib/data';
import { MapPin, Plus, Trash2, CheckCircle2, Building, Mail, Phone, User as UserIcon } from 'lucide-react';

interface SavedAddress {
  id: string;
  fullName: string;
  mobile: string;
  email: string | null;
  houseOrFlat: string;
  street: string;
  area: string | null;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

import { fetchWithCache, getCachedData, invalidateCache } from '@/lib/api-cache';

export default function AddressesPage(): React.JSX.Element {
  const { user } = useAuth();
  const toast = useToast();
  const url = user?.id ? `/api/user/addresses?userId=${user.id}` : '';
  const cached = url ? getCachedData<{ addresses: SavedAddress[] }>(url) : null;
  const [addresses, setAddresses] = useState<SavedAddress[]>(cached ? cached.addresses || [] : []);
  const [loading, setLoading] = useState(Boolean(!cached && user));
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    houseOrFlat: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pinCode: '',
    isDefault: false
  });

  const fetchAddresses = async (force = false) => {
    if (!user) return;
    try {
      const data = await fetchWithCache<{ addresses: SavedAddress[] }>(`/api/user/addresses?userId=${user.id}`, { ttl: 20000, forceRefresh: force });
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user.id })
      });
      if (res.ok) {
        toast.success('Address saved successfully!');
        setShowForm(false);
        setFormData({
          fullName: '', mobile: '', email: '', houseOrFlat: '',
          street: '', area: '', city: '', state: '', pinCode: '', isDefault: false
        });
        fetchAddresses();
      } else {
        toast.error('Failed to save address');
      }
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const res = await fetch(`/api/user/addresses/${id}?userId=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Address deleted');
        fetchAddresses();
      } else {
        toast.error('Failed to delete address');
      }
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading saved addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-(--color-text-primary) flex items-center gap-2">
            <MapPin size={22} className="text-emerald-500" />
            Saved Addresses ({addresses.length})
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-0.5">Manage delivery destinations for fast checkout</p>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
            showForm 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {showForm ? 'Cancel' : <><Plus size={15} /> Add Address</>}
        </button>
      </div>

      {/* Add Address Form */}
      {showForm && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-(--color-bg-card) border-2 border-emerald-500/40 shadow-lg space-y-4 animate-fadeIn">
          <h3 className="font-bold text-sm text-(--color-text-primary) border-b border-(--color-border-light) pb-2">
            Add New Delivery Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <input required name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name *" className="form-input text-xs p-2.5 rounded-xl" />
            <input required name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile Number *" className="form-input text-xs p-2.5 rounded-xl" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email Address (Optional)" type="email" className="form-input text-xs p-2.5 rounded-xl" />
            <input required name="pinCode" value={formData.pinCode} onChange={handleChange} placeholder="PIN Code *" className="form-input text-xs p-2.5 rounded-xl" />
            
            <input required name="houseOrFlat" value={formData.houseOrFlat} onChange={handleChange} placeholder="House No. / Flat / Building Name *" className="form-input text-xs p-2.5 rounded-xl sm:col-span-2" />
            <input required name="street" value={formData.street} onChange={handleChange} placeholder="Street Name / Road *" className="form-input text-xs p-2.5 rounded-xl sm:col-span-2" />
            <input name="area" value={formData.area} onChange={handleChange} placeholder="Area / Landmark (Optional)" className="form-input text-xs p-2.5 rounded-xl sm:col-span-2" />
            
            <input required name="city" value={formData.city} onChange={handleChange} placeholder="City / District *" className="form-input text-xs p-2.5 rounded-xl" />
            <select required name="state" value={formData.state} onChange={handleChange} className="form-select text-xs p-2.5 rounded-xl">
              <option value="">Select State *</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-(--color-text-secondary) cursor-pointer pt-2">
            <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="rounded text-emerald-600" />
            <span>Set as default primary delivery address</span>
          </label>

          <div className="pt-2">
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all">
              Save Address
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="p-12 text-center bg-(--color-bg-card) rounded-2xl border border-dashed border-(--color-border) space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <MapPin size={36} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-(--color-text-primary)">No Saved Addresses</h3>
            <p className="text-xs text-(--color-text-muted) mt-1">
              Add a delivery address to speed up your future checkouts.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5">
            <Plus size={15} /> Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div 
              key={addr.id} 
              className="p-5 rounded-2xl bg-(--color-bg-card) border border-(--color-border) shadow-xs space-y-3 relative group"
            >
              {addr.isDefault && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  <CheckCircle2 size={11} /> Default
                </span>
              )}

              <div className="font-bold text-sm text-(--color-text-primary) flex items-center gap-1.5">
                <UserIcon size={15} className="text-slate-400" />
                {addr.fullName}
              </div>

              <div className="text-xs text-(--color-text-secondary) leading-relaxed space-y-0.5">
                <div>{addr.houseOrFlat}, {addr.street}</div>
                {addr.area && <div>{addr.area}</div>}
                <div>{addr.city}, {addr.state} - <span className="font-bold text-(--color-text-primary)">{addr.pinCode}</span></div>
                <div className="pt-1.5 text-slate-500 font-medium flex items-center gap-1">
                  <Phone size={12} /> {addr.mobile}
                </div>
              </div>

              <div className="pt-2 border-t border-(--color-border-light) flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

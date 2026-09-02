'use client';
import { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, X, Package, Calendar as CalendarIcon, Phone, Mail, ShoppingCart } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice } from '@/lib/utils';
import { fetchWithCache, getCachedData } from '@/lib/api-cache';

export default function AdminUsersPage() {
  const cachedInitial = getCachedData('/api/admin/users');
  const [users, setUsers] = useState<any[]>(cachedInitial ? cachedInitial.users || [] : []);
  const [loading, setLoading] = useState(!cachedInitial);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const toast = useToast();

  const fetchUsers = async (force = false) => {
    try {
      const data = await fetchWithCache('/api/admin/users', { ttl: 20000, forceRefresh: force });
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      if (!name.includes(term) && !email.includes(term) && !phone.includes(term)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__spinner" />
        <span className="admin-loading__text">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="admin-page-header flex-col md:flex-row gap-4 md:items-center items-start">
        <div>
          <h2 className="admin-page-title">
            <Users size={24} />
            Manage Users
          </h2>
          <p className="admin-page-desc">View registered users and their order histories</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-(--color-text-muted) group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by Name, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-(--color-bg-page) hover:bg-(--color-bg-hover) border border-(--color-border) focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm font-medium text-(--color-text-primary) placeholder-(--color-text-muted) transition-all outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-(--color-text-muted) hover:text-rose-500 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <button onClick={() => fetchUsers(true)} className="btn btn-ghost btn-sm shrink-0">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-card">
        {users.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <Users size={28} />
            </div>
            <div className="admin-empty__title">No users yet</div>
            <div className="admin-empty__desc">
              Registered users will appear here.
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__icon">
              <Search size={28} />
            </div>
            <div className="admin-empty__title">No users found</div>
            <div className="admin-empty__desc">
              Try adjusting your search query to find what you&apos;re looking for.
            </div>
            <button onClick={() => setSearchTerm('')} className="btn btn-primary btn-sm mt-4">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Total Orders</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="cursor-pointer hover:bg-(--color-bg-hover) transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm uppercase">
                          {user.name ? user.name.substring(0, 2) : 'U'}
                        </div>
                        <div className="font-semibold text-(--color-text-primary)">
                          {user.name || 'Unknown User'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-sm text-(--color-text-secondary)">
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-(--color-text-muted)" />
                          {user.email || 'No email provided'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-(--color-text-muted)" />
                          {user.phone || 'No phone provided'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${user.role === 'admin' ? 'status-badge--warning' : 'status-badge--neutral'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-(--color-text-primary)">
                        {user.orders?.length || 0}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-(--color-text-secondary)">
                        <CalendarIcon size={14} className="text-(--color-text-muted)" />
                        {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details & Orders Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1a1b1e] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl uppercase">
                  {selectedUser.name ? selectedUser.name.substring(0, 2) : 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-(--color-text-primary)">
                    {selectedUser.name || 'Unknown User'}
                  </h3>
                  <div className="flex gap-3 text-sm text-(--color-text-secondary) mt-1">
                    <span className="flex items-center gap-1"><Mail size={14}/> {selectedUser.email || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Phone size={14}/> {selectedUser.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-(--color-text-muted) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Order History */}
            <div className="p-6 overflow-y-auto bg-(--color-bg-page)">
              <h4 className="flex items-center gap-2 font-bold text-lg text-(--color-text-primary) mb-4">
                <ShoppingCart size={18} className="text-blue-500" />
                Order History
              </h4>
              
              {!selectedUser.orders || selectedUser.orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-[#25262b] rounded-xl border border-(--color-border-light) shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Package size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-(--color-text-primary) mb-1">No Orders Yet</h3>
                  <p className="text-(--color-text-secondary) text-sm max-w-sm">
                    This user hasn&apos;t placed any orders yet. Once they make a purchase, their order history will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {selectedUser.orders.map((order: any) => (
                    <div key={order.id} className="bg-white dark:bg-[#25262b] border border-(--color-border-light) rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-(--color-text-primary)">#{order.orderNumber}</span>
                            <span className="text-sm text-(--color-text-muted)">•</span>
                            <span className="text-sm text-(--color-text-secondary) flex items-center gap-1.5">
                              <CalendarIcon size={14} />
                              {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {order.items && order.items.length > 0 && (
                            <div className="mt-3 mb-2 space-y-2">
                              {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <div className="mt-0.5 text-(--color-text-muted)">
                                    <Package size={14} />
                                  </div>
                                  <div>
                                    <div className="font-medium text-(--color-text-primary) leading-snug">{item.productName}</div>
                                    <div className="text-xs text-(--color-text-secondary) mt-0.5">
                                      {item.language} <span className="mx-1">•</span> Qty: {item.quantity} <span className="mx-1">•</span> {formatPrice(item.price)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="font-bold text-lg text-blue-600 mt-3 pt-3 border-t border-(--color-border-light) inline-block min-w-32">
                            {formatPrice(order.total)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-2">
                          <div className="flex gap-2">
                            <span className={`status-badge ${
                              order.paymentStatus === 'paid' ? 'status-badge--success' : 
                              order.paymentStatus === 'pending' ? 'status-badge--warning' : 'status-badge--error'
                            }`}>
                              {order.paymentStatus}
                            </span>
                            <span className="status-badge" style={{ background: 'var(--color-bg-page)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { WishlistItem, Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistContextType {
  items: WishlistItem[];
  isLoaded: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const WISHLIST_KEY = 'tep_wishlist';

function getStoredWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(WISHLIST_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to read wishlist from localStorage:', err);
  }
  return [];
}

function saveStoredWishlist(wishlistItems: WishlistItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
  } catch (err) {
    console.error('Failed to save wishlist to localStorage:', err);
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const isInitialized = useRef(false);

  // Load initial wishlist on mount
  useEffect(() => {
    const stored = getStoredWishlist();
    if (stored.length > 0) {
      setItems(stored);
    }
    isInitialized.current = true;
    setIsLoaded(true);

    // Cross-tab storage synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WISHLIST_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setItems(updated);
          }
        } catch {
          // ignore parse error
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync with remote API when user is logged in (merge without data loss)
  useEffect(() => {
    if (!user) return;

    const fetchRemoteWishlist = async () => {
      try {
        const res = await fetch(`/api/wishlist?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const remoteItems: WishlistItem[] = data.items || [];
          if (remoteItems.length > 0) {
            setItems(prev => {
              // Merge local and remote by unique productId
              const map = new Map<string, WishlistItem>();
              prev.forEach(item => map.set(item.productId, item));
              remoteItems.forEach(item => map.set(item.productId, item));
              const merged = Array.from(map.values());
              saveStoredWishlist(merged);
              return merged;
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch remote wishlist', e);
      }
    };

    fetchRemoteWishlist();
  }, [user]);

  // Persist items to localStorage whenever they change
  useEffect(() => {
    if (isInitialized.current) {
      saveStoredWishlist(items);
    }
  }, [items]);

  const addItem = useCallback(async (product: Product) => {
    const newItem: WishlistItem = {
      id: `wish_${product.id}_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.image,
      price: product.price,
      badge: product.badge,
      languages: product.languages,
      addedAt: new Date().toISOString(),
    };

    setItems(prev => {
      if (prev.some(item => item.productId === product.id)) return prev;
      const updated = [...prev, newItem];
      saveStoredWishlist(updated);
      return updated;
    });

    if (user) {
      try {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            productImage: product.image,
            price: product.price,
            badge: product.badge,
          })
        });
      } catch (err) {
        console.error('Failed to sync add to remote wishlist', err);
      }
    }
  }, [user]);

  const removeItem = useCallback(async (productId: string) => {
    setItems(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      saveStoredWishlist(updated);
      return updated;
    });

    if (user) {
      try {
        await fetch(`/api/wishlist?userId=${user.id}&productId=${productId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to sync remove from remote wishlist', err);
      }
    }
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.productId === productId);
  }, [items]);

  const toggleWishlist = useCallback((product: Product) => {
    if (isInWishlist(product.id)) {
      removeItem(product.id);
      return false;
    } else {
      addItem(product);
      return true;
    }
  }, [isInWishlist, removeItem, addItem]);

  const clearWishlist = useCallback(() => {
    setItems([]);
    saveStoredWishlist([]);
  }, []);

  return (
    <WishlistContext.Provider value={{
      items,
      isLoaded,
      addItem,
      removeItem,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
      totalItems: items.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

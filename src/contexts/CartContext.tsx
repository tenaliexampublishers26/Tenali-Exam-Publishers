'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { CartItem, Product, LanguageCode } from '@/types';

interface CartContextType {
  items: CartItem[];
  isLoaded: boolean;
  lastAddedItem: CartItem | null;
  addItem: (product: Product, language: LanguageCode | string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  clearLastAddedItem: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'tep_cart';

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to read cart from localStorage:', err);
  }
  return [];
}

function saveStoredCart(cartItems: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const isInitialized = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = getStoredCart();
    if (stored.length > 0) {
      setItems(stored);
    }
    isInitialized.current = true;
    setIsLoaded(true);

    // Cross-tab storage synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
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

  // Save cart to localStorage only after initialized
  useEffect(() => {
    if (isInitialized.current) {
      saveStoredCart(items);
    }
  }, [items]);

  const addItem = useCallback((product: Product, language: LanguageCode | string, quantity = 1) => {
    const newItem: CartItem = {
      id: `${product.id}_${language}_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.image,
      price: product.price,
      language,
      quantity,
      badge: product.badge,
      bundleTitle: product.bundleTitle || (product.id === 'p1' ? '2-Book Preparation Set' : '3-Book Preparation Set'),
      booksIncluded: product.booksIncluded || (product.id === 'p1' ? 2 : 3),
      edition: product.edition || 'First Edition',
    };

    setItems(prev => {
      let updated: CartItem[];
      const existing = prev.find(item => item.productId === product.id && item.language === language);
      if (existing) {
        updated = prev.map(item =>
          item.productId === product.id && item.language === language
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, newItem];
      }
      saveStoredCart(updated);
      return updated;
    });

    setLastAddedItem(newItem);
  }, []);

  const clearLastAddedItem = useCallback(() => {
    setLastAddedItem(null);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      saveStoredCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      saveStoredCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveStoredCart([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      isLoaded,
      lastAddedItem,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearLastAddedItem,
      totalItems,
      subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

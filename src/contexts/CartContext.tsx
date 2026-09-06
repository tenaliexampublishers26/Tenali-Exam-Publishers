'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
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
// 7 days cart expiration in ms
const CART_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredCartEnvelope {
  items: CartItem[];
  timestamp: number;
}

function normalizeLanguage(lang?: LanguageCode | string | null): string {
  if (!lang) return 'en';
  const trimmed = String(lang).trim().toLowerCase();
  return trimmed || 'en';
}

function sanitizeCartItem(raw: any): CartItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const productId = String(raw.productId || raw.id || '').trim();
  const name = String(raw.productName || raw.name || '').trim();
  if (!productId || !name) return null;

  const price = typeof raw.price === 'number' ? raw.price : parseFloat(raw.price);
  if (isNaN(price) || price < 0) return null;

  const quantity = Math.max(1, parseInt(String(raw.quantity), 10) || 1);
  const language = normalizeLanguage(raw.language);
  const stableId = `${productId}_${language}`;

  return {
    id: stableId,
    productId,
    productName: name,
    productSlug: String(raw.productSlug || raw.slug || productId).trim(),
    productImage: String(raw.productImage || raw.image || '/images/book-mts-postman.jpg'),
    price,
    language,
    quantity,
    badge: raw.badge ? String(raw.badge) : undefined,
    bundleTitle: raw.bundleTitle ? String(raw.bundleTitle) : (productId === 'p1' ? '2-Book Preparation Set' : productId === 'p2' ? '3-Book Preparation Set' : undefined),
    booksIncluded: typeof raw.booksIncluded === 'number' ? raw.booksIncluded : (productId === 'p1' ? 2 : productId === 'p2' ? 3 : 1),
    edition: raw.edition ? String(raw.edition) : 'First Edition',
  };
}

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    let rawItems: any[] = [];

    // Support both envelope format { items: [...], timestamp } and legacy raw array [...]
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.items)) {
      if (parsed.timestamp && Date.now() - parsed.timestamp > CART_MAX_AGE_MS) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }
      rawItems = parsed.items;
    } else if (Array.isArray(parsed)) {
      rawItems = parsed;
    }

    const sanitized = rawItems
      .map(sanitizeCartItem)
      .filter((item): item is CartItem => item !== null);

    // Deduplicate by item.id if legacy storage had duplicate entries
    const uniqueMap = new Map<string, CartItem>();
    for (const item of sanitized) {
      if (uniqueMap.has(item.id)) {
        const existing = uniqueMap.get(item.id)!;
        existing.quantity += item.quantity;
      } else {
        uniqueMap.set(item.id, { ...item });
      }
    }

    return Array.from(uniqueMap.values());
  } catch (err) {
    console.error('Failed to read cart from localStorage:', err);
  }
  return [];
}

function saveStoredCart(cartItems: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (!cartItems || cartItems.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    const envelope: StoredCartEnvelope = {
      items: cartItems,
      timestamp: Date.now(),
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(envelope));
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const isLoadedRef = useRef(false);
  const isRemoteSyncRef = useRef(false);

  // Load cart from localStorage on mount and register cross-tab synchronization
  useEffect(() => {
    const stored = getStoredCart();
    setItems(stored);
    isLoadedRef.current = true;
    setIsLoaded(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        try {
          const fresh = getStoredCart();
          isRemoteSyncRef.current = true;
          setItems(fresh);
        } catch {
          // ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Single reliable persistence effect: writes to localStorage only after initial load,
  // preventing race conditions, double writes, or tab-echo ping-pong
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (isRemoteSyncRef.current) {
      isRemoteSyncRef.current = false;
      return;
    }
    saveStoredCart(items);
  }, [items]);

  const addItem = useCallback((product: Product, language: LanguageCode | string, quantity = 1) => {
    const safeQty = Math.max(1, Math.floor(quantity));
    const normalizedLang = normalizeLanguage(language);
    const prodIdStr = String(product.id);
    const stableId = `${prodIdStr}_${normalizedLang}`;

    const resolvedBundleTitle = product.bundleTitle
      ? product.bundleTitle
      : (prodIdStr === 'p1' ? '2-Book Preparation Set' : prodIdStr === 'p2' ? '3-Book Preparation Set' : undefined);

    const resolvedBooksIncluded = typeof product.booksIncluded === 'number'
      ? product.booksIncluded
      : (prodIdStr === 'p1' ? 2 : prodIdStr === 'p2' ? 3 : 1);

    const newItem: CartItem = {
      id: stableId,
      productId: prodIdStr,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.image,
      price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0,
      language: normalizedLang,
      quantity: safeQty,
      badge: product.badge,
      bundleTitle: resolvedBundleTitle,
      booksIncluded: resolvedBooksIncluded,
      edition: product.edition || 'First Edition',
    };

    setItems(prev => {
      const idx = prev.findIndex(item =>
        item.id === stableId ||
        (String(item.productId) === prodIdStr && normalizeLanguage(item.language) === normalizedLang)
      );

      if (idx !== -1) {
        // Item already exists in cart: update ONLY its quantity
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + safeQty,
        };
        return updated;
      }

      // Brand new item: append to cart
      return [...prev, newItem];
    });

    setLastAddedItem(newItem);
  }, []);

  const clearLastAddedItem = useCallback(() => {
    setLastAddedItem(null);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.floor(quantity) } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Memoized derived calculations
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

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


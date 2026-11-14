import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, setStoredToken } from '../lib/api';
import { translations } from '../lib/i18n';
import type { Banner, CartItem, Category, Language, Product, ShippingZone, User } from '../types';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface StoreContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (typeof translations)['fr'] | (typeof translations)['ar'];
  route: string;
  navigate: (to: string) => void;
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { full_name: string; email: string; phone: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  categories: Category[];
  banners: Banner[];
  shippingZones: ShippingZone[];
  brands: string[];
  onlineGatewayConfigured: boolean;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, variantLabel?: string, openDrawer?: boolean) => void;
  updateCartQty: (productId: number, variantLabel: string, qty: number) => void;
  removeFromCart: (productId: number, variantLabel: string) => void;
  clearCart: () => void;
  wishlistIds: number[];
  toggleWishlist: (productId: number) => Promise<void>;
  recentlyViewedIds: number[];
  recordViewed: (productId: number) => void;
  notify: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'casavente_cart_v1';
const WISHLIST_STORAGE_KEY = 'casavente_wishlist_v1';
const RECENT_STORAGE_KEY = 'casavente_recent_v1';
const LANG_STORAGE_KEY = 'casavente_lang_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'ar' ? 'ar' : 'fr';
  });

  const [route, setRoute] = useState<string>(() => window.location.pathname + window.location.search);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [onlineGatewayConfigured, setOnlineGatewayConfigured] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const setLang = useCallback((nextLang: Language) => {
    setLangState(nextLang);
    localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', to);
      setRoute(to);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: User | null }>('/api/auth/me');
      setUser(res.user);
      if (res.user) {
        try {
          const w = await apiFetch<{ products: Product[] }>('/api/account/wishlist');
          setWishlistIds(w.products.map((p) => p.id));
        } catch {
          // ignore
        }
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    apiFetch<{
      banners: Banner[];
      categories: Category[];
      shippingZones: ShippingZone[];
      brands: string[];
      onlineGatewayConfigured: boolean;
    }>('/api/storefront')
      .then((data) => {
        setBanners(data.banners);
        setCategories(data.categories);
        setShippingZones(data.shippingZones);
        setBrands(data.brands);
        setOnlineGatewayConfigured(data.onlineGatewayConfigured);
      })
      .catch(() => {
        // handled silently on init
      });
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(res.token);
      setUser(res.user);
      try {
        const w = await apiFetch<{ products: Product[] }>('/api/account/wishlist');
        setWishlistIds(w.products.map((p) => p.id));
      } catch {
        // ignore
      }
      notify(lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : `Bienvenue, ${res.user.full_name}`);
      return res.user;
    },
    [lang, notify]
  );

  const register = useCallback(
    async (payload: { full_name: string; email: string; phone: string; password: string }) => {
      const res = await apiFetch<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredToken(res.token);
      setUser(res.user);
      notify(lang === 'ar' ? 'تم إنشاء حسابك بنجاح' : 'Compte CasaVente créé avec succès');
      return res.user;
    },
    [lang, notify]
  );

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setStoredToken(null);
    setUser(null);
    notify(lang === 'ar' ? 'تم تسجيل الخروج' : 'Vous êtes déconnecté', 'info');
  }, [lang, notify]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, variantLabel = '', openDrawer = true) => {
      if (product.stock <= 0) {
        notify(lang === 'ar' ? 'هذا المنتج غير متوفر حالياً' : 'Ce produit est actuellement en rupture de stock', 'error');
        return;
      }
      const chosenVariant =
        variantLabel ||
        product.variants
          ?.map((v) => v.options[0])
          .filter(Boolean)
          .join(' · ') ||
        'Standard';

      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.productId === product.id && i.variantLabel === chosenVariant
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          const nextQty = Math.min(product.stock, updated[existingIdx].quantity + quantity);
          updated[existingIdx] = { ...updated[existingIdx], quantity: nextQty };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name_fr: product.name_fr,
            name_ar: product.name_ar,
            price_mad: product.price_mad,
            old_price_mad: product.old_price_mad,
            image: product.images[0] || '',
            variantLabel: chosenVariant,
            quantity: Math.min(product.stock, quantity),
            stock: product.stock,
          },
        ];
      });
      if (openDrawer) setIsCartOpen(true);
      notify(
        lang === 'ar' ? 'تمت إضافة المنتج إلى السلة' : `« ${product.name_fr} » ajouté au panier`
      );
    },
    [lang, notify]
  );

  const updateCartQty = useCallback((productId: number, variantLabel: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.variantLabel === variantLabel
            ? { ...item, quantity: Math.max(0, Math.min(item.stock, qty)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: number, variantLabel: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantLabel === variantLabel))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    async (productId: number) => {
      const exists = wishlistIds.includes(productId);
      setWishlistIds((prev) => (exists ? prev.filter((id) => id !== productId) : [productId, ...prev]));
      if (user) {
        try {
          if (exists) {
            await apiFetch(`/api/account/wishlist/${productId}`, { method: 'DELETE' });
          } else {
            await apiFetch(`/api/account/wishlist/${productId}`, { method: 'POST' });
          }
        } catch {
          // revert on failure
          setWishlistIds((prev) => (exists ? [productId, ...prev] : prev.filter((id) => id !== productId)));
        }
      }
      notify(
        exists
          ? lang === 'ar'
            ? 'تمت الإزالة من المفضلة'
            : 'Retiré des favoris'
          : lang === 'ar'
            ? 'تمت الإضافة إلى المفضلة'
            : 'Ajouté aux favoris',
        'info'
      );
    },
    [lang, notify, user, wishlistIds]
  );

  const recordViewed = useCallback((productId: number) => {
    setRecentlyViewedIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 6);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price_mad * item.quantity, 0), [cart]);

  const value: StoreContextValue = {
    lang,
    setLang,
    t: translations[lang],
    route,
    navigate,
    user,
    authLoading,
    login,
    register,
    logout,
    refreshUser,
    categories,
    banners,
    shippingZones,
    brands,
    onlineGatewayConfigured,
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    wishlistIds,
    toggleWishlist,
    recentlyViewedIds,
    recordViewed,
    notify,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      {/* Non-blocking Toast Region */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-medium shadow-lg transition-all ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toast.type === 'info'
                  ? 'bg-[#142B4A] border-[#142B4A] text-white'
                  : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

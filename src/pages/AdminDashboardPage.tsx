import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Lock,
  Package,
  Plus,
  Printer,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatMad, ORDER_STATUS_LABELS } from '../lib/i18n';
import type {
  AdminStats,
  Banner,
  Category,
  Order,
  OrderStatus,
  Product,
  PromoCode,
  ShippingZone,
} from '../types';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'marketing';

interface AdminCustomer {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  is_active: number;
  created_at: string;
  order_count: number;
  total_spent_mad: number;
}

export function AdminDashboardPage() {
  const { user, authLoading, login, logout, notify } = useStore();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(false);

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pSlug, setPSlug] = useState('');
  const [pCatId, setPCatId] = useState<number>(1);
  const [pBrand, setPBrand] = useState('');
  const [pSku, setPSku] = useState('');
  const [pNameFr, setPNameFr] = useState('');
  const [pNameAr, setPNameAr] = useState('');
  const [pShortFr, setPShortFr] = useState('');
  const [pShortAr, setPShortAr] = useState('');
  const [pDescFr, setPDescFr] = useState('');
  const [pDescAr, setPDescAr] = useState('');
  const [pPrice, setPPrice] = useState('490');
  const [pOldPrice, setPOldPrice] = useState('');
  const [pStock, setPStock] = useState('10');
  const [pImages, setPImages] = useState<string[]>([]);
  const [pImageUrlInput, setPImageUrlInput] = useState('');
  const [pFeatured, setPFeatured] = useState(true);
  const [pBestseller, setPBestseller] = useState(false);
  const [pNew, setPNew] = useState(true);
  const [pActive, setPActive] = useState(true);

  // Category form state
  const [catSlug, setCatSlug] = useState('');
  const [catNameFr, setCatNameFr] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catDescFr, setCatDescFr] = useState('');
  const [catImg, setCatImg] = useState('/images/prod_audio_headphones_1794670919671.jpg');

  // Order detail & invoice modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState('');

  // Promo form
  const [promoCode, setPromoCode] = useState('');
  const [promoType, setPromoType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [promoVal, setPromoVal] = useState('15');
  const [promoMin, setPromoMin] = useState('300');

  useEffect(() => {
    document.title = 'Administration CasaVente | Back-Office';
  }, []);

  const loadAdminData = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [sRes, pRes, cRes, oRes, cuRes, prRes, bRes, zRes] = await Promise.all([
        apiFetch<AdminStats>('/api/admin/stats'),
        apiFetch<{ products: Product[] }>('/api/admin/products'),
        apiFetch<{ categories: Category[] }>('/api/admin/categories'),
        apiFetch<{ orders: Order[] }>('/api/admin/orders'),
        apiFetch<{ customers: AdminCustomer[] }>('/api/admin/customers'),
        apiFetch<{ promos: PromoCode[] }>('/api/admin/promos'),
        apiFetch<{ banners: Banner[] }>('/api/admin/banners'),
        apiFetch<{ zones: ShippingZone[] }>('/api/admin/shipping-zones'),
      ]);
      setStats(sRes);
      setProducts(pRes.products);
      setCategories(cRes.categories);
      setOrders(oRes.orders);
      setCustomers(cuRes.customers);
      setPromos(prRes.promos);
      setBanners(bRes.banners);
      setZones(zRes.zones);
      if (cRes.categories.length > 0 && !pCatId) setPCatId(cRes.categories[0].id);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur de chargement admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const logged = await login(adminEmail, adminPassword);
      if (logged.role !== 'ADMIN') {
        notify('Ce compte ne dispose pas des privilèges administrateur.', 'error');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Identifiants invalides', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setPSlug('');
    setPCatId(categories[0]?.id || 1);
    setPBrand('CasaVente');
    setPSku(`CV-${Date.now().toString().slice(-5)}`);
    setPNameFr('');
    setPNameAr('');
    setPShortFr('');
    setPShortAr('');
    setPDescFr('');
    setPDescAr('');
    setPPrice('490');
    setPOldPrice('');
    setPStock('10');
    setPImages(['/images/prod_audio_headphones_1794670919671.jpg']);
    setPFeatured(false);
    setPBestseller(false);
    setPNew(true);
    setPActive(true);
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setPSlug(prod.slug);
    setPCatId(prod.category_id);
    setPBrand(prod.brand);
    setPSku(prod.sku);
    setPNameFr(prod.name_fr);
    setPNameAr(prod.name_ar);
    setPShortFr(prod.short_desc_fr);
    setPShortAr(prod.short_desc_ar);
    setPDescFr(prod.description_fr);
    setPDescAr(prod.description_ar);
    setPPrice(String(prod.price_mad));
    setPOldPrice(prod.old_price_mad ? String(prod.old_price_mad) : '');
    setPStock(String(prod.stock));
    setPImages(prod.images.length > 0 ? prod.images : []);
    setPFeatured(prod.is_featured === 1);
    setPBestseller(prod.is_bestseller === 1);
    setPNew(prod.is_new === 1);
    setPActive(prod.is_active === 1);
    setProductModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = String(reader.result || '');
          const res = await apiFetch<{ url: string }>('/api/admin/upload', {
            method: 'POST',
            body: JSON.stringify({ filename: file.name.split('.')[0], dataUrl }),
          });
          setPImages((prev) => [...prev, res.url]);
          notify('Image téléchargée');
        } catch (err) {
          notify(err instanceof Error ? err.message : 'Échec upload', 'error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      slug: pSlug || pNameFr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      category_id: Number(pCatId),
      brand: pBrand,
      sku: pSku,
      name_fr: pNameFr,
      name_ar: pNameAr || pNameFr,
      short_desc_fr: pShortFr,
      short_desc_ar: pShortAr || pShortFr,
      description_fr: pDescFr,
      description_ar: pDescAr || pDescFr,
      specs: editingProduct?.specs || [{ label_fr: 'Garantie', label_ar: 'الضمان', value: '12 mois Maroc' }],
      variants: editingProduct?.variants || [{ name_fr: 'Modèle', name_ar: 'الطراز', options: ['Standard'] }],
      price_mad: Number(pPrice),
      old_price_mad: pOldPrice ? Number(pOldPrice) : null,
      stock: Number(pStock),
      images: pImages.length > 0 ? pImages : ['/images/prod_tech_laptop_1794670919612.jpg'],
      is_featured: pFeatured,
      is_bestseller: pBestseller,
      is_new: pNew,
      is_active: pActive,
    };

    try {
      if (editingProduct) {
        await apiFetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify('Produit mis à jour');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify('Produit ajouté au catalogue');
      }
      setProductModalOpen(false);
      await loadAdminData();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’enregistrement', 'error');
    }
  };

  const toggleProductActive = async (prod: Product) => {
    try {
      await apiFetch(`/api/admin/products/${prod.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          slug: prod.slug,
          category_id: prod.category_id,
          brand: prod.brand,
          sku: prod.sku,
          name_fr: prod.name_fr,
          name_ar: prod.name_ar,
          short_desc_fr: prod.short_desc_fr,
          short_desc_ar: prod.short_desc_ar,
          description_fr: prod.description_fr,
          description_ar: prod.description_ar,
          specs: prod.specs,
          variants: prod.variants,
          price_mad: prod.price_mad,
          old_price_mad: prod.old_price_mad,
          stock: prod.stock,
          images: prod.images,
          is_featured: prod.is_featured === 1,
          is_bestseller: prod.is_bestseller === 1,
          is_new: prod.is_new === 1,
          is_active: prod.is_active !== 1,
        }),
      });
      await loadAdminData();
      notify('Statut du produit modifié');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    await loadAdminData();
    notify('Produit supprimé ou archivé', 'info');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          slug: catSlug || catNameFr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name_fr: catNameFr,
          name_ar: catNameAr || catNameFr,
          parent_id: catParentId ? Number(catParentId) : null,
          description_fr: catDescFr,
          description_ar: catDescFr,
          image_url: catImg,
          sort_order: categories.length + 1,
        }),
      });
      setCatSlug('');
      setCatNameFr('');
      setCatNameAr('');
      setCatDescFr('');
      await loadAdminData();
      notify('Catégorie créée');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur catégorie', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      await loadAdminData();
      notify('Catégorie supprimée', 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Suppression impossible', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      const res = await apiFetch<{ order: Order }>(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, note: statusNote }),
      });
      setSelectedOrder(res.order);
      setStatusNote('');
      await loadAdminData();
      notify(`Commande ${res.order.order_number} passée à ${ORDER_STATUS_LABELS[status].fr}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/promos', {
        method: 'POST',
        body: JSON.stringify({
          code: promoCode,
          discount_type: promoType,
          discount_value: Number(promoVal),
          min_order_mad: Number(promoMin),
          max_uses: 500,
          is_active: true,
        }),
      });
      setPromoCode('');
      await loadAdminData();
      notify('Code promo créé');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur promo', 'error');
    }
  };

  const handleUpdateBanner = async (banner: Banner) => {
    await apiFetch(`/api/admin/banners/${banner.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...banner, is_active: banner.is_active === 1 }),
    });
    notify('Bannière mise à jour');
  };

  const handleUpdateZone = async (zone: ShippingZone) => {
    await apiFetch(`/api/admin/shipping-zones/${zone.id}`, {
      method: 'PUT',
      body: JSON.stringify(zone),
    });
    notify(`Tarif livraison mis à jour pour ${zone.city}`);
  };

  if (authLoading) {
    return <div className="max-w-md mx-auto py-20 text-center text-slate-500">Vérification des accès...</div>;
  }

  // Strict server-aligned Admin Gate
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#142B4A] text-white mx-auto flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#142B4A]">Administration CasaVente</h1>
            <p className="text-xs text-slate-500">
              Accès réservé aux administrateurs autorisés.
              {user && user.role !== 'ADMIN' && (
                <span className="block text-rose-600 mt-1">
                  Connecté en tant que client ({user.email}). Veuillez vous connecter avec un compte ADMIN.
                </span>
              )}
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail administrateur</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@casavente.ma"
                className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full h-11 rounded-lg bg-[#142B4A] text-white text-sm font-bold hover:bg-[#0F213A] cursor-pointer"
            >
              {loggingIn ? 'Authentification...' : 'Accéder au Back-Office'}
            </button>
          </form>

          {user && (
            <button
              type="button"
              onClick={logout}
              className="w-full text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Se déconnecter du compte actuel
            </button>
          )}
        </div>
      </div>
    );
  }

  const maxDayRev = Math.max(1, ...(stats?.salesByDay.map((d) => d.revenue) || [1]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#142B4A]">
                  Casa<span className="text-[#F28C28]">Vente</span> — FACTURE
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  CasaVente SARL · 148 Bd d’Anfa, Maarif, Casablanca · RC Casablanca 489210
                </p>
              </div>
              <div className="text-end">
                <p className="font-mono-num font-bold text-[#142B4A]">{invoiceOrder.order_number}</p>
                <p className="text-xs text-slate-500">
                  {new Date(invoiceOrder.created_at).toLocaleDateString('fr-MA')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Facturé & livré à</p>
                <p className="font-bold text-slate-900 mt-1">{invoiceOrder.customer_name}</p>
                <p className="font-mono-num text-slate-600">{invoiceOrder.customer_phone}</p>
                <p className="text-slate-600">{invoiceOrder.customer_email}</p>
                <p className="text-slate-600 mt-1">
                  {invoiceOrder.street_address}, {invoiceOrder.neighborhood}, {invoiceOrder.city}
                </p>
              </div>
              <div className="text-end">
                <p className="text-xs font-bold uppercase text-slate-400">Paiement & Livraison</p>
                <p className="mt-1">Mode : {invoiceOrder.delivery_mode}</p>
                <p>Règlement : {invoiceOrder.payment_method === 'COD' ? 'À la livraison (COD)' : 'CMI'}</p>
                <p>Statut : {ORDER_STATUS_LABELS[invoiceOrder.status].fr}</p>
              </div>
            </div>

            <table className="w-full text-sm border-t border-b border-slate-200">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2.5 px-3 text-start">Désignation</th>
                  <th className="py-2.5 px-3 text-end">Qté</th>
                  <th className="py-2.5 px-3 text-end">P.U (DH)</th>
                  <th className="py-2.5 px-3 text-end">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceOrder.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3">
                      {item.product_name}
                      {item.variant_label && <span className="text-xs text-slate-400 block">{item.variant_label}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-end font-mono-num">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-end font-mono-num">{formatMad(item.unit_price_mad)}</td>
                    <td className="py-2.5 px-3 text-end font-mono-num font-semibold">
                      {formatMad(item.line_total_mad)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1.5 text-sm text-end">
              <p>Sous-total : <strong className="font-mono-num">{formatMad(invoiceOrder.subtotal_mad)}</strong></p>
              {invoiceOrder.discount_mad > 0 && (
                <p className="text-emerald-700">
                  Remise ({invoiceOrder.promo_code}) : -{formatMad(invoiceOrder.discount_mad)}
                </p>
              )}
              <p>Livraison : <strong className="font-mono-num">{formatMad(invoiceOrder.shipping_mad)}</strong></p>
              <p className="text-lg font-extrabold text-[#142B4A] pt-2">
                Net à payer TTC : <span className="font-mono-num">{formatMad(invoiceOrder.total_mad)}</span>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 no-print">
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la facture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white max-w-2xl w-full rounded-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-[#142B4A]">
                {editingProduct ? `Modifier : ${editingProduct.name_fr}` : 'Ajouter un produit'}
              </h2>
              <button type="button" onClick={() => setProductModalOpen(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom (Français) *</label>
                <input
                  type="text"
                  required
                  value={pNameFr}
                  onChange={(e) => setPNameFr(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom (Arabe)</label>
                <input
                  type="text"
                  value={pNameAr}
                  onChange={(e) => setPNameAr(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catégorie *</label>
                <select
                  value={pCatId}
                  onChange={(e) => setPCatId(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_fr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Marque *</label>
                <input
                  type="text"
                  required
                  value={pBrand}
                  onChange={(e) => setPBrand(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Slug URL *</label>
                <input
                  type="text"
                  value={pSlug}
                  onChange={(e) => setPSlug(e.target.value)}
                  placeholder="auto-genere-si-vide"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SKU *</label>
                <input
                  type="text"
                  required
                  value={pSku}
                  onChange={(e) => setPSku(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Prix actuel (DH) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ancien prix barré (DH)</label>
                <input
                  type="number"
                  min={1}
                  value={pOldPrice}
                  onChange={(e) => setPOldPrice(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Stock disponible *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Résumé court (FR) *</label>
              <input
                type="text"
                required
                value={pShortFr}
                onChange={(e) => setPShortFr(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description détaillée (FR) *</label>
              <textarea
                rows={3}
                required
                value={pDescFr}
                onChange={(e) => setPDescFr(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {/* Multi-Image Upload + URL */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-600">
                Images produit ({pImages.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {pImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-16 rounded border border-slate-200 overflow-hidden">
                    <SmartImage src={img} alt={`Img ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 bg-white/90 rounded p-0.5 text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold cursor-pointer hover:bg-slate-100">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Télécharger images</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={pImageUrlInput}
                    onChange={(e) => setPImageUrlInput(e.target.value)}
                    placeholder="/images/..."
                    className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pImageUrlInput.trim()) {
                        setPImages((prev) => [...prev, pImageUrlInput.trim()]);
                        setPImageUrlInput('');
                      }
                    }}
                    className="px-3 h-9 rounded-lg bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    + URL
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-medium pt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={pActive} onChange={(e) => setPActive(e.target.checked)} />
                <span>Produit actif</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={pFeatured} onChange={(e) => setPFeatured(e.target.checked)} />
                <span>Mis en avant</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={pBestseller} onChange={(e) => setPBestseller(e.target.checked)} />
                <span>Meilleure vente</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={pNew} onChange={(e) => setPNew(e.target.checked)} />
                <span>Nouveauté</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-[#142B4A] text-white text-sm font-bold cursor-pointer"
              >
                Enregistrer le produit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workspace Header & Sidebar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 no-print">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#F28C28]">Back-Office CasaVente</p>
          <h1 className="text-2xl font-bold text-[#142B4A]">Tableau de bord administrateur</h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-600">{user.email}</span>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print">
        <aside className="lg:col-span-3 space-y-1">
          {[
            { id: 'dashboard' as const, label: 'Vue d’ensemble', icon: LayoutDashboard },
            { id: 'products' as const, label: 'Produits', icon: Package },
            { id: 'categories' as const, label: 'Catégories', icon: FolderTree },
            { id: 'orders' as const, label: 'Commandes & Factures', icon: ShoppingCart },
            { id: 'customers' as const, label: 'Clients', icon: Users },
            { id: 'marketing' as const, label: 'Promos, Bannières & Zones', icon: Tag },
          ].map((nav) => {
            const Icon = nav.icon;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === nav.id
                    ? 'bg-[#142B4A] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{nav.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {loading && !stats ? (
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ) : activeTab === 'dashboard' && stats ? (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Chiffre d’affaires', value: formatMad(stats.totalRevenueMad), accent: 'text-[#142B4A]' },
                  { label: 'Commandes totales', value: String(stats.totalOrders), accent: 'text-[#142B4A]' },
                  { label: 'Clients inscrits', value: String(stats.totalCustomers), accent: 'text-[#142B4A]' },
                  { label: 'Produits catalogue', value: String(stats.totalProducts), accent: 'text-[#142B4A]' },
                  { label: 'Commandes en attente', value: String(stats.pendingOrders), accent: 'text-amber-600' },
                  { label: 'Ruptures de stock', value: String(stats.outOfStockProducts), accent: 'text-rose-600' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-xs font-semibold text-slate-500">{kpi.label}</p>
                    <p className={`mt-2 text-2xl font-extrabold font-mono-num ${kpi.accent}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Sales Evolution Chart & Status Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#142B4A] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#F28C28]" />
                      <span>Évolution du chiffre d’affaires (DH)</span>
                    </h2>
                  </div>

                  <div className="h-52 flex items-end gap-3 pt-4 border-b border-slate-200 pb-2">
                    {stats.salesByDay.map((d) => {
                      const pct = Math.max(12, Math.round((d.revenue / maxDayRev) * 100));
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-[11px] font-mono-num text-slate-600 font-semibold">
                            {formatMad(d.revenue)}
                          </span>
                          <div
                            className="w-full max-w-[48px] bg-[#142B4A] hover:bg-[#F28C28] transition-colors rounded-t-md"
                            style={{ height: `${pct}%` }}
                            title={`${d.date}: ${formatMad(d.revenue)} (${d.orders} cmd)`}
                          />
                          <span className="text-[11px] font-mono-num text-slate-400">{d.date.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-sm font-bold text-[#142B4A]">Répartition des commandes</h2>
                  <div className="space-y-3">
                    {stats.ordersByStatus.map((row) => {
                      const info = ORDER_STATUS_LABELS[row.status];
                      return (
                        <div key={row.status} className="flex items-center justify-between text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${info.tone}`}>
                            {info.fr}
                          </span>
                          <span className="font-mono-num font-bold text-slate-900">{row.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'products' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-[#142B4A]">Catalogue produits ({products.length})</h2>
                <button
                  type="button"
                  onClick={openNewProductModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F28C28] text-white text-xs font-bold hover:bg-[#DF7B17] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau produit</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-start">Produit</th>
                      <th className="py-3 px-4 text-start">Catégorie</th>
                      <th className="py-3 px-4 text-end">Prix</th>
                      <th className="py-3 px-4 text-end">Stock</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <SmartImage
                              src={prod.images[0]}
                              alt={prod.name_fr}
                              className="w-11 h-9 rounded object-cover shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-slate-900 line-clamp-1">{prod.name_fr}</p>
                              <p className="text-xs font-mono-num text-slate-400">{prod.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{prod.category_name_fr}</td>
                        <td className="py-3 px-4 text-end font-mono-num font-bold text-[#142B4A]">
                          {formatMad(prod.price_mad)}
                        </td>
                        <td
                          className={`py-3 px-4 text-end font-mono-num font-semibold ${
                            prod.stock === 0 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {prod.stock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleProductActive(prod)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                              prod.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {prod.is_active === 1 ? 'Actif' : 'Désactivé'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-end space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(prod)}
                            className="text-xs font-semibold text-[#142B4A] hover:underline cursor-pointer"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'categories' ? (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateCategory}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              >
                <h2 className="text-base font-bold text-[#142B4A]">Ajouter une catégorie / sous-catégorie</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={catNameFr}
                    onChange={(e) => setCatNameFr(e.target.value)}
                    placeholder="Nom (FR) *"
                    className="h-10 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={catNameAr}
                    onChange={(e) => setCatNameAr(e.target.value)}
                    placeholder="Nom (AR)"
                    className="h-10 px-3 border border-slate-200 rounded-lg text-sm"
                    dir="rtl"
                  />
                  <select
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    className="h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">Catégorie principale</option>
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          Sous-catégorie de : {c.name_fr}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={catDescFr}
                    onChange={(e) => setCatDescFr(e.target.value)}
                    placeholder="Description"
                    className="h-10 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={catImg}
                    onChange={(e) => setCatImg(e.target.value)}
                    placeholder="URL image"
                    className="h-10 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#142B4A] text-white text-xs font-bold cursor-pointer"
                >
                  Ajouter la catégorie
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <SmartImage src={cat.image_url} alt={cat.name_fr} className="w-12 h-9 rounded object-cover" />
                      <div>
                        <p className="font-semibold text-sm text-slate-900">
                          {cat.parent_id ? '↳ ' : ''}
                          {cat.name_fr} <span className="text-slate-400">({cat.name_ar})</span>
                        </p>
                        <p className="text-xs text-slate-500">{cat.description_fr}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h2 className="text-base font-bold text-[#142B4A]">Gestion des commandes ({orders.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 text-start">N°</th>
                        <th className="py-3 px-4 text-start">Client & Ville</th>
                        <th className="py-3 px-4 text-end">Total</th>
                        <th className="py-3 px-4 text-center">Statut</th>
                        <th className="py-3 px-4 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => {
                        const info = ORDER_STATUS_LABELS[ord.status];
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono-num font-bold text-[#142B4A]">
                              {ord.order_number}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">{ord.customer_name}</p>
                              <p className="text-xs text-slate-500">
                                {ord.city} · {ord.customer_phone}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-end font-mono-num font-bold">
                              {formatMad(ord.total_mad)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${info.tone}`}>
                                {info.fr}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-end space-x-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(selectedOrder?.id === ord.id ? null : ord)}
                                className="text-xs font-semibold text-[#142B4A] hover:underline cursor-pointer"
                              >
                                Gérer
                              </button>
                              <button
                                type="button"
                                onClick={() => setInvoiceOrder(ord)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#F28C28] hover:underline cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Facture</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#142B4A]">
                      Détails commande {selectedOrder.order_number}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="text-xs text-slate-500 cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">
                    Adresse : {selectedOrder.street_address}, {selectedOrder.neighborhood}, {selectedOrder.city} ·{' '}
                    {selectedOrder.customer_email}
                  </p>
                  <div className="space-y-1 text-sm">
                    {selectedOrder.items?.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>
                          {it.quantity}x {it.product_name} ({it.variant_label})
                        </span>
                        <span className="font-mono-num">{formatMad(it.line_total_mad)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Note de suivi (optionnel)"
                      className="flex-1 min-w-[200px] h-9 px-3 border border-slate-200 rounded-lg text-xs"
                    />
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                      className="h-9 px-3 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                    >
                      {Object.keys(ORDER_STATUS_LABELS).map((st) => (
                        <option key={st} value={st}>
                          {ORDER_STATUS_LABELS[st as OrderStatus].fr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'customers' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h2 className="text-base font-bold text-[#142B4A]">Clients ({customers.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-start">Client</th>
                      <th className="py-3 px-4 text-start">Téléphone</th>
                      <th className="py-3 px-4 text-end">Commandes</th>
                      <th className="py-3 px-4 text-end">Total dépensé</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{c.full_name}</p>
                          <p className="text-xs text-slate-500">{c.email}</p>
                        </td>
                        <td className="py-3 px-4 font-mono-num text-xs">{c.phone}</td>
                        <td className="py-3 px-4 text-end font-mono-num">{c.order_count}</td>
                        <td className="py-3 px-4 text-end font-mono-num font-bold text-[#142B4A]">
                          {formatMad(c.total_spent_mad)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/admin/customers/${c.id}/toggle`, { method: 'PUT' });
                              await loadAdminData();
                              notify('Compte client mis à jour');
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                              c.is_active === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {c.is_active === 1 ? 'Actif' : 'Suspendu'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Promo Codes */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-[#142B4A]">Codes promotionnels</h2>
                <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    required
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="CODE (ex: RAMADAN20)"
                    className="h-10 px-3 border border-slate-200 rounded-lg text-xs uppercase font-mono-num"
                  />
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as 'PERCENT' | 'FIXED')}
                    className="h-10 px-3 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="PERCENT">Pourcentage (%)</option>
                    <option value="FIXED">Montant fixe (DH)</option>
                  </select>
                  <input
                    type="number"
                    required
                    value={promoVal}
                    onChange={(e) => setPromoVal(e.target.value)}
                    placeholder="Valeur"
                    className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-mono-num"
                  />
                  <input
                    type="number"
                    required
                    value={promoMin}
                    onChange={(e) => setPromoMin(e.target.value)}
                    placeholder="Min. DH"
                    className="h-10 px-3 border border-slate-200 rounded-lg text-xs font-mono-num"
                  />
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-[#142B4A] text-white text-xs font-bold cursor-pointer"
                  >
                    Créer code
                  </button>
                </form>

                <div className="divide-y divide-slate-100">
                  {promos.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-mono-num font-bold text-[#142B4A]">{p.code}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        <span>
                          {p.discount_type === 'PERCENT' ? `-${p.discount_value}%` : `-${formatMad(p.discount_value)}`}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          (Min. {formatMad(p.min_order_mad)} · Utilisé {p.used_count}x)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/admin/promos/${p.id}/toggle`, { method: 'PUT' });
                            await loadAdminData();
                          }}
                          className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer ${
                            p.is_active === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.is_active === 1 ? 'Actif' : 'Inactif'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/admin/promos/${p.id}`, { method: 'DELETE' });
                            await loadAdminData();
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Banner Editor */}
              {banners.map((banner) => (
                <div key={banner.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                  <h2 className="text-base font-bold text-[#142B4A]">Bannière publicitaire principale</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={banner.title_fr}
                      onChange={(e) =>
                        setBanners((prev) =>
                          prev.map((b) => (b.id === banner.id ? { ...b, title_fr: e.target.value } : b))
                        )
                      }
                      className="h-10 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={banner.subtitle_fr}
                      onChange={(e) =>
                        setBanners((prev) =>
                          prev.map((b) => (b.id === banner.id ? { ...b, subtitle_fr: e.target.value } : b))
                        )
                      }
                      className="h-10 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateBanner(banner)}
                    className="px-4 py-2 rounded-lg bg-[#142B4A] text-white text-xs font-bold cursor-pointer"
                  >
                    Mettre à jour la bannière
                  </button>
                </div>
              ))}

              {/* Shipping Zones Fees */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h2 className="text-base font-bold text-[#142B4A]">Frais de livraison par ville marocaine</h2>
                <div className="divide-y divide-slate-100">
                  {zones.map((z) => (
                    <div key={z.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="font-semibold w-36">{z.city}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Tarif (DH):</label>
                        <input
                          type="number"
                          value={z.fee_mad}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((item) =>
                                item.id === z.id ? { ...item, fee_mad: Number(e.target.value) } : item
                              )
                            )
                          }
                          className="w-20 h-8 px-2 border border-slate-200 rounded font-mono-num text-xs"
                        />
                        <label className="text-xs text-slate-500">Gratuit dès:</label>
                        <input
                          type="number"
                          value={z.free_threshold_mad}
                          onChange={(e) =>
                            setZones((prev) =>
                              prev.map((item) =>
                                item.id === z.id ? { ...item, free_threshold_mad: Number(e.target.value) } : item
                              )
                            )
                          }
                          className="w-24 h-8 px-2 border border-slate-200 rounded font-mono-num text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateZone(z)}
                          className="px-3 h-8 rounded bg-slate-100 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

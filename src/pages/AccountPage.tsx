import { Heart, LogOut, MapPin, Package, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { syncCatalogToFirestore } from '../lib/firebase';
import { formatMad, MOROCCAN_CITIES, ORDER_STATUS_LABELS } from '../lib/i18n';
import type { Address, Order, Product } from '../types';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type AccountTab = 'orders' | 'addresses' | 'wishlist' | 'profile';

export function AccountPage() {
  const {
    lang,
    route,
    user,
    firebaseUser,
    authLoading,
    login,
    register,
    signInWithGoogle,
    logout,
    refreshUser,
    categories,
    banners,
    shippingZones,
    notify,
    navigate,
  } = useStore();
  const [syncingCatalog, setSyncingCatalog] = useState(false);

  const urlParams = new URLSearchParams(route.split('?')[1] || '');
  const initialTab = (urlParams.get('tab') as AccountTab) || 'orders';

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Account data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Profile form
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');

  // New Address form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Domicile');
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrCity, setAddrCity] = useState('Casablanca');
  const [addrNeighborhood, setAddrNeighborhood] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNotes, setAddrNotes] = useState('');

  useEffect(() => {
    document.title = 'Mon Compte Client | CasaVente Maroc';
  }, []);

  useEffect(() => {
    const tabParam = new URLSearchParams(route.split('?')[1] || '').get('tab') as AccountTab | null;
    if (tabParam) setActiveTab(tabParam);
  }, [route]);

  const loadAccountData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [oRes, aRes, wRes] = await Promise.all([
        apiFetch<{ orders: Order[] }>('/api/account/orders'),
        apiFetch<{ addresses: Address[] }>('/api/account/addresses'),
        apiFetch<{ products: Product[] }>('/api/account/wishlist'),
      ]);
      setOrders(oRes.orders);
      setAddresses(aRes.addresses);
      setWishlistProducts(wRes.products);
      setProfName(user.full_name);
      setProfPhone(user.phone);
      setAddrName(user.full_name);
      setAddrPhone(user.phone);
    } catch {
      // handled silently
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) loadAccountData();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      const logged = await login(email, password);
      if (logged.role === 'ADMIN') navigate('/admin');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur de connexion', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      await register({ full_name: fullName, email, phone, password });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’inscription', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      const res = await apiFetch<{ message: string; devResetToken?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      notify(res.message, 'info');
      if (res.devResetToken) {
        setResetToken(res.devResetToken);
        setAuthMode('reset');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, password }),
      });
      notify(res.message);
      setAuthMode('login');
      setPassword('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name: profName, phone: profPhone }),
      });
      await refreshUser();
      notify('Profil mis à jour');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/account/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: addrLabel,
          full_name: addrName,
          phone: addrPhone,
          city: addrCity,
          neighborhood: addrNeighborhood,
          street_address: addrStreet,
          notes: addrNotes,
          is_default: addresses.length === 0,
        }),
      });
      setShowAddAddress(false);
      setAddrNeighborhood('');
      setAddrStreet('');
      setAddrNotes('');
      await loadAccountData();
      notify('Adresse enregistrée');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur', 'error');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    await apiFetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    await loadAccountData();
    notify('Adresse supprimée', 'info');
  };

  const handleSetDefaultAddress = async (id: number) => {
    await apiFetch(`/api/account/addresses/${id}/default`, { method: 'PUT' });
    await loadAccountData();
    notify('Adresse par défaut mise à jour');
  };

  if (authLoading) {
    return <div className="max-w-md mx-auto py-20 px-4 text-center text-slate-500">Chargement...</div>;
  }

  const handleGoogleSignIn = async () => {
    setAuthSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur de connexion Google', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSyncCatalog = async () => {
    setSyncingCatalog(true);
    try {
      const res = await apiFetch<{ products: Product[] }>('/api/products?limit=100');
      const count = await syncCatalogToFirestore(categories, res.products, banners, shippingZones);
      notify(`${count} documents synchronisés dans Firestore`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Échec de synchronisation Firestore', 'error');
    } finally {
      setSyncingCatalog(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          {firebaseUser && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                    {lang === 'ar' ? 'حساب Google متصل' : 'Compte Google connecté'}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {firebaseUser.displayName || firebaseUser.email}
                  </p>
                  <p className="text-xs text-slate-600">{firebaseUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Déconnexion
                </button>
              </div>
              {firebaseUser.email === 'archillevladimir@gmail.com' && (
                <button
                  type="button"
                  disabled={syncingCatalog}
                  onClick={handleSyncCatalog}
                  className="w-full h-9 rounded-lg bg-[#142B4A] text-white text-xs font-semibold hover:bg-[#0F213A] cursor-pointer"
                >
                  {syncingCatalog ? 'Synchronisation...' : 'Synchroniser le catalogue vers Firestore'}
                </button>
              )}
            </div>
          )}

          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                authMode === 'login' ? 'border-[#142B4A] text-[#142B4A]' : 'border-transparent text-slate-500'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                authMode === 'register' ? 'border-[#142B4A] text-[#142B4A]' : 'border-transparent text-slate-500'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {!firebaseUser && (
            <button
              type="button"
              disabled={authSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full h-11 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{lang === 'ar' ? 'المتابعة عبر Google' : 'Continuer avec Google'}</span>
            </button>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-[#142B4A] hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('salma.bennani@casavente.ma');
                    setPassword('Client!2026');
                  }}
                  className="text-[#F28C28] font-semibold hover:underline cursor-pointer"
                >
                  Compte client démo
                </button>
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full h-11 rounded-lg bg-[#142B4A] text-white text-sm font-bold hover:bg-[#0F213A] cursor-pointer"
              >
                {authSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom et prénom</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Karim Tazi"
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone marocain</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212612345678"
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mot de passe (8 caractères min.)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full h-11 rounded-lg bg-[#F28C28] text-white text-sm font-bold hover:bg-[#DF7B17] cursor-pointer"
              >
                {authSubmitting ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm text-slate-600">
                Saisissez votre adresse e-mail pour recevoir un jeton de réinitialisation sécurisé.
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.ma"
                className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full h-11 rounded-lg bg-[#142B4A] text-white text-sm font-bold cursor-pointer"
              >
                Envoyer les instructions
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Retour à la connexion
              </button>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-slate-600">Définissez votre nouveau mot de passe.</p>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Jeton de réinitialisation"
                className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
              />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe (8+ car.)"
                className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full h-11 rounded-lg bg-[#142B4A] text-white text-sm font-bold cursor-pointer"
              >
                Mettre à jour le mot de passe
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#142B4A]">
            {lang === 'ar' ? `مرحباً، ${user.full_name}` : `Bonjour, ${user.full_name}`}
          </h1>
          <p className="text-sm text-slate-500">{user.email} · {user.phone}</p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-lg bg-[#F28C28] text-white text-sm font-semibold cursor-pointer"
            >
              Ouvrir le Back-Office
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 space-y-1">
          {[
            { id: 'orders' as const, label: 'Mes commandes', icon: Package },
            { id: 'addresses' as const, label: 'Mes adresses', icon: MapPin },
            { id: 'wishlist' as const, label: 'Mes favoris', icon: Heart },
            { id: 'profile' as const, label: 'Mon profil', icon: UserIcon },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#142B4A] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9">
          {loadingData ? (
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ) : activeTab === 'orders' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#142B4A]">Historique de vos commandes</h2>
              {orders.length === 0 ? (
                <div className="border border-slate-200 rounded-xl p-8 text-center bg-slate-50">
                  <p className="text-sm text-slate-600">Vous n’avez pas encore passé de commande.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/catalogue')}
                    className="mt-4 px-5 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
                  >
                    Découvrir le catalogue
                  </button>
                </div>
              ) : (
                orders.map((ord) => {
                  const st = ORDER_STATUS_LABELS[ord.status];
                  return (
                    <div key={ord.id} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="font-mono-num font-bold text-[#142B4A]">{ord.order_number}</span>
                          <span className="mx-2 text-slate-300">·</span>
                          <span className="text-xs text-slate-500">
                            {new Date(ord.created_at).toLocaleDateString('fr-MA')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${st.tone}`}>
                            {lang === 'ar' ? st.ar : st.fr}
                          </span>
                          <span className="font-mono-num font-bold text-[#142B4A]">
                            {formatMad(ord.total_mad, lang)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600">
                        Livraison à {ord.street_address}, {ord.neighborhood}, {ord.city}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(selectedOrder?.id === ord.id ? null : ord)}
                          className="text-xs font-semibold text-[#142B4A] hover:text-[#F28C28] cursor-pointer"
                        >
                          {selectedOrder?.id === ord.id ? 'Masquer les détails' : 'Consulter les détails & suivi'}
                        </button>
                      </div>

                      {selectedOrder?.id === ord.id && (
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                          <div className="space-y-2">
                            {ord.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x {item.product_name}{' '}
                                  <span className="text-xs text-slate-400">({item.variant_label})</span>
                                </span>
                                <span className="font-mono-num font-semibold">
                                  {formatMad(item.line_total_mad, lang)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-bold uppercase text-slate-500">Suivi d’avancement</p>
                            {ord.timeline?.map((step) => (
                              <div key={step.id} className="flex items-start justify-between text-xs gap-4">
                                <span className="text-slate-800 font-medium">{step.note}</span>
                                <span className="text-slate-400 font-mono-num shrink-0">
                                  {new Date(step.created_at).toLocaleString('fr-MA')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'addresses' ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#142B4A]">Adresses de livraison</h2>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#142B4A] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle adresse</span>
                </button>
              </div>

              {showAddAddress && (
                <form
                  onSubmit={handleAddAddress}
                  className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={addrLabel}
                      onChange={(e) => setAddrLabel(e.target.value)}
                      placeholder="Libellé (Domicile, Bureau)"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      placeholder="Nom complet"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                    <input
                      type="tel"
                      required
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      placeholder="+2126..."
                      className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono-num"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      {MOROCCAN_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={addrNeighborhood}
                      onChange={(e) => setAddrNeighborhood(e.target.value)}
                      placeholder="Quartier (ex: Maarif)"
                      className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    placeholder="Adresse complète"
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-[#F28C28] text-white text-xs font-bold cursor-pointer"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#142B4A]">
                        {addr.label} {addr.is_default === 1 && '· Par défaut'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-slate-800">{addr.full_name}</p>
                    <p className="text-xs font-mono-num text-slate-500">{addr.phone}</p>
                    <p className="text-xs text-slate-600">
                      {addr.street_address}, {addr.neighborhood}, {addr.city}
                    </p>
                    {addr.is_default !== 1 && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-xs font-semibold text-[#142B4A] hover:underline cursor-pointer"
                      >
                        Définir par défaut
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'wishlist' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#142B4A]">Vos produits favoris ({wishlistProducts.length})</h2>
              {wishlistProducts.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun produit enregistré dans vos favoris.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="max-w-lg border border-slate-200 rounded-xl p-6 bg-white space-y-4">
              <h2 className="text-lg font-bold text-[#142B4A]">Modifier mon profil</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone marocain</label>
                <input
                  type="tel"
                  required
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
              >
                Enregistrer les modifications
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

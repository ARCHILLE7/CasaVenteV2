import { ChevronDown, Heart, Menu, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatMad } from '../lib/i18n';
import { SmartImage } from './SmartImage';

interface Suggestion {
  id: number;
  slug: string;
  name_fr: string;
  name_ar: string;
  price_mad: number;
  category_name_fr: string;
  image: string;
}

export function Navbar() {
  const {
    lang,
    setLang,
    t,
    navigate,
    categories,
    user,
    cartCount,
    wishlistIds,
    setIsCartOpen,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      apiFetch<{ suggestions: Suggestion[] }>(`/api/products/suggestions?q=${encodeURIComponent(trimmed)}`)
        .then((res) => setSuggestions(res.suggestions))
        .catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    navigate(searchQuery.trim() ? `/catalogue?q=${encodeURIComponent(searchQuery.trim())}` : '/catalogue');
  };

  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-[#142B4A] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#142B4A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-7 h-7 rounded-md bg-[#142B4A] text-white inline-flex items-center justify-center text-xs font-bold">
              CV
            </span>
            <span>
              Casa<span className="text-[#F28C28]">Vente</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation & Search */}
        <div className="hidden lg:flex items-center gap-6 flex-1 min-w-0">
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600 shrink-0">
            <div ref={catMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowCategories(!showCategories)}
                className="inline-flex items-center gap-1 hover:text-[#142B4A] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
              >
                <span>{t.nav.categories}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid gap-1 z-50">
                  {rootCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setShowCategories(false);
                        navigate(`/catalogue?category=${encodeURIComponent(cat.slug)}`);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-start text-sm text-slate-700 hover:bg-slate-50 hover:text-[#142B4A] cursor-pointer"
                    >
                      <span className="font-medium">{lang === 'ar' ? cat.name_ar : cat.name_fr}</span>
                      <span className="text-xs text-slate-400 font-mono-num">{cat.product_count ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/catalogue')}
              className="hover:text-[#142B4A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.nav.catalog}
            </button>
            <button
              type="button"
              onClick={() => navigate('/catalogue?promo=true')}
              className="hover:text-[#F28C28] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.nav.deals}
            </button>
            <button
              type="button"
              onClick={() => navigate('/suivi')}
              className="hover:text-[#142B4A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.nav.track}
            </button>
          </nav>

          {/* Search with Live Suggestions */}
          <div ref={searchBoxRef} className="relative flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder={t.nav.searchPlaceholder}
                className="w-full h-10 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#142B4A]"
              />
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/produit/${item.slug}`);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-start hover:bg-slate-50 transition-colors border-b last:border-b-0 border-slate-100 cursor-pointer"
                  >
                    <SmartImage src={item.image} alt={item.name_fr} className="w-11 h-9 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {lang === 'ar' ? item.name_ar : item.name_fr}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{item.category_name_fr}</p>
                    </div>
                    <span className="text-xs font-bold text-[#142B4A] font-mono-num shrink-0">
                      {formatMad(item.price_mad, lang)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Language, Account, Wishlist & Cart */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#142B4A] hover:text-[#142B4A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Changer la langue FR / AR"
          >
            {lang === 'fr' ? 'العربية' : 'FR'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/compte?tab=wishlist')}
            aria-label={t.nav.wishlist}
            className="relative p-2 rounded-lg text-slate-600 hover:text-[#142B4A] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Heart className="w-5 h-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#142B4A] text-white text-[10px] font-mono-num font-bold flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/compte')}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-sm font-medium text-slate-700 hover:text-[#142B4A] hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[110px] truncate">
              {user ? user.full_name.split(' ')[0] : t.nav.account}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={t.nav.cart}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#F28C28] text-white text-sm font-semibold hover:bg-[#DF7B17] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{t.nav.cart}</span>
            <span className="font-mono-num text-xs bg-white/20 px-1.5 py-0.5 rounded">{cartCount}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.nav.searchPlaceholder}
              className="w-full h-10 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/catalogue');
              }}
              className="text-start px-3 py-2 rounded-lg bg-slate-50 font-medium text-slate-800"
            >
              {t.nav.catalog}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/catalogue?promo=true');
              }}
              className="text-start px-3 py-2 rounded-lg bg-slate-50 font-medium text-[#F28C28]"
            >
              {t.nav.deals}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/suivi');
              }}
              className="text-start px-3 py-2 rounded-lg bg-slate-50 font-medium text-slate-800"
            >
              {t.nav.track}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/admin');
              }}
              className="text-start px-3 py-2 rounded-lg bg-slate-50 font-medium text-[#142B4A]"
            >
              {t.nav.admin}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {t.nav.categories}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {rootCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(`/catalogue?category=${encodeURIComponent(c.slug)}`);
                  }}
                  className="text-start text-xs py-1.5 px-2 rounded hover:bg-slate-50 text-slate-700 truncate"
                >
                  {lang === 'ar' ? c.name_ar : c.name_fr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

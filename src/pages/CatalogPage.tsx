import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import type { Product } from '../types';

export function CatalogPage() {
  const { lang, route, navigate, categories, brands } = useStore();

  const urlParams = new URLSearchParams(route.split('?')[1] || '');
  const [q, setQ] = useState(urlParams.get('q') || '');
  const [category, setCategory] = useState(urlParams.get('category') || '');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [promoOnly, setPromoOnly] = useState(urlParams.get('promo') === 'true');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextParams = new URLSearchParams(route.split('?')[1] || '');
    setQ(nextParams.get('q') || '');
    setCategory(nextParams.get('category') || '');
    setPromoOnly(nextParams.get('promo') === 'true');
    setPage(1);
  }, [route]);

  useEffect(() => {
    document.title = 'Catalogue CasaVente – Produits au meilleur prix au Maroc';
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (inStock) params.set('inStock', 'true');
    if (minRating) params.set('minRating', minRating);
    if (promoOnly) params.set('promo', 'true');
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '9');

    apiFetch<{
      products: Product[];
      pagination: { total: number; page: number; totalPages: number };
    }>(`/api/products?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setProducts(res.products);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, category, brand, minPrice, maxPrice, inStock, minRating, promoOnly, sort, page]);

  const resetFilters = () => {
    setQ('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setMinRating('');
    setPromoOnly(false);
    setSort('popular');
    setPage(1);
    navigate('/catalogue');
  };

  const rootCategories = categories.filter((c) => !c.parent_id);

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {lang === 'ar' ? 'الفئة' : 'Catégorie'}
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setPage(1);
            }}
            className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              !category ? 'bg-[#142B4A] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {lang === 'ar' ? 'جميع الفئات' : 'Toutes les catégories'}
          </button>
          {rootCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.slug);
                setPage(1);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                category === c.slug
                  ? 'bg-[#142B4A] text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{lang === 'ar' ? c.name_ar : c.name_fr}</span>
              <span className="text-xs opacity-70 font-mono-num">{c.product_count ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {lang === 'ar' ? 'السعر (درهم)' : 'Prix (DH)'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(1);
            }}
            placeholder="Min DH"
            className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg font-mono-num"
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
            placeholder="Max DH"
            className="w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg font-mono-num"
          />
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {lang === 'ar' ? 'العلامة التجارية' : 'Marque'}
        </h3>
        <select
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
        >
          <option value="">{lang === 'ar' ? 'كل العلامات' : 'Toutes les marques'}</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-5 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {lang === 'ar' ? 'التقييم الأدنى' : 'Note minimale'}
        </h3>
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
        >
          <option value="">{lang === 'ar' ? 'جميع التقييمات' : 'Toutes les notes'}</option>
          <option value="4.8">4.8 ★ & +</option>
          <option value="4.5">4.5 ★ & +</option>
          <option value="4">4.0 ★ & +</option>
        </select>
      </div>

      <div className="pt-5 border-t border-slate-200 space-y-2.5">
        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => {
              setInStock(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-[#142B4A]"
          />
          <span>{lang === 'ar' ? 'متوفر فقط' : 'En stock uniquement'}</span>
        </label>

        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={promoOnly}
            onChange={(e) => {
              setPromoOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-[#F28C28]"
          />
          <span>{lang === 'ar' ? 'العروض والتخفيضات' : 'En promotion uniquement'}</span>
        </label>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full py-2.5 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Réinitialiser les filtres'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#142B4A]">
            {lang === 'ar' ? 'كتالوج كازافانت' : 'Catalogue CasaVente'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 font-mono-num">
            {total} {lang === 'ar' ? 'منتج متاح' : 'produits trouvés'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={lang === 'ar' ? 'تصفية حسب الاسم...' : 'Filtrer par mot-clé...'}
              className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Tri"
            className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
          >
            <option value="popular">{lang === 'ar' ? 'الأكثر شعبية' : 'Popularité'}</option>
            <option value="newest">{lang === 'ar' ? 'الأحدث' : 'Nouveautés'}</option>
            <option value="price_asc">{lang === 'ar' ? 'السعر: من الأقل إلى الأعلى' : 'Prix croissant'}</option>
            <option value="price_desc">{lang === 'ar' ? 'السعر: من الأعلى إلى الأقل' : 'Prix décroissant'}</option>
            <option value="rating">{lang === 'ar' ? 'الأعلى تقييماً' : 'Mieux notés'}</option>
          </select>

          <div className="hidden sm:flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grille"
              className={`p-2 rounded-md cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#142B4A] shadow-sm' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Liste"
              className={`p-2 rounded-md cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#142B4A] shadow-sm' : 'text-slate-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصفية' : 'Filtres'}</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">{FilterPanel}</aside>

        {/* Mobile Filter Modal */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/40" onClick={() => setMobileFiltersOpen(false)} />
            <div className="relative w-80 max-w-full bg-white h-full p-6 overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#142B4A]">
                  {lang === 'ar' ? 'تصفية المنتجات' : 'Filtres'}
                </h2>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {FilterPanel}
            </div>
          </div>
        )}

        {/* Product Results */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-100 rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50">
              <p className="text-base font-semibold text-slate-800">
                {lang === 'ar' ? 'لم يتم العثور على أي منتج مطابق' : 'Aucun produit ne correspond à votre recherche.'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {lang === 'ar'
                  ? 'حاول تعديل معايير البحث أو إزالة بعض الفلاتر.'
                  : 'Essayez d’élargir votre fourchette de prix ou de réinitialiser les filtres.'}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold hover:bg-[#0F213A] cursor-pointer"
              >
                {lang === 'ar' ? 'عرض جميع المنتجات' : 'Voir tout le catalogue'}
              </button>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} layout={viewMode} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-10 h-10 rounded-lg text-sm font-mono-num font-semibold transition-colors cursor-pointer ${
                          page === p
                            ? 'bg-[#142B4A] text-white'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

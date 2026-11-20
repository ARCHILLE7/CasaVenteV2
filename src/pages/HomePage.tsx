import { ArrowRight, Banknote, ChevronLeft, ChevronRight, Headphones, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatMad } from '../lib/i18n';
import type { Product } from '../types';

type CollectionTab = 'popular' | 'bestsellers' | 'newest' | 'promos' | 'recommended' | 'recent';

export function HomePage() {
  const { lang, t, navigate, categories, banners, recentlyViewedIds } = useStore();
  const [activeTab, setActiveTab] = useState<CollectionTab>('popular');
  const [products, setProducts] = useState<Product[]>([]);
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  const heroBanner = banners[0];
  const rootCategories = categories.filter((c) => !c.parent_id).slice(0, 8);

  useEffect(() => {
    document.title = 'CasaVente – Boutique E-Commerce Maroc | Casablanca & Livraison Nationale';
    apiFetch<{ products: Product[] }>('/api/products?featured=true&limit=5')
      .then((res) => setHeroProducts(res.products.slice(0, 5)))
      .catch(() => setHeroProducts([]));
  }, []);

  const heroSlides =
    heroProducts.length > 0
      ? heroProducts.map((p) => ({
          id: p.id,
          slug: p.slug,
          image: p.images[0],
          title: lang === 'ar' ? p.name_ar : p.name_fr,
          brand: p.brand,
          price_mad: p.price_mad,
          old_price_mad: p.old_price_mad,
        }))
      : [
          {
            id: 0,
            slug: '',
            image: heroBanner?.image_url || '/images/hero_casavente_showcase_1794670919753.jpg',
            title: 'CasaVente Sélection Casablanca',
            brand: 'CasaVente',
            price_mad: 0,
            old_price_mad: null as number | null,
          },
        ];

  useEffect(() => {
    if (heroSlides.length <= 1 || heroPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length, heroPaused]);

  const activeSlide = heroSlides[heroSlideIdx % heroSlides.length] || heroSlides[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set('limit', '8');
    if (activeTab === 'popular') params.set('featured', 'true');
    else if (activeTab === 'bestsellers') params.set('bestseller', 'true');
    else if (activeTab === 'newest') params.set('isNew', 'true');
    else if (activeTab === 'promos') params.set('promo', 'true');
    else if (activeTab === 'recommended') params.set('sort', 'rating');
    else if (activeTab === 'recent') params.set('limit', '40');

    apiFetch<{ products: Product[] }>(`/api/products?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        if (activeTab === 'recent') {
          const map = new Map(res.products.map((p) => [p.id, p]));
          const ordered = recentlyViewedIds.map((id) => map.get(id)).filter(Boolean) as Product[];
          setProducts(ordered.length > 0 ? ordered : res.products.slice(0, 4));
        } else {
          setProducts(res.products);
        }
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
  }, [activeTab, recentlyViewedIds]);

  const tabItems: { key: CollectionTab; label: string }[] = [
    { key: 'popular', label: t.home.tabs.popular },
    { key: 'bestsellers', label: t.home.tabs.bestsellers },
    { key: 'newest', label: t.home.tabs.newest },
    { key: 'promos', label: t.home.tabs.promos },
    { key: 'recommended', label: t.home.tabs.recommended },
    ...(recentlyViewedIds.length > 0 ? [{ key: 'recent' as const, label: t.home.tabs.recent }] : []),
  ];

  const reassuranceIcons = [Truck, Banknote, ShieldCheck, Headphones];

  const scrollCollectionCarousel = (dir: 'prev' | 'next') => {
    const el = carouselTrackRef.current;
    if (!el) return;
    const step = Math.max(300, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 lg:space-y-20">
      {/* Hero Banner with 5-Image Product Carousel */}
      <section className="bg-[#142B4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F28C28]">
              {t.hero.eyebrow}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-[1.12] text-balance">
              {heroBanner
                ? lang === 'ar'
                  ? heroBanner.title_ar
                  : heroBanner.title_fr
                : t.hero.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
              {heroBanner
                ? lang === 'ar'
                  ? heroBanner.subtitle_ar
                  : heroBanner.subtitle_fr
                : t.hero.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(heroBanner?.cta_link || '/catalogue')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#F28C28] text-white text-sm font-bold hover:bg-[#DF7B17] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  {heroBanner
                    ? lang === 'ar'
                      ? heroBanner.cta_label_ar
                      : heroBanner.cta_label_fr
                    : t.hero.cta}
                </span>
                <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/suivi')}
                className="inline-flex items-center px-5 py-3.5 rounded-lg border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.hero.secondaryCta}
              </button>
            </div>
          </div>

          <div
            className="lg:col-span-6 space-y-3"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
          >
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-[#0F213A] group">
              <button
                type="button"
                onClick={() => activeSlide.slug && navigate(`/produit/${activeSlide.slug}`)}
                className="w-full h-full block text-start cursor-pointer"
              >
                <SmartImage
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  eager
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#F28C28]">
                      {activeSlide.brand}
                    </p>
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {activeSlide.title}
                    </h2>
                  </div>
                  {activeSlide.price_mad > 0 && (
                    <div className="text-end shrink-0">
                      <span className="text-lg sm:text-xl font-extrabold font-mono-num text-white block">
                        {formatMad(activeSlide.price_mad, lang)}
                      </span>
                      {activeSlide.old_price_mad && activeSlide.old_price_mad > activeSlide.price_mad && (
                        <span className="text-xs font-mono-num text-slate-300 line-through">
                          {formatMad(activeSlide.old_price_mad, lang)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {heroSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={lang === 'ar' ? 'المنتج السابق' : 'Produit précédent'}
                    onClick={() =>
                      setHeroSlideIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                    }
                    className="absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#142B4A] flex items-center justify-center shadow-md hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={lang === 'ar' ? 'المنتج التالي' : 'Produit suivant'}
                    onClick={() => setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#142B4A] flex items-center justify-center shadow-md hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {heroSlides.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5">
                {heroSlides.map((slide, idx) => {
                  const isActive = idx === heroSlideIdx % heroSlides.length;
                  return (
                    <button
                      key={slide.id || idx}
                      type="button"
                      onClick={() => setHeroSlideIdx(idx)}
                      aria-label={slide.title}
                      className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#F28C28] opacity-100 scale-[1.02]'
                          : 'border-white/15 opacity-60 hover:opacity-95'
                      }`}
                    >
                      <SmartImage src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#142B4A]">{t.home.popularCategories}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.home.categoriesSub}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="text-sm font-semibold text-[#142B4A] hover:text-[#F28C28] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{t.home.viewAll}</span>
            <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
          {rootCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/catalogue?category=${encodeURIComponent(cat.slug)}`)}
              className="group text-start bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[#142B4A]/40 hover:shadow-md cursor-pointer"
            >
              <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                <SmartImage
                  src={cat.image_url}
                  alt={lang === 'ar' ? cat.name_ar : cat.name_fr}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-3.5">
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#142B4A] line-clamp-1">
                  {lang === 'ar' ? cat.name_ar : cat.name_fr}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 font-mono-num">
                  {cat.product_count ?? 0} {lang === 'ar' ? 'منتجات' : 'articles'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Commercial Sections with Tabbed Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#142B4A]">{t.home.collectionsTitle}</h2>
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                aria-label={lang === 'ar' ? 'السابق' : 'Précédent'}
                onClick={() => scrollCollectionCarousel('prev')}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#142B4A] hover:text-[#142B4A] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label={lang === 'ar' ? 'التالي' : 'Suivant'}
                onClick={() => scrollCollectionCarousel('next')}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#142B4A] hover:text-[#142B4A] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white text-[#142B4A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div
            ref={carouselTrackRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-3 scroll-smooth"
          >
            {products.map((product) => (
              <div key={product.id} className="snap-start shrink-0 w-[270px] sm:w-[290px] lg:w-[calc(25%-18px)]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4 Moroccan Reassurance Pillars */}
      <section className="bg-slate-50 border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {t.home.reassurance.map((item, idx) => {
            const Icon = reassuranceIcons[idx];
            return (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#142B4A] text-white flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#142B4A]">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

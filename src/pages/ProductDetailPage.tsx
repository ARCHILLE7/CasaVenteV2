import { Check, ChevronRight, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatMad } from '../lib/i18n';
import type { Product, Review } from '../types';

export function ProductDetailPage({ slug }: { slug: string }) {
  const {
    lang,
    t,
    navigate,
    addToCart,
    wishlistIds,
    toggleWishlist,
    recordViewed,
    user,
    notify,
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user && !reviewAuthor) setReviewAuthor(user.full_name);
  }, [user, reviewAuthor]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveImageIdx(0);
    setQuantity(1);

    apiFetch<{ product: Product; reviews: Review[]; related: Product[] }>(`/api/products/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.product);
        setReviews(res.reviews);
        setRelated(res.related);
        recordViewed(res.product.id);

        const initialVariants: Record<string, string> = {};
        res.product.variants?.forEach((v) => {
          if (v.options.length > 0) initialVariants[v.name_fr] = v.options[0];
        });
        setSelectedVariants(initialVariants);

        // Update SEO title & Schema.org Product JSON-LD
        const title = lang === 'ar' ? res.product.name_ar : res.product.name_fr;
        document.title = `${title} | CasaVente Maroc`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', res.product.short_desc_fr);
        }

        const existingLd = document.getElementById('product-jsonld');
        if (existingLd) existingLd.remove();
        const ldScript = document.createElement('script');
        ldScript.id = 'product-jsonld';
        ldScript.type = 'application/ld+json';
        ldScript.text = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: res.product.name_fr,
          sku: res.product.sku,
          brand: { '@type': 'Brand', name: res.product.brand },
          description: res.product.short_desc_fr,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'MAD',
            price: res.product.price_mad,
            availability: res.product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: res.product.rating_avg,
            reviewCount: Math.max(1, res.product.review_count),
          },
        });
        document.head.appendChild(ldScript);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, lang, recordViewed]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-[4/3] bg-slate-100 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-slate-100 rounded w-3/4 animate-pulse" />
          <div className="h-24 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#142B4A]">
          {lang === 'ar' ? 'المنتج غير موجود' : 'Produit introuvable'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/catalogue')}
          className="mt-6 px-5 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
        >
          {lang === 'ar' ? 'العودة إلى الكتالوج' : 'Retour au catalogue'}
        </button>
      </div>
    );
  }

  const title = lang === 'ar' ? product.name_ar : product.name_fr;
  const desc = lang === 'ar' ? product.description_ar : product.description_fr;
  const catName = lang === 'ar' ? product.category_name_ar : product.category_name_fr;
  const isWishlisted = wishlistIds.includes(product.id);
  const variantLabel = Object.values(selectedVariants).filter(Boolean).join(' · ');
  const discountPct =
    product.old_price_mad && product.old_price_mad > product.price_mad
      ? Math.round(((product.old_price_mad - product.price_mad) / product.old_price_mad) * 100)
      : null;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await apiFetch<{ review: Review; rating_avg: number; review_count: number }>(
        `/api/products/${product.id}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({
            author_name: reviewAuthor,
            rating: reviewRating,
            comment: reviewComment,
          }),
        }
      );
      setReviews((prev) => [res.review, ...prev]);
      setProduct((prev) =>
        prev ? { ...prev, rating_avg: res.rating_avg, review_count: res.review_count } : prev
      );
      setReviewComment('');
      notify(lang === 'ar' ? 'شكراً لتقييمك!' : 'Merci pour votre avis !');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-16">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        <button type="button" onClick={() => navigate('/')} className="hover:text-[#142B4A] cursor-pointer">
          CasaVente
        </button>
        <ChevronRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        <button
          type="button"
          onClick={() => navigate(`/catalogue?category=${encodeURIComponent(product.category_slug || '')}`)}
          className="hover:text-[#142B4A] cursor-pointer"
        >
          {catName}
        </button>
        <ChevronRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        <span className="text-slate-900 font-medium truncate max-w-xs">{title}</span>
      </nav>

      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Image Gallery with Zoom */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 border border-slate-200 cursor-zoom-in"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoomOrigin({ x, y });
            }}
            onClick={() => setZoomed((z) => !z)}
          >
            <SmartImage
              src={product.images[activeImageIdx] || product.images[0]}
              alt={title}
              eager
              className={`w-full h-full object-cover transition-transform duration-200 ${
                zoomed ? 'scale-150' : 'scale-100'
              }`}
            />
            {zoomed && (
              <style>{`img[alt="${title.replace(/"/g, '\\"')}"] { transform-origin: ${zoomOrigin.x}% ${zoomOrigin.y}%; }`}</style>
            )}
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/90 text-xs font-medium text-slate-700 border border-slate-200 pointer-events-none">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تكبير' : 'Zoom'}</span>
            </span>
          </div>

          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                    activeImageIdx === idx ? 'border-[#142B4A]' : 'border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <SmartImage src={img} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Sticky Purchase Details */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6 bg-white border border-slate-200 rounded-xl p-6">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
              <span>
                {product.brand} · SKU {product.sku}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-800 font-mono-num">
                <Star className="w-3.5 h-3.5 fill-[#F28C28] text-[#F28C28]" />
                <strong>{product.rating_avg.toFixed(1)}</strong>
                <span className="text-slate-400">({product.review_count})</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#142B4A] leading-tight">{title}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#142B4A] font-mono-num">
                {formatMad(product.price_mad, lang)}
              </span>
              {product.old_price_mad && product.old_price_mad > product.price_mad && (
                <>
                  <span className="text-lg text-slate-400 line-through font-mono-num">
                    {formatMad(product.old_price_mad, lang)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F28C28] text-white text-xs font-mono-num font-bold">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-xs font-semibold flex items-center gap-1.5">
              {product.stock > 0 ? (
                <span className="text-emerald-700 inline-flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {t.product.inStock} ({product.stock} {lang === 'ar' ? 'قطعة' : 'unités'})
                </span>
              ) : (
                <span className="text-rose-600">{t.product.outOfStock}</span>
              )}
            </p>
          </div>

          {/* Variants */}
          {product.variants?.map((group) => (
            <div key={group.name_fr} className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                {lang === 'ar' ? group.name_ar : group.name_fr}
              </label>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const selected = selectedVariants[group.name_fr] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setSelectedVariants((prev) => ({ ...prev, [group.name_fr]: opt }))
                      }
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#142B4A] bg-[#142B4A] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity & CTAs */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-slate-200 rounded-lg h-11">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 text-slate-600 hover:text-[#142B4A] cursor-pointer"
                  aria-label="Diminuer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-mono-num font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  className="px-3 text-slate-600 hover:text-[#142B4A] cursor-pointer"
                  aria-label="Augmenter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`h-11 px-4 rounded-lg border inline-flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'border-[#F28C28] bg-[#F28C28]/10 text-[#F28C28]'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                <span>{t.nav.wishlist}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product, quantity, variantLabel, true)}
                className="h-12 px-5 rounded-lg bg-[#142B4A] text-white text-sm font-bold hover:bg-[#0F213A] disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.product.addToCart}</span>
              </button>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart(product, quantity, variantLabel, false);
                  navigate('/commande');
                }}
                className="h-12 px-5 rounded-lg bg-[#F28C28] text-white text-sm font-bold hover:bg-[#DF7B17] disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                {t.product.buyNow}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <p className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#142B4A] shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'التوصيل خلال 24 ساعة بالدار البيضاء و48 ساعة لباقي المدن'
                  : 'Livraison 24h Casablanca · 48h Rabat, Marrakech, Tanger, Fès'}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#142B4A] shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'ضمان 24 شهراً مع إمكانية الدفع عند الاستلام'
                  : 'Paiement à la livraison (COD) · Retour possible sous 14 jours'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Description & Technical Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-8 border-t border-slate-200">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-bold text-[#142B4A]">{t.product.description}</h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{desc}</p>
        </div>

        <div className="lg:col-span-5">
          <h2 className="text-xl font-bold text-[#142B4A] mb-4">{t.product.specs}</h2>
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
            {product.specs?.map((spec, idx) => (
              <div key={idx} className="grid grid-cols-2 px-4 py-3 text-sm bg-white">
                <span className="font-medium text-slate-500">
                  {lang === 'ar' ? spec.label_ar : spec.label_fr}
                </span>
                <span className="font-semibold text-slate-900">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <section className="pt-8 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="text-xl font-bold text-[#142B4A]">
            {t.product.reviews} ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">
              {lang === 'ar' ? 'لا توجد تقييمات بعد لهذا المنتج.' : 'Aucun avis client pour le moment.'}
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-sm text-slate-900">{rev.author_name}</span>
                    <div className="flex items-center gap-0.5 text-[#F28C28]">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleReviewSubmit} className="lg:col-span-5 border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4 h-fit">
          <h3 className="text-base font-bold text-[#142B4A]">{t.product.writeReview}</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {lang === 'ar' ? 'الاسم الكامل' : 'Votre nom'}
            </label>
            <input
              type="text"
              required
              value={reviewAuthor}
              onChange={(e) => setReviewAuthor(e.target.value)}
              placeholder="Ex: Yassine B. · Rabat"
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {lang === 'ar' ? 'التقييم' : 'Note'}
            </label>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
            >
              <option value={5}>5 ★ — Excellent</option>
              <option value={4}>4 ★ — Très bien</option>
              <option value={3}>3 ★ — Correct</option>
              <option value={2}>2 ★ — Moyen</option>
              <option value={1}>1 ★ — Décevant</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {lang === 'ar' ? 'التعليق' : 'Commentaire'}
            </label>
            <textarea
              required
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={lang === 'ar' ? 'شارك تجربتك مع المنتج...' : 'Partagez votre retour d’expérience...'}
              className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={submittingReview}
            className="w-full py-2.5 px-4 rounded-lg bg-[#142B4A] text-white text-sm font-semibold hover:bg-[#0F213A] disabled:opacity-50 cursor-pointer"
          >
            {submittingReview
              ? lang === 'ar'
                ? 'جاري النشر...'
                : 'Publication...'
              : lang === 'ar'
                ? 'نشر التقييم'
                : 'Publier mon avis'}
          </button>
        </form>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-[#142B4A] mb-6">{t.product.similar}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad } from '../lib/i18n';
import type { Product } from '../types';
import { SmartImage } from './SmartImage';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { lang, navigate, addToCart, wishlistIds, toggleWishlist, t } = useStore();
  const isWishlisted = wishlistIds.includes(product.id);
  const title = lang === 'ar' ? product.name_ar : product.name_fr;
  const catName = lang === 'ar' ? product.category_name_ar : product.category_name_fr;
  const shortDesc = lang === 'ar' ? product.short_desc_ar : product.short_desc_fr;
  const discountPct =
    product.old_price_mad && product.old_price_mad > product.price_mad
      ? Math.round(((product.old_price_mad - product.price_mad) / product.old_price_mad) * 100)
      : null;

  if (layout === 'list') {
    return (
      <article className="group flex flex-col sm:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md">
        <button
          type="button"
          onClick={() => navigate(`/produit/${product.slug}`)}
          className="sm:w-64 shrink-0 aspect-[4/3] bg-slate-50 overflow-hidden relative cursor-pointer"
        >
          <SmartImage
            src={product.images[0]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {discountPct && (
            <span className="absolute top-3 left-3 bg-[#142B4A] text-white text-xs font-mono-num font-semibold px-2 py-1 rounded">
              -{discountPct}%
            </span>
          )}
        </button>

        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <p className="text-xs font-medium tracking-wide uppercase text-slate-500 truncate">
                {catName} <span aria-hidden="true">·</span> {product.brand}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-700 font-mono-num shrink-0">
                <Star className="w-3.5 h-3.5 fill-[#F28C28] text-[#F28C28]" />
                <span className="font-semibold">{product.rating_avg.toFixed(1)}</span>
                <span className="text-slate-400">({product.review_count})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/produit/${product.slug}`)}
              className="text-start text-lg font-semibold text-slate-900 hover:text-[#142B4A] transition-colors cursor-pointer"
            >
              {title}
            </button>
            <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{shortDesc}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-bold text-[#142B4A] font-mono-num">
                {formatMad(product.price_mad, lang)}
              </span>
              {product.old_price_mad && product.old_price_mad > product.price_mad && (
                <span className="text-sm text-slate-400 line-through font-mono-num">
                  {formatMad(product.old_price_mad, lang)}
                </span>
              )}
              <span className={`text-xs font-medium ${product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {product.stock > 0 ? t.product.inStock : t.product.outOfStock}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={t.nav.wishlist}
                className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'border-[#F28C28] bg-[#F28C28]/10 text-[#F28C28]'
                    : 'border-slate-200 text-slate-500 hover:text-[#142B4A] hover:border-slate-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product, 1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold hover:bg-[#0F213A] disabled:bg-slate-200 disabled:text-slate-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{product.stock > 0 ? t.product.addToCart : t.product.outOfStock}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        <button
          type="button"
          onClick={() => navigate(`/produit/${product.slug}`)}
          className="w-full h-full block cursor-pointer"
        >
          <SmartImage
            src={product.images[0]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        {discountPct && (
          <span className="absolute top-3 left-3 bg-[#F28C28] text-white text-xs font-mono-num font-semibold px-2 py-0.5 rounded">
            -{discountPct}%
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={t.nav.wishlist}
          className={`absolute top-3 right-3 p-2 rounded-lg bg-white/90 backdrop-blur-sm border transition-colors cursor-pointer ${
            isWishlisted
              ? 'border-[#F28C28] text-[#F28C28]'
              : 'border-slate-200 text-slate-600 hover:text-[#142B4A]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-medium tracking-wider uppercase text-slate-500 truncate">
              {catName} · {product.brand}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-mono-num shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#F28C28] text-[#F28C28]" />
              {product.rating_avg.toFixed(1)}
              <span className="text-slate-400">({product.review_count})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/produit/${product.slug}`)}
            className="text-start font-semibold text-slate-900 hover:text-[#142B4A] transition-colors line-clamp-2 text-[15px] leading-snug cursor-pointer"
          >
            {title}
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-bold text-[#142B4A] font-mono-num">
              {formatMad(product.price_mad, lang)}
            </span>
            {product.old_price_mad && product.old_price_mad > product.price_mad ? (
              <span className="text-xs text-slate-400 line-through font-mono-num">
                {formatMad(product.old_price_mad, lang)}
              </span>
            ) : (
              <span className={`text-[11px] ${product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {product.stock > 0 ? t.product.inStock : t.product.outOfStock}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => addToCart(product, 1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#142B4A] text-white text-xs font-semibold hover:bg-[#0F213A] disabled:bg-slate-200 disabled:text-slate-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{product.stock > 0 ? t.product.addToCart : t.product.outOfStock}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

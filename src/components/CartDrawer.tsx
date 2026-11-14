import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad } from '../lib/i18n';
import { SmartImage } from './SmartImage';

export function CartDrawer() {
  const {
    lang,
    t,
    cart,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    updateCartQty,
    removeFromCart,
    navigate,
  } = useStore();

  if (!isCartOpen) return null;

  const freeThreshold = 500;
  const remaining = Math.max(0, freeThreshold - cartSubtotal);
  const progress = Math.min(100, Math.round((cartSubtotal / freeThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => setIsCartOpen(false)}
      />

      <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#142B4A]" />
            <h2 className="text-lg font-bold text-[#142B4A]">{t.cart.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Fermer le panier"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-xs text-slate-700 mb-1.5">
              {remaining === 0
                ? lang === 'ar'
                  ? 'تهانينا! توصيل مجاني في الدار البيضاء.'
                  : 'Livraison gratuite débloquée à Casablanca !'
                : lang === 'ar'
                  ? `أضف ${formatMad(remaining, lang)} للحصول على التوصيل المجاني بالدار البيضاء`
                  : `Plus que ${formatMad(remaining, lang)} pour la livraison gratuite à Casablanca`}
            </p>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F28C28] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <p className="text-sm text-slate-600 mb-5">{t.cart.empty}</p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/catalogue');
                }}
                className="px-5 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold hover:bg-[#0F213A] cursor-pointer"
              >
                {t.cart.browse}
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.variantLabel}`}
                className="flex gap-4 pb-4 border-b border-slate-100 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate(`/produit/${item.slug}`);
                  }}
                  className="w-20 h-16 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0 cursor-pointer"
                >
                  <SmartImage src={item.image} alt={item.name_fr} className="w-full h-full object-cover" />
                </button>

                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate(`/produit/${item.slug}`);
                    }}
                    className="text-start text-sm font-semibold text-slate-900 hover:text-[#142B4A] line-clamp-1 cursor-pointer"
                  >
                    {lang === 'ar' ? item.name_ar : item.name_fr}
                  </button>
                  {item.variantLabel && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.variantLabel}</p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center border border-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity - 1)}
                        className="p-1.5 text-slate-600 hover:text-[#142B4A] cursor-pointer"
                        aria-label="Diminuer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-mono-num font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity + 1)}
                        className="p-1.5 text-slate-600 hover:text-[#142B4A] cursor-pointer"
                        aria-label="Augmenter"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#142B4A] font-mono-num">
                        {formatMad(item.price_mad * item.quantity, lang)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.variantLabel)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{t.cart.subtotal}</span>
              <span className="text-lg font-bold text-[#142B4A] font-mono-num">
                {formatMad(cartSubtotal, lang)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/panier');
                }}
                className="py-2.5 px-4 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.cart.viewCart}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/commande');
                }}
                className="py-2.5 px-4 rounded-lg bg-[#F28C28] text-white text-sm font-semibold hover:bg-[#DF7B17] transition-colors cursor-pointer"
              >
                {t.cart.checkout}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

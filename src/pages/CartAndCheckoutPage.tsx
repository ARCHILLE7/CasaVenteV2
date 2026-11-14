import { CheckCircle2, CreditCard, Lock, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatMad, MOROCCAN_CITIES } from '../lib/i18n';
import type { Address, DeliveryMode, Order, PaymentMethod } from '../types';

export function CartPage() {
  const { lang, t, cart, cartSubtotal, updateCartQty, removeFromCart, shippingZones, navigate, notify } =
    useStore();
  const [selectedCity, setSelectedCity] = useState('Casablanca');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_mad: number } | null>(null);

  useEffect(() => {
    document.title = 'Mon Panier | CasaVente Maroc';
  }, []);

  const zone = shippingZones.find((z) => z.city === selectedCity);
  const shippingFee = zone ? (cartSubtotal >= zone.free_threshold_mad ? 0 : zone.fee_mad) : 35;
  const discount = appliedPromo?.discount_mad || 0;
  const total = Math.max(0, cartSubtotal - discount + (cart.length > 0 ? shippingFee : 0));

  const applyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ code: string; discount_mad: number }>('/api/promo/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoInput, subtotal: cartSubtotal }),
      });
      setAppliedPromo(res);
      notify(`Code ${res.code} appliqué (-${formatMad(res.discount_mad, lang)})`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Code invalide', 'error');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#142B4A]">{t.cart.title}</h1>
        <p className="text-slate-600">{t.cart.empty}</p>
        <button
          type="button"
          onClick={() => navigate('/catalogue')}
          className="px-6 py-3 rounded-lg bg-[#142B4A] text-white text-sm font-semibold hover:bg-[#0F213A] cursor-pointer"
        >
          {t.cart.browse}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#142B4A] mb-8">{t.cart.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={`${item.productId}-${item.variantLabel}`}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl"
            >
              <button
                type="button"
                onClick={() => navigate(`/produit/${item.slug}`)}
                className="w-24 aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 shrink-0 cursor-pointer"
              >
                <SmartImage src={item.image} alt={item.name_fr} className="w-full h-full object-cover" />
              </button>

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(`/produit/${item.slug}`)}
                  className="text-start font-semibold text-slate-900 hover:text-[#142B4A] cursor-pointer"
                >
                  {lang === 'ar' ? item.name_ar : item.name_fr}
                </button>
                {item.variantLabel && <p className="text-xs text-slate-500 mt-0.5">{item.variantLabel}</p>}
                <p className="text-sm font-mono-num text-[#142B4A] font-semibold mt-1">
                  {formatMad(item.price_mad, lang)}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="inline-flex items-center border border-slate-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity - 1)}
                    className="p-2 text-slate-600 hover:text-[#142B4A] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-mono-num font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, item.variantLabel, item.quantity + 1)}
                    className="p-2 text-slate-600 hover:text-[#142B4A] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-base font-bold text-[#142B4A] font-mono-num min-w-[90px] text-end">
                  {formatMad(item.price_mad * item.quantity, lang)}
                </span>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.productId, item.variantLabel)}
                  className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#142B4A]">
            {lang === 'ar' ? 'ملخص الطلب' : 'Récapitulatif'}
          </h2>

          <form onSubmit={applyPromo} className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder={t.cart.promoPlaceholder}
              className="flex-1 h-10 px-3 text-sm border border-slate-200 rounded-lg uppercase"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-[#142B4A] text-white text-xs font-semibold hover:bg-[#0F213A] cursor-pointer"
            >
              {t.cart.apply}
            </button>
          </form>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {lang === 'ar' ? 'مدينة التوصيل' : 'Estimer la livraison par ville'}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
            >
              {MOROCCAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-100 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">{t.cart.subtotal}</span>
              <span className="font-mono-num font-semibold">{formatMad(cartSubtotal, lang)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Remise ({appliedPromo?.code})</span>
                <span className="font-mono-num font-semibold">-{formatMad(discount, lang)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">{t.cart.shipping}</span>
              <span className="font-mono-num font-semibold">
                {shippingFee === 0 ? t.cart.free : formatMad(shippingFee, lang)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-bold text-[#142B4A]">
              <span>{t.cart.total}</span>
              <span className="font-mono-num">{formatMad(total, lang)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/commande')}
            className="w-full h-12 rounded-lg bg-[#F28C28] text-white font-bold text-sm hover:bg-[#DF7B17] transition-colors cursor-pointer"
          >
            {t.cart.checkout}
          </button>
        </aside>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const {
    lang,
    cart,
    cartSubtotal,
    clearCart,
    user,
    shippingZones,
    onlineGatewayConfigured,
    navigate,
    notify,
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  const [city, setCity] = useState('Casablanca');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    document.title = 'Finaliser ma commande | CasaVente Maroc';
  }, []);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.full_name);
      if (!customerPhone) setCustomerPhone(user.phone);
      if (!customerEmail) setCustomerEmail(user.email);
      apiFetch<{ addresses: Address[] }>('/api/account/addresses')
        .then((res) => {
          const def = res.addresses.find((a) => a.is_default === 1) || res.addresses[0];
          if (def && !streetAddress) {
            setCity(def.city);
            setNeighborhood(def.neighborhood);
            setStreetAddress(def.street_address);
            setNotes(def.notes || '');
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const zone = shippingZones.find((z) => z.city === city);
  const baseFee = zone ? zone.fee_mad : 40;
  const freeThreshold = zone ? zone.free_threshold_mad : 650;
  const shippingFee =
    deliveryMode === 'PICKUP_CASA'
      ? 0
      : deliveryMode === 'EXPRESS'
        ? baseFee + 25
        : cartSubtotal >= freeThreshold
          ? 0
          : baseFee;

  const totalMad = Math.max(0, cartSubtotal - promoDiscount + shippingFee);

  const validateStep1 = () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      notify('Veuillez remplir vos nom, téléphone marocain et e-mail.', 'error');
      return;
    }
    setStep(2);
  };

  const validateStep2 = () => {
    if (!city || !neighborhood.trim() || !streetAddress.trim()) {
      notify('Veuillez renseigner votre ville, quartier et adresse complète.', 'error');
      return;
    }
    setStep(3);
  };

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await apiFetch<{ code: string; discount_mad: number }>('/api/promo/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode, subtotal: cartSubtotal }),
      });
      setPromoCode(res.code);
      setPromoDiscount(res.discount_mad);
      notify(`Code ${res.code} appliqué`);
    } catch (err) {
      setPromoDiscount(0);
      notify(err instanceof Error ? err.message : 'Code invalide', 'error');
    }
  };

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          city,
          neighborhood,
          street_address: streetAddress,
          notes,
          delivery_mode: deliveryMode,
          payment_method: paymentMethod,
          promo_code: promoDiscount > 0 ? promoCode : null,
          items: cart.map((i) => ({
            productId: i.productId,
            variantLabel: i.variantLabel,
            quantity: i.quantity,
          })),
        }),
      });
      setConfirmedOrder(res.order);
      clearCart();
      setStep(6);
      notify(`Commande ${res.order.order_number} confirmée !`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur lors de la commande', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && step !== 6) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#142B4A]">Votre panier est vide</h1>
        <button
          type="button"
          onClick={() => navigate('/catalogue')}
          className="px-6 py-3 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
        >
          Découvrir le catalogue
        </button>
      </div>
    );
  }

  const stepLabels = [
    '1. Coordonnées',
    '2. Adresse',
    '3. Livraison',
    '4. Paiement',
    '5. Récapitulatif',
    '6. Confirmation',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#142B4A] mb-6">
        {lang === 'ar' ? 'إتمام الطلب' : 'Finalisation de votre commande'}
      </h1>

      {/* 6-Step Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-8">
        {stepLabels.map((label, idx) => {
          const s = idx + 1;
          const active = step === s;
          const done = step > s;
          return (
            <div
              key={label}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border text-center ${
                active
                  ? 'border-[#142B4A] bg-[#142B4A] text-white'
                  : done
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>

      {step === 6 && confirmedOrder ? (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#142B4A]">
            {lang === 'ar' ? 'شكراً لطلبك من كازافانت!' : 'Merci pour votre commande chez CasaVente !'}
          </h2>
          <p className="text-sm text-slate-600">
            Votre commande <strong className="font-mono-num text-[#142B4A]">{confirmedOrder.order_number}</strong> a bien
            été enregistrée. Notre équipe basée à Casablanca vous contactera par téléphone pour confirmer le créneau de
            livraison à {confirmedOrder.city}.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-start text-sm space-y-1.5">
            <p>
              <strong>Client :</strong> {confirmedOrder.customer_name} ({confirmedOrder.customer_phone})
            </p>
            <p>
              <strong>Adresse :</strong> {confirmedOrder.street_address}, {confirmedOrder.neighborhood},{' '}
              {confirmedOrder.city}
            </p>
            <p>
              <strong>Mode de paiement :</strong>{' '}
              {confirmedOrder.payment_method === 'COD' ? 'Paiement à la livraison (Cash on Delivery)' : 'CMI'}
            </p>
            <p>
              <strong>Total à régler :</strong>{' '}
              <span className="font-mono-num font-bold text-[#142B4A]">
                {formatMad(confirmedOrder.total_mad, lang)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/suivi')}
              className="px-5 py-2.5 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
            >
              Suivre ma commande
            </button>
            <button
              type="button"
              onClick={() => navigate('/catalogue')}
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold cursor-pointer"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#142B4A]">1. Informations personnelles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nom et prénom *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Salma Bennani"
                      className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Téléphone marocain *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+212 6 12 34 56 78"
                      className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm font-mono-num"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse e-mail *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="exemple@domaine.ma"
                    className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={validateStep1}
                    className="px-6 py-3 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
                  >
                    Continuer vers l’adresse
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#142B4A]">2. Adresse de livraison au Maroc</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ville *</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      {MOROCCAN_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quartier *</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ex: Maarif, Agdal, Guéliz..."
                      className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse complète *</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Rue, Boulevard, Immeuble, Appartement"
                    className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Informations complémentaires
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Digicode, horaires souhaités..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={validateStep2}
                    className="px-6 py-3 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
                  >
                    Choisir la livraison
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#142B4A]">3. Mode de livraison</h2>
                <div className="space-y-3">
                  {[
                    {
                      id: 'STANDARD' as const,
                      title: `Livraison Standard (${city})`,
                      desc: `Délai estimé : ${zone?.estimated_days || '24h - 48h'} · Gratuit dès ${formatMad(freeThreshold)}`,
                      fee: cartSubtotal >= freeThreshold ? 0 : baseFee,
                    },
                    {
                      id: 'EXPRESS' as const,
                      title: 'Livraison Express Prioritaire',
                      desc: 'Expédition prioritaire le jour même à Casablanca ou J+1 grandes villes',
                      fee: baseFee + 25,
                    },
                    {
                      id: 'PICKUP_CASA' as const,
                      title: 'Retrait Showroom Casablanca (Maarif)',
                      desc: '148 Bd d’Anfa, Casablanca · Prêt sous 2 heures',
                      fee: 0,
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                        deliveryMode === opt.id
                          ? 'border-[#142B4A] bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="deliveryMode"
                          checked={deliveryMode === opt.id}
                          onChange={() => setDeliveryMode(opt.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{opt.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold font-mono-num text-[#142B4A]">
                        {opt.fee === 0 ? 'Gratuit' : formatMad(opt.fee, lang)}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 rounded-lg bg-[#142B4A] text-white text-sm font-semibold cursor-pointer"
                  >
                    Choisir le paiement
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#142B4A]">4. Mode de paiement</h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${
                      paymentMethod === 'COD' ? 'border-[#142B4A] bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#F28C28]" />
                        <span className="text-sm font-bold text-slate-900">
                          Paiement à la livraison (Cash on Delivery)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Réglez en espèces en Dirhams marocains directement au livreur après vérification de votre colis.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${
                      paymentMethod === 'ONLINE_GATEWAY' ? 'border-[#142B4A] bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'ONLINE_GATEWAY'}
                      onChange={() => setPaymentMethod('ONLINE_GATEWAY')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#142B4A]" />
                        <span className="text-sm font-bold text-slate-900">
                          Paiement par carte bancaire marocaine / internationale (CMI / Payzone)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {onlineGatewayConfigured
                          ? 'Redirection sécurisée vers la passerelle CMI Maroc.'
                          : 'Intégration serveur prête pour CMI / Payzone. En attente des clés marchands de production (CMI_MERCHANT_ID) — veuillez sélectionner le Paiement à la livraison pour valider votre commande dès maintenant.'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    disabled={paymentMethod === 'ONLINE_GATEWAY' && !onlineGatewayConfigured}
                    onClick={() => setStep(5)}
                    className="px-6 py-3 rounded-lg bg-[#142B4A] text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Voir le récapitulatif
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-[#142B4A]">5. Récapitulatif avant confirmation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Client & Livraison</p>
                    <p className="font-semibold text-slate-900">{customerName}</p>
                    <p className="font-mono-num text-slate-700">{customerPhone}</p>
                    <p className="text-slate-600">{customerEmail}</p>
                    <p className="text-slate-700 mt-2">
                      {streetAddress}, {neighborhood}, {city}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 mb-1">Expédition & Paiement</p>
                    <p className="text-slate-800">Mode : {deliveryMode}</p>
                    <p className="text-slate-800">
                      Paiement : {paymentMethod === 'COD' ? 'À la livraison (COD)' : 'Carte CMI'}
                    </p>
                    {notes && <p className="text-xs text-slate-500 mt-2">Note : {notes}</p>}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={placeOrder}
                    className="px-7 py-3 rounded-lg bg-[#F28C28] text-white text-sm font-bold hover:bg-[#DF7B17] disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{submitting ? 'Confirmation...' : `Confirmer la commande (${formatMad(totalMad, lang)})`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Order Summary Sidebar */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#142B4A]">Articles ({cart.length})</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.variantLabel}`} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {item.quantity}x {item.name_fr}
                    </p>
                    <p className="text-xs text-slate-500">{item.variantLabel}</p>
                  </div>
                  <span className="font-mono-num font-semibold text-slate-900 shrink-0">
                    {formatMad(item.price_mad * item.quantity, lang)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Code promo (CASA10)"
                className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg uppercase"
              />
              <button
                type="button"
                onClick={applyPromo}
                className="h-9 px-3 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Appliquer
              </button>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <span className="font-mono-num">{formatMad(cartSubtotal, lang)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Remise</span>
                  <span className="font-mono-num">-{formatMad(promoDiscount, lang)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Livraison ({city})</span>
                <span className="font-mono-num">{shippingFee === 0 ? 'Gratuite' : formatMad(shippingFee, lang)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold text-[#142B4A]">
                <span>Total TTC</span>
                <span className="font-mono-num">{formatMad(totalMad, lang)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

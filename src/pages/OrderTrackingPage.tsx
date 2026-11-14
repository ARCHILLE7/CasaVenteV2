import { CheckCircle2, PackageSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatMad, ORDER_STATUS_LABELS } from '../lib/i18n';
import type { Order, OrderStatus } from '../types';

const STATUS_SEQUENCE: OrderStatus[] = [
  'EN_ATTENTE',
  'CONFIRMEE',
  'EN_PREPARATION',
  'EXPEDIEE',
  'EN_COURS_LIVRAISON',
  'LIVREE',
];

export function OrderTrackingPage() {
  const { lang, notify } = useStore();
  const [orderNumber, setOrderNumber] = useState('CV-2026-1042');
  const [contact, setContact] = useState('+212662445566');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Suivi de commande | CasaVente Maroc';
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch<{ order: Order }>(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&contact=${encodeURIComponent(contact)}`
      );
      setOrder(res.order);
    } catch (err) {
      setOrder(null);
      notify(err instanceof Error ? err.message : 'Commande introuvable', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentIdx = order ? STATUS_SEQUENCE.indexOf(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-[#142B4A] text-white mx-auto flex items-center justify-center">
          <PackageSearch className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#142B4A]">
          {lang === 'ar' ? 'تتبع طلبك في المغرب' : 'Suivre ma commande CasaVente'}
        </h1>
        <p className="text-sm text-slate-600">
          {lang === 'ar'
            ? 'أدخل رقم الطلب ورقم الهاتف المغربي أو البريد الإلكتروني'
            : 'Entrez votre numéro de commande et votre téléphone marocain ou e-mail.'}
        </p>
      </div>

      <form
        onSubmit={handleTrack}
        className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-4"
      >
        <div className="sm:col-span-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">N° de commande</label>
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Ex: CV-2026-1042"
            className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm font-mono-num uppercase"
          />
        </div>
        <div className="sm:col-span-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone (+212) ou E-mail</label>
          <input
            type="text"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="+212662445566"
            className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
          />
        </div>
        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#F28C28] text-white text-sm font-bold hover:bg-[#DF7B17] cursor-pointer"
          >
            {loading ? '...' : 'Suivre'}
          </button>
        </div>
      </form>

      {order && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Commande</p>
              <h2 className="text-xl font-bold font-mono-num text-[#142B4A]">{order.order_number}</h2>
            </div>
            <div className="text-end">
              <span
                className={`inline-block px-3 py-1 rounded text-xs font-semibold border ${ORDER_STATUS_LABELS[order.status].tone}`}
              >
                {lang === 'ar'
                  ? ORDER_STATUS_LABELS[order.status].ar
                  : ORDER_STATUS_LABELS[order.status].fr}
              </span>
              <p className="text-sm font-mono-num font-bold text-[#142B4A] mt-1">
                {formatMad(order.total_mad, lang)}
              </p>
            </div>
          </div>

          {order.status !== 'ANNULEE' && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {STATUS_SEQUENCE.map((st, idx) => {
                const done = idx <= currentIdx;
                return (
                  <div
                    key={st}
                    className={`p-3 rounded-lg border text-center ${
                      done ? 'border-[#142B4A] bg-[#142B4A]/5 text-[#142B4A]' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 mx-auto mb-1 ${done ? 'text-[#F28C28]' : 'text-slate-300'}`} />
                    <p className="text-[11px] font-semibold leading-tight">
                      {lang === 'ar' ? ORDER_STATUS_LABELS[st].ar : ORDER_STATUS_LABELS[st].fr}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-bold text-[#142B4A]">Détails de livraison</h3>
              <p>{order.customer_name}</p>
              <p className="text-slate-600">
                {order.street_address}, {order.neighborhood}, {order.city}
              </p>
              <p className="text-xs text-slate-500">Mode : {order.delivery_mode} · Paiement : {order.payment_method}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-[#142B4A]">Journal de suivi</h3>
              <div className="space-y-2">
                {order.timeline?.map((entry) => (
                  <div key={entry.id} className="text-xs flex justify-between gap-3 border-b border-slate-100 pb-1.5">
                    <span className="text-slate-800">{entry.note}</span>
                    <span className="text-slate-400 font-mono-num shrink-0">
                      {new Date(entry.created_at).toLocaleDateString('fr-MA')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { lang, t, navigate, categories } = useStore();
  const rootCats = categories.filter((c) => !c.parent_id).slice(0, 6);

  return (
    <footer className="bg-[#142B4A] text-slate-200 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xl font-extrabold tracking-tight text-white cursor-pointer"
          >
            Casa<span className="text-[#F28C28]">Vente</span>
          </button>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            {lang === 'ar'
              ? 'منصتكم المغربية للتجارة الإلكترونية انطلاقاً من الدار البيضاء مع توصيل سريع إلى جميع مدن المملكة.'
              : 'Votre boutique e-commerce marocaine basée à Casablanca. Produits sélectionnés, paiement à la livraison et expédition nationale.'}
          </p>
          <div className="mt-4 space-y-2 text-xs text-slate-300">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F28C28] shrink-0" />
              <span>148 Bd d’Anfa, Maarif, Casablanca 20100</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#F28C28] shrink-0" />
              <span className="font-mono-num">+212 522 48 90 12</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#F28C28] shrink-0" />
              <span>support@casavente.ma</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white mb-4">{t.nav.categories}</h3>
          <ul className="space-y-2.5 text-sm text-slate-300">
            {rootCats.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/catalogue?category=${encodeURIComponent(c.slug)}`)}
                  className="hover:text-white transition-colors cursor-pointer text-start"
                >
                  {lang === 'ar' ? c.name_ar : c.name_fr}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white mb-4">
            {lang === 'ar' ? 'خدمة العملاء' : 'Service Client'}
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li>
              <button type="button" onClick={() => navigate('/suivi')} className="hover:text-white cursor-pointer">
                {t.footer.tracking}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/livraison')} className="hover:text-white cursor-pointer">
                {t.footer.shipping}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/retours')} className="hover:text-white cursor-pointer">
                {t.footer.returns}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/faq')} className="hover:text-white cursor-pointer">
                {t.footer.faq}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/contact')} className="hover:text-white cursor-pointer">
                {t.footer.contact}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white mb-4">
            {lang === 'ar' ? 'معلومات قانونية' : 'Entreprise & Légal'}
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li>
              <button type="button" onClick={() => navigate('/a-propos')} className="hover:text-white cursor-pointer">
                {t.footer.about}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/cgv')} className="hover:text-white cursor-pointer">
                {t.footer.cgv}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/confidentialite')}
                className="hover:text-white cursor-pointer"
              >
                {t.footer.privacy}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/compte')} className="hover:text-white cursor-pointer">
                {t.nav.account}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/admin')} className="hover:text-[#F28C28] cursor-pointer">
                {lang === 'ar' ? 'لوحة الإدارة' : 'Espace Administrateur'}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CasaVente SARL — Casablanca, Maroc (casavente.ma)</p>
          <p>
            {lang === 'ar'
              ? 'الأسعار بالدرهم المغربي شاملة للضريبة · الدفع عند الاستلام'
              : 'Prix en Dirhams Marocains (MAD / DH) TTC · Paiement à la livraison'}
          </p>
        </div>
      </div>
    </footer>
  );
}

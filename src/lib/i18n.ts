import type { Language, OrderStatus } from '../types';

export function formatMad(amount: number, lang: Language = 'fr'): string {
  const formatted = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return lang === 'ar' ? `${formatted} د.م` : `${formatted} DH`;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, { fr: string; ar: string; tone: string }> = {
  EN_ATTENTE: { fr: 'En attente', ar: 'قيد الانتظار', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  CONFIRMEE: { fr: 'Confirmée', ar: 'مؤكدة', tone: 'text-sky-700 bg-sky-50 border-sky-200' },
  EN_PREPARATION: { fr: 'En préparation', ar: 'قيد التحضير', tone: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  EXPEDIEE: { fr: 'Expédiée', ar: 'تم الشحن', tone: 'text-violet-700 bg-violet-50 border-violet-200' },
  EN_COURS_LIVRAISON: {
    fr: 'En cours de livraison',
    ar: 'في طريق التوصيل',
    tone: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  LIVREE: { fr: 'Livrée', ar: 'تم التسليم', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ANNULEE: { fr: 'Annulée', ar: 'ملغاة', tone: 'text-rose-700 bg-rose-50 border-rose-200' },
};

export const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kénitra',
  'Tétouan',
  'Mohammedia',
  'El Jadida',
];

export const translations = {
  fr: {
    nav: {
      catalog: 'Catalogue',
      categories: 'Catégories',
      deals: 'Promotions',
      track: 'Suivi commande',
      searchPlaceholder: 'Rechercher un produit, une marque...',
      account: 'Mon compte',
      wishlist: 'Favoris',
      cart: 'Panier',
      admin: 'Admin',
    },
    hero: {
      eyebrow: 'Casablanca · Livraison dans tout le Maroc',
      title: 'Tout ce dont vous avez besoin, au meilleur prix !',
      subtitle: 'Découvrez les meilleures offres et profitez de la livraison partout au Maroc.',
      cta: 'Découvrir nos produits',
      secondaryCta: 'Suivre ma commande',
    },
    home: {
      popularCategories: 'Catégories populaires',
      categoriesSub: 'Parcourez nos univers sélectionnés pour votre quotidien au Maroc',
      collectionsTitle: 'Sélections CasaVente',
      tabs: {
        popular: 'Populaires',
        bestsellers: 'Meilleures ventes',
        newest: 'Nouveautés',
        promos: 'Promotions du moment',
        recommended: 'Recommandés',
        recent: 'Récemment consultés',
      },
      viewAll: 'Voir tout le catalogue',
      reassurance: [
        {
          title: 'Livraison partout au Maroc',
          desc: 'Expédition 24h à Casablanca et 48h–72h vers toutes les villes du Royaume.',
        },
        {
          title: 'Paiement à la livraison',
          desc: 'Réglez en espèces directement au livreur lors de la réception de votre colis.',
        },
        {
          title: 'Paiement sécurisé',
          desc: 'Transactions protégées et données chiffrées conformes aux standards bancaires.',
        },
        {
          title: 'Service client disponible',
          desc: 'Équipe basée à Casablanca joignable 6j/7 par téléphone, WhatsApp et e-mail.',
        },
      ],
    },
    product: {
      addToCart: 'Ajouter au panier',
      buyNow: 'Acheter maintenant',
      inStock: 'En stock',
      outOfStock: 'Rupture de stock',
      specs: 'Caractéristiques techniques',
      description: 'Description détaillée',
      reviews: 'Avis clients',
      similar: 'Produits similaires',
      writeReview: 'Donner votre avis',
    },
    cart: {
      title: 'Votre panier',
      empty: 'Votre panier est actuellement vide.',
      browse: 'Parcourir le catalogue',
      subtotal: 'Sous-total',
      shipping: 'Livraison estimée',
      free: 'Gratuite',
      total: 'Total estimé',
      checkout: 'Passer la commande',
      viewCart: 'Voir le panier complet',
      promoPlaceholder: 'Code promo (ex: CASA10)',
      apply: 'Appliquer',
    },
    footer: {
      about: 'À propos',
      contact: 'Contact',
      faq: 'FAQ',
      cgv: 'Conditions générales de vente',
      privacy: 'Politique de confidentialité',
      returns: 'Retours & remboursement',
      shipping: 'Conditions de livraison',
      tracking: 'Suivi de commande',
    },
  },
  ar: {
    nav: {
      catalog: 'الكتالوج',
      categories: 'الفئات',
      deals: 'العروض',
      track: 'تتبع الطلب',
      searchPlaceholder: 'ابحث عن منتج أو علامة تجارية...',
      account: 'حسابي',
      wishlist: 'المفضلة',
      cart: 'السلة',
      admin: 'الإدارة',
    },
    hero: {
      eyebrow: 'الدار البيضاء · التوصيل إلى جميع مدن المغرب',
      title: 'كل ما تحتاجه بأفضل الأسعار في المغرب!',
      subtitle: 'اكتشف أفضل العروض واستفد من التوصيل السريع إلى جميع المدن المغربية.',
      cta: 'اكتشف منتجاتنا',
      secondaryCta: 'تتبع طلبي',
    },
    home: {
      popularCategories: 'الفئات الشائعة',
      categoriesSub: 'تصفح مجموعاتنا المختارة بعناية لتلبية احتياجاتك اليومية',
      collectionsTitle: 'مختارات كازافانت',
      tabs: {
        popular: 'الأكثر طلباً',
        bestsellers: 'الأكثر مبيعاً',
        newest: 'وصل حديثاً',
        promos: 'عروض اللحظة',
        recommended: 'موصى به لك',
        recent: 'شاهدته مؤخراً',
      },
      viewAll: 'عرض جميع المنتجات',
      reassurance: [
        {
          title: 'التوصيل لجميع مدن المغرب',
          desc: 'شحن خلال 24 ساعة بالدار البيضاء و48 إلى 72 ساعة لباقي المدن.',
        },
        {
          title: 'الدفع عند الاستلام',
          desc: 'ادفع نقداً للموزع بعد استلام طلبك بكل أمان واطمئنان.',
        },
        {
          title: 'معاملات مؤمنة',
          desc: 'حماية كاملة لبياناتك الشخصية وطلباتك وفق أعلى المعايير.',
        },
        {
          title: 'خدمة عملاء متوفرة',
          desc: 'فريق دعم محلي في الدار البيضاء رهن إشارتكم 6 أيام في الأسبوع.',
        },
      ],
    },
    product: {
      addToCart: 'أضف إلى السلة',
      buyNow: 'اشتري الآن',
      inStock: 'متوفر في المخزون',
      outOfStock: 'غير متوفر حالياً',
      specs: 'المواصفات التقنية',
      description: 'الوصف التفصيلي',
      reviews: 'آراء العملاء',
      similar: 'منتجات مشابهة',
      writeReview: 'أضف تقييمك',
    },
    cart: {
      title: 'سلة التسوق',
      empty: 'سلة التسوق فارغة حالياً.',
      browse: 'تصفح المنتجات',
      subtotal: 'المجموع الفرعي',
      shipping: 'رسوم التوصيل',
      free: 'مجاني',
      total: 'المجموع التقديري',
      checkout: 'إتمام الطلب',
      viewCart: 'عرض السلة الكاملة',
      promoPlaceholder: 'رمز التخفيض (مثال: CASA10)',
      apply: 'تطبيق',
    },
    footer: {
      about: 'من نحن',
      contact: 'اتصل بنا',
      faq: 'الأسئلة الشائعة',
      cgv: 'شروط البيع',
      privacy: 'سياسة الخصوصية',
      returns: 'سياسة الاسترجاع',
      shipping: 'شروط التوصيل',
      tracking: 'تتبع الطلب',
    },
  },
} as const;

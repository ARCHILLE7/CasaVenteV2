import bcrypt from 'bcryptjs';
import { db } from './db.ts';

const IMG = {
  hero: '/images/hero_casavente_showcase_1794670919753.jpg',
  laptop: '/images/prod_tech_laptop_1794670919612.jpg',
  audio: '/images/prod_audio_headphones_1794670919671.jpg',
  phone: '/images/prod_smartphone_pro_1794670920788.jpg',
  espresso: '/images/prod_home_espresso_1794670921290.jpg',
  fashion: '/images/prod_fashion_bag_1794670921673.jpg',
  beauty: '/images/prod_beauty_argan_1794670922634.jpg',
  sport: '/images/prod_sport_gear_1794670923141.jpg',
};

export function seedDatabase() {
  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
  if (userCount > 0) return;

  const adminHash = bcrypt.hashSync('CasaAdmin!2026', 10);
  const clientHash = bcrypt.hashSync('Client!2026', 10);

  db.prepare(`
    INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
    VALUES (?, ?, ?, ?, 'ADMIN', 1)
  `).run('admin@casavente.ma', adminHash, 'Youssef El Mansouri', '+212661102030');

  const clientRes = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
    VALUES (?, ?, ?, ?, 'CLIENT', 1)
  `).run('salma.bennani@casavente.ma', clientHash, 'Salma Bennani', '+212662445566');

  const clientId = Number(clientRes.lastInsertRowid);

  db.prepare(`
    INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
    VALUES (?, ?, ?, ?, 'CLIENT', 1)
  `).run('karim.tazi@casavente.ma', clientHash, 'Karim Tazi', '+212663778899');

  db.prepare(`
    INSERT INTO addresses (user_id, label, full_name, phone, city, neighborhood, street_address, notes, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    clientId,
    'Domicile',
    'Salma Bennani',
    '+212662445566',
    'Casablanca',
    'Maarif',
    '42 Boulevard Al Massira Al Khadra, Résidence Anfa, Appt 8',
    'Sonner à l’interphone 08'
  );

  db.prepare(`
    INSERT INTO addresses (user_id, label, full_name, phone, city, neighborhood, street_address, notes, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    clientId,
    'Bureau',
    'Salma Bennani',
    '+212662445566',
    'Casablanca',
    'Sidi Maarouf',
    'Casablanca Nearshore Park, Shore 12, Bureau 304',
    'Remise à l’accueil entre 9h et 17h'
  );

  // 8 Categories matching the brief
  const categoriesData = [
    {
      slug: 'electronique-high-tech',
      name_fr: 'Électronique & High-Tech',
      name_ar: 'الإلكترونيات والتكنولوجيا',
      description_fr: 'Audio haute fidélité, montres connectées et objets intelligents.',
      description_ar: 'سماعات عالية الدقة وساعات ذكية وأجهزة متصلة.',
      image_url: IMG.audio,
      sort_order: 1,
    },
    {
      slug: 'telephones-accessoires',
      name_fr: 'Téléphones & Accessoires',
      name_ar: 'الهواتف والإكسسوارات',
      description_fr: 'Smartphones dernière génération, coques et chargeurs rapides.',
      description_ar: 'هواتف ذكية حديثة، أغطية حماية وشواحن سريعة.',
      image_url: IMG.phone,
      sort_order: 2,
    },
    {
      slug: 'informatique',
      name_fr: 'Informatique',
      name_ar: 'المعلوميات والحواسيب',
      description_fr: 'PC portables professionnels, périphériques et bureautique.',
      description_ar: 'حواسيب محمولة احترافية وإكسسوارات المكتب.',
      image_url: IMG.laptop,
      sort_order: 3,
    },
    {
      slug: 'maison-decoration',
      name_fr: 'Maison & Décoration',
      name_ar: 'المنزل والديكور',
      description_fr: 'Luminaires, arts de la table et décoration contemporaine.',
      description_ar: 'إضاءة أنيقة وأواني وديكور منزلي عصري.',
      image_url: IMG.hero,
      sort_order: 4,
    },
    {
      slug: 'mode-accessoires',
      name_fr: 'Mode & Accessoires',
      name_ar: 'الأزياء والإكسسوارات',
      description_fr: 'Maroquinerie, montres classiques et solaires intemporelles.',
      description_ar: 'حقائب جلدية وساعات ونظارات شمسية.',
      image_url: IMG.fashion,
      sort_order: 5,
    },
    {
      slug: 'beaute-bien-etre',
      name_fr: 'Beauté & Bien-être',
      name_ar: 'الجمال والعناية',
      description_fr: 'Soins à l’huile d’argan du Maroc, sérums et bien-être.',
      description_ar: 'مستحضرات التجميل الطبيعية بزيت الأركان المغربي.',
      image_url: IMG.beauty,
      sort_order: 6,
    },
    {
      slug: 'electromenager',
      name_fr: 'Électroménager',
      name_ar: 'الأجهزة المنزلية',
      description_fr: 'Machines à expresso, petit-déjeuner et confort domestique.',
      description_ar: 'آلات القهوة والأجهزة المنزلية الحديثة.',
      image_url: IMG.espresso,
      sort_order: 7,
    },
    {
      slug: 'sport-loisirs',
      name_fr: 'Sport & Loisirs',
      name_ar: 'الرياضة والترفيه',
      description_fr: 'Chaussures de running, montres GPS et équipement fitness.',
      description_ar: 'أحذية الجري وساعات رياضية ومعدات اللياقة.',
      image_url: IMG.sport,
      sort_order: 8,
    },
  ];

  const insertCat = db.prepare(`
    INSERT INTO categories (slug, name_fr, name_ar, description_fr, description_ar, image_url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const catIds: Record<string, number> = {};
  for (const c of categoriesData) {
    const res = insertCat.run(c.slug, c.name_fr, c.name_ar, c.description_fr, c.description_ar, c.image_url, c.sort_order);
    catIds[c.slug] = Number(res.lastInsertRowid);
  }

  // Subcategories
  insertCat.run('audio-casques', 'Casques & Écouteurs', 'سماعات الرأس والأذن', 'Audio sans fil', 'صوت لاسلكي', IMG.audio, 9);
  db.prepare('UPDATE categories SET parent_id = ? WHERE slug = ?').run(catIds['electronique-high-tech'], 'audio-casques');

  // Shipping Zones (Morocco)
  const zones = [
    ['Casablanca', 'Grand Casablanca', 25, 500, '24h'],
    ['Rabat', 'Rabat-Salé-Kénitra', 30, 600, '24h - 48h'],
    ['Marrakech', 'Marrakech-Safi', 35, 650, '48h'],
    ['Tanger', 'Tanger-Tétouan-Al Hoceïma', 35, 650, '48h'],
    ['Fès', 'Fès-Meknès', 35, 650, '48h'],
    ['Agadir', 'Souss-Massa', 40, 700, '48h - 72h'],
    ['Oujda', 'Oriental', 45, 750, '72h'],
    ['Meknès', 'Fès-Meknès', 35, 650, '48h'],
    ['Kénitra', 'Rabat-Salé-Kénitra', 30, 600, '24h - 48h'],
    ['Tétouan', 'Tanger-Tétouan-Al Hoceïma', 40, 700, '48h - 72h'],
    ['Mohammedia', 'Grand Casablanca', 25, 500, '24h'],
    ['El Jadida', 'Casablanca-Settat', 30, 600, '24h - 48h'],
  ];

  const insertZone = db.prepare(`
    INSERT INTO shipping_zones (city, zone_name, fee_mad, free_threshold_mad, estimated_days)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const z of zones) {
    insertZone.run(z[0], z[1], z[2], z[3], z[4]);
  }

  // Promo Codes
  db.prepare(`
    INSERT INTO promo_codes (code, discount_type, discount_value, min_order_mad, max_uses, used_count, is_active, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run('CASA10', 'PERCENT', 10, 400, 1000, 14, '2027-12-31');

  db.prepare(`
    INSERT INTO promo_codes (code, discount_type, discount_value, min_order_mad, max_uses, used_count, is_active, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run('BIENVENUE100', 'FIXED', 100, 1000, 500, 8, '2027-12-31');

  // Banners
  db.prepare(`
    INSERT INTO banners (title_fr, title_ar, subtitle_fr, subtitle_ar, cta_label_fr, cta_label_ar, cta_link, image_url, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    'Tout ce dont vous avez besoin, au meilleur prix !',
    'كل ما تحتاجه بأفضل الأسعار في المغرب',
    'Découvrez les meilleures offres et profitez de la livraison partout au Maroc.',
    'اكتشف أفضل العروض واستفد من التوصيل السريع إلى جميع المدن المغربية مع الدفع عند الاستلام.',
    'Découvrir nos produits',
    'اكتشف منتجاتنا',
    '/catalogue',
    IMG.hero
  );

  // 12 Rich Products tailored for Morocco
  const products = [
    {
      slug: 'casque-aether-studio-anc-bleu-nuit',
      category_id: catIds['electronique-high-tech'],
      brand: 'Aether Audio',
      sku: 'CV-AUD-101',
      name_fr: 'Casque Sans Fil Aether Studio ANC & Écouteurs',
      name_ar: 'سماعة رأس لاسلكية Aether Studio مع عزل الضوضاء',
      short_desc_fr: 'Réduction de bruit active hybride -42 dB, autonomie 45h et boîtier nomade inclus.',
      short_desc_ar: 'عزل ضوضاء نشط متطور، بطارية تدوم 45 ساعة مع علبة شحن مدمجة.',
      description_fr:
        'Conçu pour les trajets quotidiens à Casablanca comme pour le télétravail exigeant, le pack Aether Studio combine un casque circum-aural en cuir végane bleu nuit et des écouteurs compacts à charge rapide USB-C. Profitez d’un son équilibré et d’appels cristallins grâce aux 6 microphones intégrés.',
      description_ar:
        'مصمم لتجربة استماع فاخرة سواء في العمل أو أثناء التنقل، يجمع هذا الطقم بين سماعة رأس مريحة وعازلة للضوضاء وسماعات أذن عملية بشحن سريع.',
      specs: [
        { label_fr: 'Connectivité', label_ar: 'الاتصال', value: 'Bluetooth 5.4 Multi-points' },
        { label_fr: 'Autonomie', label_ar: 'البطارية', value: '45 heures (ANC activé)' },
        { label_fr: 'Garantie Maroc', label_ar: 'الضمان', value: '24 mois CasaVente' },
      ],
      variants: [
        { name_fr: 'Couleur', name_ar: 'اللون', options: ['Bleu Nuit', 'Noir Mat'] },
        { name_fr: 'Édition', name_ar: 'الإصدار', options: ['Pack Casque + Écouteurs', 'Casque Seul'] },
      ],
      price_mad: 1490,
      old_price_mad: 1890,
      stock: 24,
      images: [IMG.audio, IMG.hero],
      is_featured: 1,
      is_bestseller: 1,
      is_new: 0,
      rating_avg: 4.9,
      review_count: 38,
    },
    {
      slug: 'ultrabook-atlas-pro-14-m3',
      category_id: catIds['informatique'],
      brand: 'Atlas Computing',
      sku: 'CV-INF-204',
      name_fr: 'Ultrabook Atlas Pro 14" Aluminium – 16 Go / 512 Go SSD',
      name_ar: 'حاسوب محمول Atlas Pro 14 بوصة – 16 جيغا / 512 SSD',
      short_desc_fr: 'Châssis unibody en aluminium brossé, écran IPS 2.8K antireflet et souris sans fil offerte.',
      short_desc_ar: 'هيكل ألمنيوم أنيق، شاشة عالية الدقة مع فأرة لاسلكية مرفقة.',
      description_fr:
        'L’Ultrabook Atlas Pro 14 accompagne les développeurs, architectes et étudiants marocains avec une fluidité exemplaire. Équipé de 16 Go de mémoire LPDDR5, d’un SSD NVMe ultra-rapide et d’un clavier AZERTY rétroéclairé, il offre 14 heures d’autonomie réelle.',
      description_ar:
        'حاسوب محمول خفيف الوزن وعالي الأداء موجه للمحترفين والطلبة، يتميز ببطارية تدوم طوال اليوم وشاشة مريحة للعين.',
      specs: [
        { label_fr: 'Processeur', label_ar: 'المعالج', value: 'Octa-Core 4.4 GHz' },
        { label_fr: 'Mémoire / Stockage', label_ar: 'الذاكرة والتخزين', value: '16 Go RAM · 512 Go SSD NVMe' },
        { label_fr: 'Clavier', label_ar: 'لوحة المفاتيح', value: 'AZERTY Français rétroéclairé' },
      ],
      variants: [
        { name_fr: 'Configuration', name_ar: 'السعة', options: ['16 Go / 512 Go', '32 Go / 1 To'] },
        { name_fr: 'Finition', name_ar: 'اللون', options: ['Gris Sidéral', 'Argent'] },
      ],
      price_mad: 8490,
      old_price_mad: 9690,
      stock: 11,
      images: [IMG.laptop, IMG.hero],
      is_featured: 1,
      is_bestseller: 1,
      is_new: 1,
      rating_avg: 4.8,
      review_count: 27,
    },
    {
      slug: 'smartphone-titanium-pro-max-256',
      category_id: catIds['telephones-accessoires'],
      brand: 'Vortex Mobile',
      sku: 'CV-TEL-301',
      name_fr: 'Smartphone Horizon Titanium Pro 256 Go + Coque Bleu Nuit',
      name_ar: 'هاتف Horizon Titanium Pro 256 جيغا مع غطاء حماية',
      short_desc_fr: 'Écran OLED 120 Hz, triple capteur 48 MP, coque magnétique et câble tressé USB-C inclus.',
      short_desc_ar: 'شاشة OLED بتردد 120 هرتز وكاميرا ثلاثية احترافية مع غطاء حماية وكابل.',
      description_fr:
        'Châssis en titane brossé haute résistance, photographie nocturne d’une netteté remarquable et charge rapide 65W. Livré prêt à l’emploi avec sa coque en silicone bleu nuit et son câble USB-C renforcé. Débloqué tous opérateurs Maroc (Maroc Telecom, Orange, Inwi).',
      description_ar:
        'هاتف ذكي بإطار من التيتانيوم وكاميرا متطورة، متوافق مع جميع شبكات الاتصال المغربية ويأتي مع غطاء حماية أنيق.',
      specs: [
        { label_fr: 'Écran', label_ar: 'الشاشة', value: '6.7" LTPO OLED 120 Hz' },
        { label_fr: 'Réseau', label_ar: 'الشبكة', value: '5G Dual SIM (Débloqué)' },
        { label_fr: 'Batterie', label_ar: 'البطارية', value: '5000 mAh · Charge 65W' },
      ],
      variants: [
        { name_fr: 'Capacité', name_ar: 'السعة', options: ['256 Go', '512 Go'] },
        { name_fr: 'Couleur', name_ar: 'اللون', options: ['Titane Naturel', 'Titane Noir'] },
      ],
      price_mad: 9890,
      old_price_mad: 10990,
      stock: 15,
      images: [IMG.phone],
      is_featured: 1,
      is_bestseller: 1,
      is_new: 1,
      rating_avg: 4.9,
      review_count: 52,
    },
    {
      slug: 'machine-expresso-barista-inox-15-bars',
      category_id: catIds['electromenager'],
      brand: 'Fivumber Home',
      sku: 'CV-ELM-401',
      name_fr: 'Machine Expresso Barista Inox 15 Bars + Buse Vapeur',
      name_ar: 'آلة تحضير الإسبريسو الاحترافية 15 بار من الفولاذ المقاوم للصدأ',
      short_desc_fr: 'Corps en acier brossé, manomètre de pression précis et porte-filtre en noyer véritable.',
      short_desc_ar: 'هيكل من الإينوكس المصقول مع مقياس ضغط دقيق ومقبض خشبي أنيق.',
      description_fr:
        'Retrouvez la qualité d’un café de spécialité à domicile. Grâce à son thermoblock rapide et sa pompe italienne 15 bars, l’extraction révèle toute la richesse des arômes. Buse vapeur orientable pour cappuccinos onctueux.',
      description_ar:
        'استمتع بمذاق القهوة المختصة في منزلك بفضل مضخة 15 بار ونظام تسخين سريع مع أنبوب بخار لتحضير الكابتشينو.',
      specs: [
        { label_fr: 'Pression', label_ar: 'الضغط', value: '15 Bars avec manomètre' },
        { label_fr: 'Réservoir', label_ar: 'خزان الماء', value: '1.8 Litres amovible' },
        { label_fr: 'Puissance', label_ar: 'القدرة', value: '1450 W · 220-240V Maroc' },
      ],
      variants: [
        { name_fr: 'Finition', name_ar: 'اللون', options: ['Inox Brossé', 'Noir Mat'] },
      ],
      price_mad: 2690,
      old_price_mad: 3290,
      stock: 9,
      images: [IMG.espresso],
      is_featured: 1,
      is_bestseller: 1,
      is_new: 0,
      rating_avg: 4.7,
      review_count: 19,
    },
    {
      slug: 'sac-bandouliere-cuir-cognac-montre-solaires',
      category_id: catIds['mode-accessoires'],
      brand: 'Maison Anfa',
      sku: 'CV-MOD-501',
      name_fr: 'Sac Bandoulière Cuir Pleine Fleur Cognac – Édition Anfa',
      name_ar: 'حقيبة جلدية طبيعية فاخرة بلون كونياك – إصدار أنفا',
      short_desc_fr: 'Cuir pleine fleur tannage végétal, bouclerie laiton brossé et sangle réglable.',
      short_desc_ar: 'جلد طبيعي فاخر مع حزام قابل للتعديل وإكسسوارات نحاسية أنيقة.',
      description_fr:
        'Façonné avec soin dans un cuir pleine fleur souple et structuré, le sac Anfa conjugue élégance intemporelle et praticité urbaine. Compartiment principal zippé, poche intérieure pour smartphone et finitions sellier.',
      description_ar:
        'حقيبة يد وكتف مصنوعة من الجلد الطبيعي المتين بتصميم كلاسيكي أنيق يناسب الإطلالات اليومية والرسمية.',
      specs: [
        { label_fr: 'Matière', label_ar: 'المادة', value: '100% Cuir pleine fleur' },
        { label_fr: 'Dimensions', label_ar: 'الأبعاد', value: '25 x 16 x 7 cm' },
        { label_fr: 'Origine', label_ar: 'الأصل', value: 'Artisanat marocain de Fès' },
      ],
      variants: [
        { name_fr: 'Couleur', name_ar: 'اللون', options: ['Cognac', 'Noir Ébène'] },
      ],
      price_mad: 890,
      old_price_mad: 1150,
      stock: 18,
      images: [IMG.fashion],
      is_featured: 1,
      is_bestseller: 0,
      is_new: 1,
      rating_avg: 4.9,
      review_count: 31,
    },
    {
      slug: 'coffret-serum-argan-bio-creme-reparatrice',
      category_id: catIds['beaute-bien-etre'],
      brand: 'Atlas Botanique',
      sku: 'CV-BEA-601',
      name_fr: 'Coffret Soin Huile d’Argan Bio & Crème Réparatrice',
      name_ar: 'مجموعة العناية بزيت الأركان المغربي العضوي وكريم الترميم',
      short_desc_fr: 'Sérum pur d’argan pressé à froid (50 ml) + crème réparatrice fleur d’oranger (100 ml).',
      short_desc_ar: 'سيروم زيت الأركان البكر (50 مل) مع كريم مرطب بزهر البرتقال (100 مل).',
      description_fr:
        'Récoltée dans la région de Taroudant et pressée à froid pour préserver ses antioxydants naturels, notre huile d’argan pure certifiée bio nourrit intensément la peau et les cheveux, accompagnée d’une crème onctueuse aux notes de fleur d’oranger.',
      description_ar:
        'زيت أركان عضوي نقي مستخلص على البارد من منطقة تارودانت مع كريم مرطب غني برائحة زهر البرتقال المغربي.',
      specs: [
        { label_fr: 'Contenance', label_ar: 'الحجم', value: '50 ml Sérum + 100 ml Crème' },
        { label_fr: 'Origine', label_ar: 'المنشأ', value: 'Coopérative Taroudant, Maroc' },
        { label_fr: 'Certification', label_ar: 'الشهادة', value: '100% Naturel · Sans parabènes' },
      ],
      variants: [
        { name_fr: 'Format', name_ar: 'الحجم', options: ['Coffret Duo', 'Sérum 50 ml'] },
      ],
      price_mad: 340,
      old_price_mad: 420,
      stock: 42,
      images: [IMG.beauty],
      is_featured: 1,
      is_bestseller: 1,
      is_new: 0,
      rating_avg: 4.9,
      review_count: 64,
    },
    {
      slug: 'pack-running-velocity-montre-gps-gourde',
      category_id: catIds['sport-loisirs'],
      brand: 'Velocity Athletics',
      sku: 'CV-SPT-701',
      name_fr: 'Baskets Running Velocity Pro + Montre GPS & Gourde Inox',
      name_ar: 'حذاء الجري Velocity Pro مع ساعة ذكية وقارورة حرارية',
      short_desc_fr: 'Amorti haute réactivité pour la Corniche, mesh respirant et suivi cardio multi-sports.',
      short_desc_ar: 'حذاء جري خفيف ومريح مع ساعة لتتبع النشاط الرياضي وقارورة فولاذية.',
      description_fr:
        'Idéal pour vos séances sur la Corniche d’Ain Diab ou en salle. Semelle intermédiaire double densité ultra-légère, tige en mesh technique respirant et montre GPS étanche 5 ATM offrant 14 jours d’autonomie.',
      description_ar:
        'طقم رياضي متكامل للجري واللياقة البدنية، يمنحك ثباتاً وراحة فائقة مع مراقبة دقيقة لنبضات القلب والمسافة.',
      specs: [
        { label_fr: 'Poids chaussure', label_ar: 'وزن الحذاء', value: '245 g (pointure 42)' },
        { label_fr: 'Étanchéité montre', label_ar: 'مقاومة الماء', value: '5 ATM · GPS intégré' },
        { label_fr: 'Gourde', label_ar: 'القارورة', value: 'Inox isotherme 750 ml' },
      ],
      variants: [
        { name_fr: 'Pointure', name_ar: 'المقاس', options: ['40', '41', '42', '43', '44'] },
        { name_fr: 'Coloris', name_ar: 'اللون', options: ['Blanc & Bleu Nuit'] },
      ],
      price_mad: 1290,
      old_price_mad: 1590,
      stock: 22,
      images: [IMG.sport],
      is_featured: 1,
      is_bestseller: 0,
      is_new: 1,
      rating_avg: 4.8,
      review_count: 23,
    },
    {
      slug: 'lampe-ceramique-travertin-casablanca',
      category_id: catIds['maison-decoration'],
      brand: 'Dar Lumière',
      sku: 'CV-MAI-801',
      name_fr: 'Lampe de Table Céramique Brute & Abat-Jour Lin Naturel',
      name_ar: 'مصباح طاولة من السيراميك الفاخر وغطاء الكتان الطبيعي',
      short_desc_fr: 'Pied en céramique texturée artisanale, détails laiton brossé et éclairage chaud 2700K.',
      short_desc_ar: 'قاعدة سيراميك يدوية مع تفاصيل نحاسية وإضاءة دافئة مريحة.',
      description_fr:
        'Apportez une atmosphère architecturale apaisante à votre salon ou chambre. Cette lampe associe un pied en céramique mate sculptée à un abat-jour en lin belge diffusant une lumière douce et chaleureuse.',
      description_ar:
        'مصباح طاولة يجمع بين البساطة والفخامة، يضفي إضاءة دافئة وهادئة لغرفة المعيشة أو المكتب.',
      specs: [
        { label_fr: 'Hauteur totale', label_ar: 'الارتفاع', value: '48 cm' },
        { label_fr: 'Culot', label_ar: 'المصباح', value: 'E27 LED inclus (2700K)' },
        { label_fr: 'Matériaux', label_ar: 'المواد', value: 'Céramique, laiton & lin' },
      ],
      variants: [
        { name_fr: 'Teinte', name_ar: 'اللون', options: ['Sable & Lin', 'Craie & Écru'] },
      ],
      price_mad: 690,
      old_price_mad: null,
      stock: 14,
      images: [IMG.hero],
      is_featured: 0,
      is_bestseller: 1,
      is_new: 1,
      rating_avg: 4.8,
      review_count: 15,
    },
    {
      slug: 'ecouteurs-true-wireless-aether-pods',
      category_id: catIds['electronique-high-tech'],
      brand: 'Aether Audio',
      sku: 'CV-AUD-102',
      name_fr: 'Écouteurs True Wireless Aether Pods – Bleu Nuit',
      name_ar: 'سماعات أذن لاسلكية Aether Pods – أزرق ليلي',
      short_desc_fr: 'Format ultra-compact, résistance IPX5 et 30 heures d’autonomie totale.',
      short_desc_ar: 'تصميم مدمج مقاوم للماء مع 30 ساعة من التشغيل.',
      description_fr:
        'Des écouteurs intra-auriculaires légers offrant une isolation passive efficace et des basses profondes pour vos déplacements en tramway ou à la salle de sport.',
      description_ar:
        'سماعات أذن خفيفة بصوت نقي وعلبة شحن سريعة مثالية للاستخدام اليومي.',
      specs: [
        { label_fr: 'Résistance', label_ar: 'المقاومة', value: 'IPX5 transpiration et pluie' },
        { label_fr: 'Autonomie', label_ar: 'البطارية', value: '7h + 23h avec boîtier' },
      ],
      variants: [
        { name_fr: 'Couleur', name_ar: 'اللون', options: ['Bleu Nuit', 'Blanc Perle'] },
      ],
      price_mad: 490,
      old_price_mad: 650,
      stock: 35,
      images: [IMG.audio],
      is_featured: 0,
      is_bestseller: 1,
      is_new: 0,
      rating_avg: 4.6,
      review_count: 44,
    },
    {
      slug: 'montre-classique-acier-anfa-39mm',
      category_id: catIds['mode-accessoires'],
      brand: 'Maison Anfa',
      sku: 'CV-MOD-502',
      name_fr: 'Montre Automatique Acier Brossé 39 mm – Cadran Anthracite',
      name_ar: 'ساعة يد كلاسيكية من الفولاذ المقاوم للصدأ 39 مم',
      short_desc_fr: 'Verre saphir inrayable, étanchéité 100 m et bracelet acier massif.',
      short_desc_ar: 'زجاج ياقوتي مقاوم للخدش ومقاومة للماء حتى 100 متر.',
      description_fr:
        'Une montre polyvalente au diamètre universel de 39 mm, dotée d’un mouvement japonais fiable et d’index luminescents haute lisibilité.',
      description_ar:
        'ساعة أنيقة تناسب جميع المناسبات بقطر 39 مم وزجاج مقاوم للخدش.',
      specs: [
        { label_fr: 'Diamètre', label_ar: 'القطر', value: '39 mm · Acier 316L' },
        { label_fr: 'Verre', label_ar: 'الزجاج', value: 'Saphir antireflet' },
      ],
      variants: [
        { name_fr: 'Cadran', name_ar: 'الميناء', options: ['Anthracite', 'Bleu Nuit'] },
      ],
      price_mad: 1650,
      old_price_mad: 1990,
      stock: 7,
      images: [IMG.fashion],
      is_featured: 0,
      is_bestseller: 0,
      is_new: 1,
      rating_avg: 4.9,
      review_count: 12,
    },
    {
      slug: 'coque-magnetique-cable-usb-c-tresse',
      category_id: catIds['telephones-accessoires'],
      brand: 'Vortex Mobile',
      sku: 'CV-TEL-302',
      name_fr: 'Kit Protection Magnétique Bleu Nuit + Câble USB-C 100W',
      name_ar: 'طقم حماية مغناطيسي أزرق ليلي مع كابل شحن سريع 100 واط',
      short_desc_fr: 'Silicone liquide doux au toucher, doublure microfibre et câble nylon 2m.',
      short_desc_ar: 'غطاء سيليكون ناعم مبطن بالميكروفايبر مع كابل شحن مضفر.',
      description_fr:
        'Protégez votre smartphone des chocs quotidiens sans alourdir votre poche. Compatible charge sans fil magnétique.',
      description_ar:
        'حماية متينة وأنيقة لهاتفك مع دعم الشحن المغناطيسي اللاسلكي.',
      specs: [
        { label_fr: 'Puissance câble', label_ar: 'قدرة الشحن', value: 'USB-C PD 100W (2 mètres)' },
        { label_fr: 'Compatibilité', label_ar: 'التوافق', value: 'Série Pro / Pro Max' },
      ],
      variants: [
        { name_fr: 'Modèle', name_ar: 'الطراز', options: ['Pro 6.1"', 'Pro Max 6.7"'] },
      ],
      price_mad: 249,
      old_price_mad: 320,
      stock: 0,
      images: [IMG.phone],
      is_featured: 0,
      is_bestseller: 0,
      is_new: 0,
      rating_avg: 4.7,
      review_count: 29,
    },
    {
      slug: 'souris-ergonomique-aluminium-bluetooth',
      category_id: catIds['informatique'],
      brand: 'Atlas Computing',
      sku: 'CV-INF-205',
      name_fr: 'Souris Sans Fil Aluminium Minimaliste – Multi-Appareils',
      name_ar: 'فأرة لاسلكية من الألمنيوم متعددة الأجهزة',
      short_desc_fr: 'Capteur optique haute précision 4000 DPI, clics silencieux et recharge USB-C.',
      short_desc_ar: 'مستشعر عالي الدقة 4000 DPI مع أزرار صامتة وشحن USB-C.',
      description_fr:
        'Pensée pour le confort au bureau et la mobilité, cette souris ultra-fine se connecte jusqu’à 3 appareils simultanément.',
      description_ar:
        'فأرة مريحة وصامتة تدعم الاتصال بثلاثة أجهزة في نفس الوقت.',
      specs: [
        { label_fr: 'Capteur', label_ar: 'المستشعر', value: '4000 DPI réglable' },
        { label_fr: 'Autonomie', label_ar: 'البطارية', value: '60 jours par charge' },
      ],
      variants: [
        { name_fr: 'Couleur', name_ar: 'اللون', options: ['Gris Sidéral', 'Argent'] },
      ],
      price_mad: 390,
      old_price_mad: null,
      stock: 28,
      images: [IMG.laptop],
      is_featured: 0,
      is_bestseller: 0,
      is_new: 1,
      rating_avg: 4.8,
      review_count: 17,
    },
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (
      slug, category_id, brand, sku, name_fr, name_ar, short_desc_fr, short_desc_ar,
      description_fr, description_ar, specs_json, variants_json, price_mad, old_price_mad,
      stock, images_json, is_featured, is_bestseller, is_new, is_active, rating_avg, review_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const prodIds: number[] = [];
  for (const p of products) {
    const res = insertProd.run(
      p.slug,
      p.category_id,
      p.brand,
      p.sku,
      p.name_fr,
      p.name_ar,
      p.short_desc_fr,
      p.short_desc_ar,
      p.description_fr,
      p.description_ar,
      JSON.stringify(p.specs),
      JSON.stringify(p.variants),
      p.price_mad,
      p.old_price_mad,
      p.stock,
      JSON.stringify(p.images),
      p.is_featured,
      p.is_bestseller,
      p.is_new,
      p.rating_avg,
      p.review_count
    );
    prodIds.push(Number(res.lastInsertRowid));
  }

  // Seed authentic reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_id, author_name, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertReview.run(prodIds[0], clientId, 'Salma B. · Casablanca', 5, 'Qualité sonore incroyable et livraison reçue en moins de 24h à Maarif. Je recommande vivement.');
  insertReview.run(prodIds[0], null, 'Mehdi R. · Rabat', 5, 'Très confortable même après 4 heures de réunion, la réduction de bruit est bluffante.');
  insertReview.run(prodIds[1], null, 'Amine K. · Tanger', 5, 'Ultrabook rapide et léger, clavier AZERTY parfait pour le développement.');
  insertReview.run(prodIds[5], clientId, 'Nadia L. · Marrakech', 5, 'L’huile d’argan sent divinement bon et la texture de la crème est très agréable.');

  // Seed wishlist for demo client
  db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(clientId, prodIds[0]);
  db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(clientId, prodIds[4]);

  // Seed realistic historical orders for client & admin dashboard analytics
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, user_id, customer_name, customer_phone, customer_email,
      city, neighborhood, street_address, notes, delivery_mode, payment_method,
      payment_status, status, subtotal_mad, shipping_mad, discount_mad, promo_code, total_mad, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, product_image, variant_label, quantity, unit_price_mad, line_total_mad)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTimeline = db.prepare(`
    INSERT INTO order_timeline (order_id, status, note, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const o1 = Number(
    insertOrder.run(
      'CV-2026-1041',
      clientId,
      'Salma Bennani',
      '+212662445566',
      'salma.bennani@casavente.ma',
      'Casablanca',
      'Maarif',
      '42 Boulevard Al Massira Al Khadra, Appt 8',
      'Appeler 15 min avant arrivée',
      'EXPRESS',
      'COD',
      'PAID',
      'LIVREE',
      1830,
      0,
      0,
      null,
      1830,
      new Date(Date.now() - 4 * 86400000).toISOString()
    ).lastInsertRowid
  );
  insertOrderItem.run(o1, prodIds[0], products[0].name_fr, IMG.audio, 'Bleu Nuit · Pack Casque + Écouteurs', 1, 1490, 1490);
  insertOrderItem.run(o1, prodIds[5], products[5].name_fr, IMG.beauty, 'Coffret Duo', 1, 340, 340);
  insertTimeline.run(o1, 'EN_ATTENTE', 'Commande enregistrée', new Date(Date.now() - 4 * 86400000).toISOString());
  insertTimeline.run(o1, 'CONFIRMEE', 'Confirmée par le service client Casablanca', new Date(Date.now() - 3.8 * 86400000).toISOString());
  insertTimeline.run(o1, 'EXPEDIEE', 'Remise au livreur CasaVente Express', new Date(Date.now() - 3.5 * 86400000).toISOString());
  insertTimeline.run(o1, 'LIVREE', 'Livrée et réglée à la livraison (COD)', new Date(Date.now() - 3.1 * 86400000).toISOString());

  const o2 = Number(
    insertOrder.run(
      'CV-2026-1042',
      clientId,
      'Salma Bennani',
      '+212662445566',
      'salma.bennani@casavente.ma',
      'Casablanca',
      'Maarif',
      '42 Boulevard Al Massira Al Khadra, Appt 8',
      '',
      'STANDARD',
      'COD',
      'PENDING',
      'EN_COURS_LIVRAISON',
      2690,
      0,
      269,
      'CASA10',
      2421,
      new Date(Date.now() - 1 * 86400000).toISOString()
    ).lastInsertRowid
  );
  insertOrderItem.run(o2, prodIds[3], products[3].name_fr, IMG.espresso, 'Inox Brossé', 1, 2690, 2690);
  insertTimeline.run(o2, 'EN_ATTENTE', 'Commande enregistrée', new Date(Date.now() - 1 * 86400000).toISOString());
  insertTimeline.run(o2, 'CONFIRMEE', 'Commande validée', new Date(Date.now() - 0.8 * 86400000).toISOString());
  insertTimeline.run(o2, 'EN_COURS_LIVRAISON', 'Livreur en route vers Maarif, Casablanca', new Date(Date.now() - 0.2 * 86400000).toISOString());

  const o3 = Number(
    insertOrder.run(
      'CV-2026-1043',
      null,
      'Omar Chraibi',
      '+212665112233',
      'omar.chraibi@example.ma',
      'Rabat',
      'Agdal',
      '18 Avenue Fal Ould Oumeir',
      'Livraison après 18h SVP',
      'STANDARD',
      'COD',
      'PENDING',
      'EN_ATTENTE',
      8490,
      0,
      0,
      null,
      8490,
      new Date(Date.now() - 3600000).toISOString()
    ).lastInsertRowid
  );
  insertOrderItem.run(o3, prodIds[1], products[1].name_fr, IMG.laptop, '16 Go / 512 Go · Gris Sidéral', 1, 8490, 8490);
  insertTimeline.run(o3, 'EN_ATTENTE', 'Commande enregistrée, en attente de confirmation téléphonique', new Date(Date.now() - 3600000).toISOString());
}

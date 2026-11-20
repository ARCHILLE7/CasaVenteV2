import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import {
  AUTH_COOKIE_NAME,
  attachOptionalUser,
  generateCsrfToken,
  getSessionSecret,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  signAuthToken,
  type AuthedRequest,
} from './server/auth.ts';
import { db, mapProductRow } from './server/db.ts';
import { seedDatabase } from './server/seed.ts';
import {
  addressSchema,
  categoryWriteSchema,
  contactSchema,
  loginSchema,
  normalizeMoroccanPhone,
  orderCreateSchema,
  productWriteSchema,
  profileUpdateSchema,
  promoWriteSchema,
  registerSchema,
  reviewCreateSchema,
} from './server/validation.ts';

seedDatabase();

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const publicImagesDir = path.resolve('public', 'images');
const distImagesDir = path.resolve('dist', 'images');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser(getSessionSecret()));
app.use(attachOptionalUser);

// Serve generated assets and uploaded product photos reliably in dev and production
app.use('/images', express.static(publicImagesDir));
app.use('/images', express.static(distImagesDir));
app.use('/src/assets/images', express.static(publicImagesDir));
app.use('/src/assets/images', express.static(path.resolve('src', 'assets', 'images')));
app.use('/uploads', express.static(uploadsDir));

// ---------------------------------------------------------------------------
// SEO: Sitemap XML & Robots.txt
// ---------------------------------------------------------------------------
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const staticPaths = [
    '/',
    '/catalogue',
    '/suivi',
    '/a-propos',
    '/contact',
    '/faq',
    '/cgv',
    '/confidentialite',
    '/retours',
    '/livraison',
  ];
  const products = db.prepare('SELECT slug, updated_at FROM products WHERE is_active = 1').all() as {
    slug: string;
    updated_at: string;
  }[];
  const categories = db.prepare('SELECT slug FROM categories').all() as { slug: string }[];

  const urls = [
    ...staticPaths.map((p) => `<url><loc>${baseUrl}${p}</loc><changefreq>weekly</changefreq></url>`),
    ...categories.map(
      (c) => `<url><loc>${baseUrl}/catalogue?category=${encodeURIComponent(c.slug)}</loc><changefreq>weekly</changefreq></url>`
    ),
    ...products.map(
      (p) =>
        `<url><loc>${baseUrl}/produit/${encodeURIComponent(p.slug)}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><changefreq>daily</changefreq></url>`
    ),
  ];

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
  );
});

// ---------------------------------------------------------------------------
// Health & Storefront Bootstrap
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', store: 'CasaVente', currency: 'MAD' });
});

app.get('/api/auth/csrf', (req: AuthedRequest, res) => {
  const seed = req.user ? `user-${req.user.userId}` : 'guest';
  res.json({ csrfToken: generateCsrfToken(seed) });
});

app.get('/api/storefront', (_req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY id DESC').all();
  const categories = db
    .prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.id ASC
    `)
    .all();
  const shippingZones = db.prepare('SELECT * FROM shipping_zones ORDER BY city ASC').all();
  const brandsRows = db.prepare('SELECT DISTINCT brand FROM products WHERE is_active = 1 ORDER BY brand ASC').all() as {
    brand: string;
  }[];

  res.json({
    banners,
    categories,
    shippingZones,
    brands: brandsRows.map((b) => b.brand),
    onlineGatewayConfigured: Boolean(process.env.CMI_MERCHANT_ID && process.env.CMI_STORE_KEY),
  });
});

// ---------------------------------------------------------------------------
// Products & Search
// ---------------------------------------------------------------------------
app.get('/api/products/suggestions', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    res.json({ suggestions: [] });
    return;
  }
  const like = `%${q}%`;
  const rows = db
    .prepare(`
      SELECT p.id, p.slug, p.name_fr, p.name_ar, p.price_mad, p.images_json, c.name_fr as category_name_fr
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1 AND (p.name_fr LIKE ? OR p.name_ar LIKE ? OR p.brand LIKE ? OR p.short_desc_fr LIKE ?)
      ORDER BY p.is_bestseller DESC, p.rating_avg DESC
      LIMIT 6
    `)
    .all(like, like, like, like) as Record<string, unknown>[];

  res.json({
    suggestions: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name_fr: r.name_fr,
      name_ar: r.name_ar,
      price_mad: r.price_mad,
      category_name_fr: r.category_name_fr,
      image: (JSON.parse(String(r.images_json || '[]')) as string[])[0] || '',
    })),
  });
});

app.get('/api/products', (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const brand = String(req.query.brand || '').trim();
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  const inStock = req.query.inStock === 'true';
  const minRating = req.query.minRating ? Number(req.query.minRating) : null;
  const featured = req.query.featured === 'true';
  const bestseller = req.query.bestseller === 'true';
  const isNew = req.query.isNew === 'true';
  const promo = req.query.promo === 'true';
  const sort = String(req.query.sort || 'popular');
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(48, Math.max(1, Number(req.query.limit || 12)));
  const offset = (page - 1) * limit;

  const conditions: string[] = ['p.is_active = 1'];
  const params: (string | number)[] = [];

  if (q) {
    const like = `%${q}%`;
    conditions.push('(p.name_fr LIKE ? OR p.name_ar LIKE ? OR p.brand LIKE ? OR p.short_desc_fr LIKE ? OR p.short_desc_ar LIKE ?)');
    params.push(like, like, like, like, like);
  }
  if (category) {
    conditions.push('(c.slug = ? OR parent.slug = ?)');
    params.push(category, category);
  }
  if (brand) {
    conditions.push('p.brand = ?');
    params.push(brand);
  }
  if (minPrice !== null && !Number.isNaN(minPrice)) {
    conditions.push('p.price_mad >= ?');
    params.push(minPrice);
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    conditions.push('p.price_mad <= ?');
    params.push(maxPrice);
  }
  if (inStock) {
    conditions.push('p.stock > 0');
  }
  if (minRating !== null && !Number.isNaN(minRating)) {
    conditions.push('p.rating_avg >= ?');
    params.push(minRating);
  }
  if (featured) conditions.push('p.is_featured = 1');
  if (bestseller) conditions.push('p.is_bestseller = 1');
  if (isNew) conditions.push('p.is_new = 1');
  if (promo) conditions.push('p.old_price_mad IS NOT NULL AND p.old_price_mad > p.price_mad');

  let orderBy = 'p.is_bestseller DESC, p.rating_avg DESC, p.id DESC';
  if (sort === 'price_asc') orderBy = 'p.price_mad ASC';
  else if (sort === 'price_desc') orderBy = 'p.price_mad DESC';
  else if (sort === 'newest') orderBy = 'p.is_new DESC, p.created_at DESC, p.id DESC';
  else if (sort === 'rating') orderBy = 'p.rating_avg DESC, p.review_count DESC';

  const whereSql = `WHERE ${conditions.join(' AND ')}`;

  const totalRow = db
    .prepare(`
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN categories parent ON parent.id = c.parent_id
      ${whereSql}
    `)
    .get(...params) as { total: number };

  const rows = db
    .prepare(`
      SELECT p.*, c.slug as category_slug, c.name_fr as category_name_fr, c.name_ar as category_name_ar
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN categories parent ON parent.id = c.parent_id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset) as Record<string, unknown>[];

  res.json({
    products: rows.map(mapProductRow),
    pagination: {
      total: totalRow.total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalRow.total / limit)),
    },
  });
});

app.get('/api/products/:slug', (req, res) => {
  const row = db
    .prepare(`
      SELECT p.*, c.slug as category_slug, c.name_fr as category_name_fr, c.name_ar as category_name_ar
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ? AND p.is_active = 1
    `)
    .get(req.params.slug) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  const product = mapProductRow(row);
  const reviews = db
    .prepare('SELECT id, product_id, user_id, author_name, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC')
    .all(Number(row.id));

  const relatedRows = db
    .prepare(`
      SELECT p.*, c.slug as category_slug, c.name_fr as category_name_fr, c.name_ar as category_name_ar
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1 AND p.id != ? AND (p.category_id = ? OR p.is_featured = 1)
      ORDER BY CASE WHEN p.category_id = ? THEN 0 ELSE 1 END, p.rating_avg DESC
      LIMIT 4
    `)
    .all(Number(row.id), Number(row.category_id), Number(row.category_id)) as Record<string, unknown>[];

  res.json({
    product,
    reviews,
    related: relatedRows.map(mapProductRow),
  });
});

app.post('/api/products/:id/reviews', (req: AuthedRequest, res, next) => {
  try {
    const productId = Number(req.params.id);
    const product = db.prepare('SELECT id FROM products WHERE id = ? AND is_active = 1').get(productId);
    if (!product) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }

    const parsed = reviewCreateSchema.parse(req.body);
    const insertRes = db
      .prepare('INSERT INTO reviews (product_id, user_id, author_name, rating, comment) VALUES (?, ?, ?, ?, ?)')
      .run(productId, req.user?.userId || null, parsed.author_name, parsed.rating, parsed.comment);

    const stats = db
      .prepare('SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as cnt FROM reviews WHERE product_id = ?')
      .get(productId) as { avg_rating: number; cnt: number };

    db.prepare('UPDATE products SET rating_avg = ?, review_count = ? WHERE id = ?').run(
      stats.avg_rating || parsed.rating,
      stats.cnt,
      productId
    );

    const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(Number(insertRes.lastInsertRowid));
    res.status(201).json({ review: created, rating_avg: stats.avg_rating, review_count: stats.cnt });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Promo Validation & Orders
// ---------------------------------------------------------------------------
function computePromoDiscount(codeInput: string | null | undefined, subtotal: number) {
  if (!codeInput || !codeInput.trim()) return { code: null, discount: 0, promo: null };
  const code = codeInput.trim().toUpperCase();
  const promo = db
    .prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1')
    .get(code) as
    | {
        id: number;
        code: string;
        discount_type: 'PERCENT' | 'FIXED';
        discount_value: number;
        min_order_mad: number;
        max_uses: number;
        used_count: number;
        expires_at: string | null;
      }
    | undefined;

  if (!promo) throw new Error('Code promotionnel invalide ou expiré.');
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    throw new Error('Ce code promotionnel a expiré.');
  }
  if (promo.used_count >= promo.max_uses) {
    throw new Error('Ce code promotionnel a atteint sa limite d’utilisation.');
  }
  if (subtotal < promo.min_order_mad) {
    throw new Error(`Montant minimum requis de ${promo.min_order_mad} DH pour ce code.`);
  }

  const discount =
    promo.discount_type === 'PERCENT'
      ? Math.round((subtotal * promo.discount_value) / 100)
      : Math.min(subtotal, promo.discount_value);

  return { code: promo.code, discount, promo };
}

app.post('/api/promo/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body as { code?: string; subtotal?: number };
    const result = computePromoDiscount(code, Number(subtotal || 0));
    res.json({ valid: true, code: result.code, discount_mad: result.discount });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Code invalide' });
  }
});

app.post('/api/orders', (req: AuthedRequest, res, next) => {
  try {
    const parsed = orderCreateSchema.parse(req.body);

    if (parsed.payment_method === 'ONLINE_GATEWAY') {
      if (!process.env.CMI_MERCHANT_ID || !process.env.CMI_STORE_KEY) {
        res.status(400).json({
          error:
            'Le paiement par carte bancaire (CMI / Payzone) nécessite la configuration des clés marchands sur le serveur. Veuillez choisir le paiement à la livraison (COD).',
        });
        return;
      }
    }

    // Recompute prices strictly on server
    let subtotal = 0;
    const preparedItems: {
      product_id: number;
      product_name: string;
      product_image: string;
      variant_label: string;
      quantity: number;
      unit_price_mad: number;
      line_total_mad: number;
    }[] = [];

    for (const item of parsed.items) {
      const prod = db
        .prepare('SELECT id, name_fr, price_mad, stock, images_json, is_active FROM products WHERE id = ?')
        .get(item.productId) as
        | { id: number; name_fr: string; price_mad: number; stock: number; images_json: string; is_active: number }
        | undefined;

      if (!prod || prod.is_active !== 1) {
        res.status(400).json({ error: 'Un des produits du panier n’est plus disponible.' });
        return;
      }
      if (prod.stock < item.quantity) {
        res.status(400).json({ error: `Stock insuffisant pour « ${prod.name_fr} » (disponible : ${prod.stock}).` });
        return;
      }

      const lineTotal = prod.price_mad * item.quantity;
      subtotal += lineTotal;
      const images = JSON.parse(prod.images_json || '[]') as string[];

      preparedItems.push({
        product_id: prod.id,
        product_name: prod.name_fr,
        product_image: images[0] || '',
        variant_label: item.variantLabel || '',
        quantity: item.quantity,
        unit_price_mad: prod.price_mad,
        line_total_mad: lineTotal,
      });
    }

    let discountMad = 0;
    let appliedPromo: string | null = null;
    if (parsed.promo_code) {
      try {
        const promoRes = computePromoDiscount(parsed.promo_code, subtotal);
        discountMad = promoRes.discount;
        appliedPromo = promoRes.code;
      } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Code promo invalide' });
        return;
      }
    }

    const zone = db.prepare('SELECT * FROM shipping_zones WHERE city = ?').get(parsed.city) as
      | { fee_mad: number; free_threshold_mad: number }
      | undefined;

    let shippingMad = zone ? zone.fee_mad : 40;
    const freeThreshold = zone ? zone.free_threshold_mad : 650;
    if (parsed.delivery_mode === 'PICKUP_CASA') {
      shippingMad = 0;
    } else if (subtotal >= freeThreshold && parsed.delivery_mode === 'STANDARD') {
      shippingMad = 0;
    } else if (parsed.delivery_mode === 'EXPRESS') {
      shippingMad = (zone ? zone.fee_mad : 40) + 25;
    }

    const totalMad = Math.max(0, subtotal - discountMad + shippingMad);
    const orderNumber = `CV-2026-${Math.floor(1050 + Math.random() * 8900)}`;

    db.exec('BEGIN');
    try {
      const orderInsert = db
        .prepare(`
          INSERT INTO orders (
            order_number, user_id, customer_name, customer_phone, customer_email,
            city, neighborhood, street_address, notes, delivery_mode, payment_method,
            payment_status, status, subtotal_mad, shipping_mad, discount_mad, promo_code, total_mad
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'EN_ATTENTE', ?, ?, ?, ?, ?)
        `)
        .run(
          orderNumber,
          req.user?.userId || null,
          parsed.customer_name,
          parsed.customer_phone,
          parsed.customer_email,
          parsed.city,
          parsed.neighborhood,
          parsed.street_address,
          parsed.notes,
          parsed.delivery_mode,
          parsed.payment_method,
          subtotal,
          shippingMad,
          discountMad,
          appliedPromo,
          totalMad
        );

      const orderId = Number(orderInsert.lastInsertRowid);

      const insertItem = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_image, variant_label, quantity, unit_price_mad, line_total_mad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');

      for (const item of preparedItems) {
        insertItem.run(
          orderId,
          item.product_id,
          item.product_name,
          item.product_image,
          item.variant_label,
          item.quantity,
          item.unit_price_mad,
          item.line_total_mad
        );
        const upd = decrementStock.run(item.quantity, item.product_id, item.quantity);
        if (upd.changes === 0) {
          throw new Error(`Stock épuisé pendant la validation pour ${item.product_name}`);
        }
      }

      if (appliedPromo) {
        db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?').run(appliedPromo);
      }

      db.prepare('INSERT INTO order_timeline (order_id, status, note) VALUES (?, ?, ?)').run(
        orderId,
        'EN_ATTENTE',
        'Commande enregistrée sur CasaVente. Confirmation téléphonique en cours.'
      );

      db.exec('COMMIT');

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
      const timeline = db.prepare('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC').all(orderId);
      res.status(201).json({ order: { ...(order as object), items, timeline } });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/track', (req, res) => {
  const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
  const contact = String(req.query.contact || '').trim();

  if (!orderNumber) {
    res.status(400).json({ error: 'Numéro de commande requis (ex: CV-2026-1042).' });
    return;
  }

  const order = db.prepare('SELECT * FROM orders WHERE UPPER(order_number) = ?').get(orderNumber) as
    | Record<string, unknown>
    | undefined;

  if (!order) {
    res.status(404).json({ error: 'Aucune commande trouvée avec ce numéro.' });
    return;
  }

  const normalizedInputPhone = normalizeMoroccanPhone(contact);
  const matchesPhone = normalizedInputPhone && normalizeMoroccanPhone(String(order.customer_phone)) === normalizedInputPhone;
  const matchesEmail = contact && String(order.customer_email).toLowerCase() === contact.toLowerCase();

  if (!matchesPhone && !matchesEmail) {
    res.status(403).json({
      error: 'Veuillez saisir le numéro de téléphone marocain ou l’e-mail associé à cette commande.',
    });
    return;
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(Number(order.id));
  const timeline = db
    .prepare('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC')
    .all(Number(order.id));

  res.json({ order: { ...order, items, timeline } });
});

app.post('/api/contact', (req, res, next) => {
  try {
    const parsed = contactSchema.parse(req.body);
    db.prepare('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)').run(
      parsed.name,
      parsed.email,
      parsed.phone,
      parsed.subject,
      parsed.message
    );
    res.status(201).json({ message: 'Votre message a bien été transmis à notre équipe de Casablanca.' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Authentication & Password Recovery
// ---------------------------------------------------------------------------
app.post('/api/auth/register', (req, res, next) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.email);
    if (existing) {
      res.status(409).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(parsed.password, 10);
    // Role is strictly forced to 'CLIENT' on public registration
    const result = db
      .prepare('INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?)')
      .run(parsed.email, passwordHash, parsed.full_name, parsed.phone, 'CLIENT');

    const userId = Number(result.lastInsertRowid);
    const user = db
      .prepare('SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE id = ?')
      .get(userId) as { id: number; email: string; role: 'CLIENT' | 'ADMIN' };

    const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
    setSessionCookie(res, token);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.email) as
      | {
          id: number;
          email: string;
          password_hash: string;
          full_name: string;
          phone: string;
          role: 'CLIENT' | 'ADMIN';
          is_active: number;
          created_at: string;
        }
      | undefined;

    if (!row || !bcrypt.compareSync(parsed.password, row.password_hash)) {
      res.status(401).json({ error: 'E-mail ou mot de passe incorrect.' });
      return;
    }
    if (row.is_active !== 1) {
      res.status(403).json({ error: 'Ce compte client a été désactivé par l’administration.' });
      return;
    }

    const token = signAuthToken({ userId: row.id, email: row.email, role: row.role });
    setSessionCookie(res, token);
    res.json({
      user: {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        phone: row.phone,
        role: row.role,
        is_active: row.is_active,
        created_at: row.created_at,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req: AuthedRequest, res) => {
  if (!req.user) {
    res.json({ user: null });
    return;
  }
  const user = db
    .prepare('SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE id = ?')
    .get(req.user.userId);
  res.json({ user: user || null });
});

app.put('/api/auth/profile', requireAuth, (req: AuthedRequest, res, next) => {
  try {
    const parsed = profileUpdateSchema.parse(req.body);
    db.prepare('UPDATE users SET full_name = ?, phone = ?, updated_at = datetime("now") WHERE id = ?').run(
      parsed.full_name,
      parsed.phone,
      req.user!.userId
    );
    const user = db
      .prepare('SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE id = ?')
      .get(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'Adresse e-mail requise.' });
    return;
  }
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
  if (user) {
    const rawToken = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    db.prepare('UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE id = ?').run(
      tokenHash,
      expires,
      user.id
    );
    // In production, send via transactional email provider (SMTP/Resend)
    res.json({
      message:
        'Si un compte correspond à cette adresse e-mail, les instructions de réinitialisation ont été générées.',
      devResetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    });
    return;
  }
  res.json({
    message:
      'Si un compte correspond à cette adresse e-mail, les instructions de réinitialisation ont été générées.',
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.password || '');
  if (!token || newPassword.length < 8) {
    res.status(400).json({ error: 'Jeton invalide ou mot de passe trop court (8 caractères min.).' });
    return;
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = db
    .prepare('SELECT id, reset_token_expires FROM users WHERE reset_token_hash = ?')
    .get(tokenHash) as { id: number; reset_token_expires: string } | undefined;

  if (!user || new Date(user.reset_token_expires) < new Date()) {
    res.status(400).json({ error: 'Lien de réinitialisation expiré ou invalide.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare(
    'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL, updated_at = datetime("now") WHERE id = ?'
  ).run(passwordHash, user.id);

  res.json({ message: 'Votre mot de passe a été mis à jour avec succès.' });
});

// ---------------------------------------------------------------------------
// Customer Account (Protected: requireAuth)
// ---------------------------------------------------------------------------
app.get('/api/account/orders', requireAuth, (req: AuthedRequest, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user!.userId) as Record<string, unknown>[];

  const enriched = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(Number(o.id)),
    timeline: db.prepare('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC').all(Number(o.id)),
  }));
  res.json({ orders: enriched });
});

app.get('/api/account/addresses', requireAuth, (req: AuthedRequest, res) => {
  const addresses = db
    .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC')
    .all(req.user!.userId);
  res.json({ addresses });
});

app.post('/api/account/addresses', requireAuth, (req: AuthedRequest, res, next) => {
  try {
    const parsed = addressSchema.parse(req.body);
    if (parsed.is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user!.userId);
    }
    const ins = db
      .prepare(`
        INSERT INTO addresses (user_id, label, full_name, phone, city, neighborhood, street_address, notes, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.user!.userId,
        parsed.label,
        parsed.full_name,
        parsed.phone,
        parsed.city,
        parsed.neighborhood,
        parsed.street_address,
        parsed.notes,
        parsed.is_default ? 1 : 0
      );
    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(Number(ins.lastInsertRowid));
    res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
});

app.put('/api/account/addresses/:id/default', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user!.userId);
  db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?').run(
    Number(req.params.id),
    req.user!.userId
  );
  res.json({ ok: true });
});

app.delete('/api/account/addresses/:id', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user!.userId);
  res.json({ ok: true });
});

app.get('/api/account/wishlist', requireAuth, (req: AuthedRequest, res) => {
  const rows = db
    .prepare(`
      SELECT p.*, c.slug as category_slug, c.name_fr as category_name_fr, c.name_ar as category_name_ar
      FROM wishlists w
      JOIN products p ON p.id = w.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE w.user_id = ? AND p.is_active = 1
      ORDER BY w.created_at DESC
    `)
    .all(req.user!.userId) as Record<string, unknown>[];
  res.json({ products: rows.map(mapProductRow) });
});

app.post('/api/account/wishlist/:productId', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('INSERT OR IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)').run(
    req.user!.userId,
    Number(req.params.productId)
  );
  res.json({ ok: true });
});

app.delete('/api/account/wishlist/:productId', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(
    req.user!.userId,
    Number(req.params.productId)
  );
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Admin Back-Office API (Protected: requireAdmin)
// ---------------------------------------------------------------------------
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const totalRevenueMad = (
    db.prepare("SELECT COALESCE(SUM(total_mad), 0) as v FROM orders WHERE status != 'ANNULEE'").get() as { v: number }
  ).v;
  const totalOrders = (db.prepare('SELECT COUNT(*) as v FROM orders').get() as { v: number }).v;
  const totalCustomers = (db.prepare("SELECT COUNT(*) as v FROM users WHERE role = 'CLIENT'").get() as { v: number }).v;
  const totalProducts = (db.prepare('SELECT COUNT(*) as v FROM products').get() as { v: number }).v;
  const pendingOrders = (
    db.prepare("SELECT COUNT(*) as v FROM orders WHERE status = 'EN_ATTENTE'").get() as { v: number }
  ).v;
  const outOfStockProducts = (
    db.prepare('SELECT COUNT(*) as v FROM products WHERE stock = 0').get() as { v: number }
  ).v;

  const salesByDay = db
    .prepare(`
      SELECT substr(created_at, 1, 10) as date, COALESCE(SUM(total_mad), 0) as revenue, COUNT(*) as orders
      FROM orders
      WHERE status != 'ANNULEE'
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date ASC
      LIMIT 14
    `)
    .all();

  const ordersByStatus = db
    .prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status')
    .all();

  res.json({
    totalRevenueMad,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    outOfStockProducts,
    salesByDay,
    ordersByStatus,
  });
});

app.post('/api/admin/upload', requireAdmin, (req, res) => {
  const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
  if (!dataUrl || typeof dataUrl !== 'string') {
    res.status(400).json({ error: 'Fichier image requis.' });
    return;
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    res.status(400).json({ error: 'Format supporté : PNG, JPG ou WEBP.' });
    return;
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buf = Buffer.from(match[2], 'base64');
  if (buf.length > 3 * 1024 * 1024) {
    res.status(400).json({ error: 'Image trop volumineuse (max 3 Mo).' });
    return;
  }
  const safeBase = (filename || 'product').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'product';
  const outName = `${safeBase}_${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, outName), buf);
  res.status(201).json({ url: `/uploads/${outName}` });
});

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(`
      SELECT p.*, c.name_fr as category_name_fr, c.slug as category_slug
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.id DESC
    `)
    .all() as Record<string, unknown>[];
  res.json({ products: rows.map(mapProductRow) });
});

app.post('/api/admin/products', requireAdmin, (req, res, next) => {
  try {
    const p = productWriteSchema.parse(req.body);
    const ins = db
      .prepare(`
        INSERT INTO products (
          slug, category_id, brand, sku, name_fr, name_ar, short_desc_fr, short_desc_ar,
          description_fr, description_ar, specs_json, variants_json, price_mad, old_price_mad,
          stock, images_json, is_featured, is_bestseller, is_new, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
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
        p.old_price_mad ?? null,
        p.stock,
        JSON.stringify(p.images),
        p.is_featured ? 1 : 0,
        p.is_bestseller ? 1 : 0,
        p.is_new ? 1 : 0,
        p.is_active ? 1 : 0
      );
    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(ins.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ product: mapProductRow(created) });
  } catch (err) {
    next(err);
  }
});

app.put('/api/admin/products/:id', requireAdmin, (req, res, next) => {
  try {
    const p = productWriteSchema.parse(req.body);
    db.prepare(`
      UPDATE products SET
        slug = ?, category_id = ?, brand = ?, sku = ?, name_fr = ?, name_ar = ?,
        short_desc_fr = ?, short_desc_ar = ?, description_fr = ?, description_ar = ?,
        specs_json = ?, variants_json = ?, price_mad = ?, old_price_mad = ?,
        stock = ?, images_json = ?, is_featured = ?, is_bestseller = ?, is_new = ?,
        is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
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
      p.old_price_mad ?? null,
      p.stock,
      JSON.stringify(p.images),
      p.is_featured ? 1 : 0,
      p.is_bestseller ? 1 : 0,
      p.is_new ? 1 : 0,
      p.is_active ? 1 : 0,
      Number(req.params.id)
    );
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id)) as Record<
      string,
      unknown
    >;
    res.json({ product: mapProductRow(updated) });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true });
  } catch {
    // If referenced in existing order_items, softly deactivate instead of breaking order history
    db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(Number(req.params.id));
    res.json({ ok: true, deactivated: true });
  }
});

app.get('/api/admin/categories', requireAdmin, (_req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
  res.json({ categories });
});

app.post('/api/admin/categories', requireAdmin, (req, res, next) => {
  try {
    const c = categoryWriteSchema.parse(req.body);
    const ins = db
      .prepare(
        'INSERT INTO categories (slug, name_fr, name_ar, parent_id, description_fr, description_ar, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        c.slug,
        c.name_fr,
        c.name_ar,
        c.parent_id ?? null,
        c.description_fr,
        c.description_ar,
        c.image_url,
        c.sort_order
      );
    res.status(201).json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(ins.lastInsertRowid)) });
  } catch (err) {
    next(err);
  }
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res, next) => {
  try {
    const c = categoryWriteSchema.parse(req.body);
    db.prepare(
      'UPDATE categories SET slug = ?, name_fr = ?, name_ar = ?, parent_id = ?, description_fr = ?, description_ar = ?, image_url = ?, sort_order = ? WHERE id = ?'
    ).run(
      c.slug,
      c.name_fr,
      c.name_ar,
      c.parent_id ?? null,
      c.description_fr,
      c.description_ar,
      c.image_url,
      c.sort_order,
      Number(req.params.id)
    );
    res.json({ category: db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(req.params.id)) });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const count = (
    db.prepare('SELECT COUNT(*) as cnt FROM products WHERE category_id = ?').get(Number(req.params.id)) as {
      cnt: number;
    }
  ).cnt;
  if (count > 0) {
    res.status(400).json({ error: 'Impossible de supprimer une catégorie contenant des produits.' });
    return;
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as Record<string, unknown>[];
  const enriched = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(Number(o.id)),
    timeline: db.prepare('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC').all(Number(o.id)),
  }));
  res.json({ orders: enriched });
});

app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const status = String(req.body?.status || '');
  const note = String(req.body?.note || '').trim();
  const validStatuses = [
    'EN_ATTENTE',
    'CONFIRMEE',
    'EN_PREPARATION',
    'EXPEDIEE',
    'EN_COURS_LIVRAISON',
    'LIVREE',
    'ANNULEE',
  ];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Statut de commande invalide.' });
    return;
  }
  const orderId = Number(req.params.id);
  const paymentStatus = status === 'LIVREE' ? 'PAID' : 'PENDING';
  db.prepare('UPDATE orders SET status = ?, payment_status = ?, updated_at = datetime("now") WHERE id = ?').run(
    status,
    paymentStatus,
    orderId
  );
  db.prepare('INSERT INTO order_timeline (order_id, status, note) VALUES (?, ?, ?)').run(
    orderId,
    status,
    note || `Statut mis à jour : ${status}`
  );
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown>;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const timeline = db.prepare('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC').all(orderId);
  res.json({ order: { ...updated, items, timeline } });
});

app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const customers = db
    .prepare(`
      SELECT u.id, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at,
        COUNT(o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status != 'ANNULEE' THEN o.total_mad ELSE 0 END), 0) as total_spent_mad
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'CLIENT'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)
    .all();
  res.json({ customers });
});

app.put('/api/admin/customers/:id/toggle', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  db.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ? AND role = ?').run(
    userId,
    'CLIENT'
  );
  const updated = db
    .prepare('SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE id = ?')
    .get(userId);
  res.json({ customer: updated });
});

app.get('/api/admin/promos', requireAdmin, (_req, res) => {
  const promos = db.prepare('SELECT * FROM promo_codes ORDER BY id DESC').all();
  res.json({ promos });
});

app.post('/api/admin/promos', requireAdmin, (req, res, next) => {
  try {
    const p = promoWriteSchema.parse(req.body);
    const ins = db
      .prepare(
        'INSERT INTO promo_codes (code, discount_type, discount_value, min_order_mad, max_uses, is_active, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        p.code,
        p.discount_type,
        p.discount_value,
        p.min_order_mad,
        p.max_uses,
        p.is_active ? 1 : 0,
        p.expires_at ?? null
      );
    res.status(201).json({ promo: db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(Number(ins.lastInsertRowid)) });
  } catch (err) {
    next(err);
  }
});

app.put('/api/admin/promos/:id/toggle', requireAdmin, (req, res) => {
  db.prepare('UPDATE promo_codes SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(
    Number(req.params.id)
  );
  res.json({ ok: true });
});

app.delete('/api/admin/promos/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM promo_codes WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/admin/banners', requireAdmin, (_req, res) => {
  res.json({ banners: db.prepare('SELECT * FROM banners ORDER BY id DESC').all() });
});

app.put('/api/admin/banners/:id', requireAdmin, (req, res) => {
  const { title_fr, title_ar, subtitle_fr, subtitle_ar, cta_label_fr, cta_label_ar, cta_link, image_url, is_active } =
    req.body;
  db.prepare(`
    UPDATE banners SET
      title_fr = ?, title_ar = ?, subtitle_fr = ?, subtitle_ar = ?,
      cta_label_fr = ?, cta_label_ar = ?, cta_link = ?, image_url = ?, is_active = ?
    WHERE id = ?
  `).run(
    title_fr,
    title_ar,
    subtitle_fr,
    subtitle_ar,
    cta_label_fr,
    cta_label_ar,
    cta_link,
    image_url,
    is_active ? 1 : 0,
    Number(req.params.id)
  );
  res.json({ banner: db.prepare('SELECT * FROM banners WHERE id = ?').get(Number(req.params.id)) });
});

app.get('/api/admin/shipping-zones', requireAdmin, (_req, res) => {
  res.json({ zones: db.prepare('SELECT * FROM shipping_zones ORDER BY city ASC').all() });
});

app.put('/api/admin/shipping-zones/:id', requireAdmin, (req, res) => {
  const { fee_mad, free_threshold_mad, estimated_days } = req.body;
  db.prepare('UPDATE shipping_zones SET fee_mad = ?, free_threshold_mad = ?, estimated_days = ? WHERE id = ?').run(
    Number(fee_mad),
    Number(free_threshold_mad),
    String(estimated_days),
    Number(req.params.id)
  );
  res.json({ zone: db.prepare('SELECT * FROM shipping_zones WHERE id = ?').get(Number(req.params.id)) });
});

// ---------------------------------------------------------------------------
// Centralized Error Handler
// ---------------------------------------------------------------------------
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[CasaVente API Error]', err);
  if (err && typeof err === 'object' && 'issues' in err) {
    const zodErr = err as { issues: { message: string }[] };
    res.status(400).json({ error: zodErr.issues[0]?.message || 'Données invalides.' });
    return;
  }
  const message = err instanceof Error ? err.message : 'Erreur interne du serveur.';
  if (message.includes('UNIQUE constraint failed')) {
    res.status(409).json({ error: 'Cette valeur existe déjà (slug, SKU ou e-mail en double).' });
    return;
  }
  res.status(500).json({ error: message });
});

// ---------------------------------------------------------------------------
// Vite Middleware (Dev) or Static Build (Prod)
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CasaVente server listening on http://localhost:${PORT}`);
  });
}

startServer();

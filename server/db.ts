import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dbPath = process.env.SQLITE_DB_PATH || path.resolve('data', 'casavente.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'ADMIN')),
    is_active INTEGER NOT NULL DEFAULT 1,
    reset_token_hash TEXT,
    reset_token_expires TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    street_address TEXT NOT NULL,
    notes TEXT DEFAULT '',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description_fr TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    short_desc_fr TEXT NOT NULL,
    short_desc_ar TEXT NOT NULL,
    description_fr TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    specs_json TEXT NOT NULL DEFAULT '[]',
    variants_json TEXT NOT NULL DEFAULT '[]',
    price_mad REAL NOT NULL,
    old_price_mad REAL,
    stock INTEGER NOT NULL DEFAULT 0,
    images_json TEXT NOT NULL DEFAULT '[]',
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_bestseller INTEGER NOT NULL DEFAULT 0,
    is_new INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    rating_avg REAL NOT NULL DEFAULT 4.8,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
    discount_value REAL NOT NULL,
    min_order_mad REAL NOT NULL DEFAULT 0,
    max_uses INTEGER NOT NULL DEFAULT 1000,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT
  );

  CREATE TABLE IF NOT EXISTS shipping_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL UNIQUE,
    zone_name TEXT NOT NULL,
    fee_mad REAL NOT NULL,
    free_threshold_mad REAL NOT NULL DEFAULT 600,
    estimated_days TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_fr TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    subtitle_fr TEXT NOT NULL,
    subtitle_ar TEXT NOT NULL,
    cta_label_fr TEXT NOT NULL,
    cta_label_ar TEXT NOT NULL,
    cta_link TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    street_address TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('STANDARD', 'EXPRESS', 'PICKUP_CASA')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('COD', 'ONLINE_GATEWAY')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    status TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (
      status IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'EN_COURS_LIVRAISON', 'LIVREE', 'ANNULEE')
    ),
    subtotal_mad REAL NOT NULL,
    shipping_mad REAL NOT NULL,
    discount_mad REAL NOT NULL DEFAULT 0,
    promo_code TEXT,
    total_mad REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    product_image TEXT NOT NULL,
    variant_label TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_mad REAL NOT NULL,
    line_total_mad REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Ensure any previously seeded or saved image paths resolve via /images/* in production builds
db.exec(`
  UPDATE products SET images_json = REPLACE(images_json, '/src/assets/images/', '/images/') WHERE images_json LIKE '%/src/assets/images/%';
  UPDATE categories SET image_url = REPLACE(image_url, '/src/assets/images/', '/images/') WHERE image_url LIKE '%/src/assets/images/%';
  UPDATE banners SET image_url = REPLACE(image_url, '/src/assets/images/', '/images/') WHERE image_url LIKE '%/src/assets/images/%';
  UPDATE order_items SET product_image = REPLACE(product_image, '/src/assets/images/', '/images/') WHERE product_image LIKE '%/src/assets/images/%';
`);

export function mapProductRow(row: Record<string, unknown>) {
  return {
    ...row,
    specs: JSON.parse(String(row.specs_json || '[]')),
    variants: JSON.parse(String(row.variants_json || '[]')),
    images: JSON.parse(String(row.images_json || '[]')),
  };
}

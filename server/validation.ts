import { z } from 'zod';

export const moroccanPhoneRegex = /^(\+212|0)([5-7])\d{8}$/;

export function normalizeMoroccanPhone(input: string): string {
  return input.replace(/[\s.-]/g, '');
}

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'Nom complet requis (min. 2 caractères)').max(100),
  email: z.string().trim().email('Adresse e-mail invalide').max(150).toLowerCase(),
  phone: z
    .string()
    .trim()
    .transform(normalizeMoroccanPhone)
    .refine((val) => moroccanPhoneRegex.test(val), {
      message: 'Numéro marocain invalide (ex: +212612345678 ou 0612345678)',
    }),
  password: z
    .string()
    .min(8, 'Mot de passe de 8 caractères minimum')
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide').toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .transform(normalizeMoroccanPhone)
    .refine((val) => moroccanPhoneRegex.test(val), {
      message: 'Numéro marocain invalide',
    }),
});

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(40),
  full_name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .transform(normalizeMoroccanPhone)
    .refine((val) => moroccanPhoneRegex.test(val), {
      message: 'Numéro marocain invalide',
    }),
  city: z.string().trim().min(2).max(60),
  neighborhood: z.string().trim().min(2).max(80),
  street_address: z.string().trim().min(5).max(200),
  notes: z.string().trim().max(300).optional().default(''),
  is_default: z.boolean().optional().default(false),
});

export const orderCreateSchema = z.object({
  customer_name: z.string().trim().min(2, 'Nom complet requis').max(100),
  customer_phone: z
    .string()
    .trim()
    .transform(normalizeMoroccanPhone)
    .refine((val) => moroccanPhoneRegex.test(val), {
      message: 'Numéro de téléphone marocain invalide (ex: +2126XXXXXXXX)',
    }),
  customer_email: z.string().trim().email('E-mail invalide').max(150),
  city: z.string().trim().min(2, 'Ville requise').max(60),
  neighborhood: z.string().trim().min(2, 'Quartier requis').max(80),
  street_address: z.string().trim().min(5, 'Adresse complète requise').max(220),
  notes: z.string().trim().max(300).optional().default(''),
  delivery_mode: z.enum(['STANDARD', 'EXPRESS', 'PICKUP_CASA']),
  payment_method: z.enum(['COD', 'ONLINE_GATEWAY']),
  promo_code: z.string().trim().max(30).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        variantLabel: z.string().max(120).optional().default(''),
        quantity: z.number().int().min(1).max(25),
      })
    )
    .min(1, 'Votre panier est vide'),
});

export const reviewCreateSchema = z.object({
  author_name: z.string().trim().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, 'Votre avis doit contenir au moins 5 caractères').max(600),
});

export const productWriteSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  category_id: z.number().int().positive(),
  brand: z.string().trim().min(1).max(60),
  sku: z.string().trim().min(2).max(40),
  name_fr: z.string().trim().min(2).max(160),
  name_ar: z.string().trim().min(2).max(160),
  short_desc_fr: z.string().trim().min(4).max(260),
  short_desc_ar: z.string().trim().min(4).max(260),
  description_fr: z.string().trim().min(10).max(4000),
  description_ar: z.string().trim().min(10).max(4000),
  specs: z.array(z.object({ label_fr: z.string(), label_ar: z.string(), value: z.string() })).default([]),
  variants: z.array(z.object({ name_fr: z.string(), name_ar: z.string(), options: z.array(z.string()) })).default([]),
  price_mad: z.number().positive(),
  old_price_mad: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  images: z.array(z.string().min(1)).min(1),
  is_featured: z.boolean().optional().default(false),
  is_bestseller: z.boolean().optional().default(false),
  is_new: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

export const categoryWriteSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name_fr: z.string().trim().min(2).max(100),
  name_ar: z.string().trim().min(2).max(100),
  parent_id: z.number().int().positive().nullable().optional(),
  description_fr: z.string().trim().max(400).default(''),
  description_ar: z.string().trim().max(400).default(''),
  image_url: z.string().trim().max(500).default(''),
  sort_order: z.number().int().min(0).default(0),
});

export const promoWriteSchema = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase(),
  discount_type: z.enum(['PERCENT', 'FIXED']),
  discount_value: z.number().positive(),
  min_order_mad: z.number().min(0).default(0),
  max_uses: z.number().int().positive().default(500),
  is_active: z.boolean().default(true),
  expires_at: z.string().nullable().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().max(30).optional().default(''),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(2000),
});

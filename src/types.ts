export type Language = 'fr' | 'ar';
export type UserRole = 'CLIENT' | 'ADMIN';
export type OrderStatus =
  | 'EN_ATTENTE'
  | 'CONFIRMEE'
  | 'EN_PREPARATION'
  | 'EXPEDIEE'
  | 'EN_COURS_LIVRAISON'
  | 'LIVREE'
  | 'ANNULEE';

export type DeliveryMode = 'STANDARD' | 'EXPRESS' | 'PICKUP_CASA';
export type PaymentMethod = 'COD' | 'ONLINE_GATEWAY';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  full_name: string;
  phone: string;
  city: string;
  neighborhood: string;
  street_address: string;
  notes?: string;
  is_default: number;
}

export interface Category {
  id: number;
  slug: string;
  name_fr: string;
  name_ar: string;
  parent_id: number | null;
  description_fr: string;
  description_ar: string;
  image_url: string;
  sort_order: number;
  product_count?: number;
}

export interface ProductSpec {
  label_fr: string;
  label_ar: string;
  value: string;
}

export interface ProductVariantGroup {
  name_fr: string;
  name_ar: string;
  options: string[];
}

export interface Product {
  id: number;
  slug: string;
  category_id: number;
  category_slug?: string;
  category_name_fr?: string;
  category_name_ar?: string;
  brand: string;
  sku: string;
  name_fr: string;
  name_ar: string;
  short_desc_fr: string;
  short_desc_ar: string;
  description_fr: string;
  description_ar: string;
  specs: ProductSpec[];
  variants: ProductVariantGroup[];
  price_mad: number;
  old_price_mad: number | null;
  stock: number;
  images: string[];
  is_featured: number;
  is_bestseller: number;
  is_new: number;
  is_active: number;
  rating_avg: number;
  review_count: number;
  created_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_order_mad: number;
  max_uses: number;
  used_count: number;
  is_active: number;
  expires_at: string | null;
}

export interface ShippingZone {
  id: number;
  city: string;
  zone_name: string;
  fee_mad: number;
  free_threshold_mad: number;
  estimated_days: string;
}

export interface Banner {
  id: number;
  title_fr: string;
  title_ar: string;
  subtitle_fr: string;
  subtitle_ar: string;
  cta_label_fr: string;
  cta_label_ar: string;
  cta_link: string;
  image_url: string;
  is_active: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  variant_label: string;
  quantity: number;
  unit_price_mad: number;
  line_total_mad: number;
}

export interface OrderTimelineEntry {
  id: number;
  order_id: number;
  status: OrderStatus;
  note: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city: string;
  neighborhood: string;
  street_address: string;
  notes: string;
  delivery_mode: DeliveryMode;
  payment_method: PaymentMethod;
  payment_status: string;
  status: OrderStatus;
  subtotal_mad: number;
  shipping_mad: number;
  discount_mad: number;
  promo_code: string | null;
  total_mad: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  timeline?: OrderTimelineEntry[];
}

export interface CartItem {
  productId: number;
  slug: string;
  name_fr: string;
  name_ar: string;
  price_mad: number;
  old_price_mad: number | null;
  image: string;
  variantLabel: string;
  quantity: number;
  stock: number;
}

export interface AdminStats {
  totalRevenueMad: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  outOfStockProducts: number;
  salesByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
}

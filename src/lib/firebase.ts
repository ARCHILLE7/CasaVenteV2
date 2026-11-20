import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Banner, Category, Order, Product, ShippingZone } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

function clip(value: string | null | undefined, max: number, fallback = ''): string {
  const v = (value ?? fallback).trim();
  return v.slice(0, max);
}

export async function syncUserProfileToFirestore(fbUser: FirebaseUser, phone = ''): Promise<void> {
  if (!fbUser.uid || !fbUser.emailVerified) return;
  const publicPath = `users/${fbUser.uid}`;
  const privatePath = `users/${fbUser.uid}/private/profile`;
  const displayName = clip(fbUser.displayName || fbUser.email?.split('@')[0], 100, 'Client CasaVente');

  try {
    const batch = writeBatch(db);
    batch.set(
      doc(db, 'users', fbUser.uid),
      {
        displayName,
        role: 'CLIENT',
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      doc(db, 'users', fbUser.uid, 'private', 'profile'),
      {
        userId: fbUser.uid,
        email: clip(fbUser.email, 160, 'client@casavente.ma'),
        full_name: clip(fbUser.displayName || displayName, 120, 'Client CasaVente'),
        phone: clip(phone, 24),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${publicPath} | ${privatePath}`);
  }
}

export async function loadWishlistFromFirestore(uid: string): Promise<number[]> {
  const path = `users/${uid}/wishlist`;
  try {
    const q = query(collection(db, 'users', uid, 'wishlist'), where('userId', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => Number(d.data().productId))
      .filter((id) => Number.isFinite(id) && id > 0);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function syncWishlistItemToFirestore(uid: string, productId: number, add: boolean): Promise<void> {
  const path = `users/${uid}/wishlist/${productId}`;
  try {
    const ref = doc(db, 'users', uid, 'wishlist', String(productId));
    if (add) {
      await setDoc(ref, {
        userId: uid,
        productId,
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(ref);
    }
  } catch (error) {
    handleFirestoreError(error, add ? OperationType.CREATE : OperationType.DELETE, path);
  }
}

export async function syncOrderToFirestore(uid: string, order: Order): Promise<void> {
  const safeOrderId = order.order_number.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
  const path = `orders/${safeOrderId}`;
  try {
    const batch = writeBatch(db);
    const orderRef = doc(db, 'orders', safeOrderId);
    batch.set(orderRef, {
      order_number: clip(order.order_number, 40),
      userId: uid,
      customer_name: clip(order.customer_name, 120),
      customer_phone: clip(order.customer_phone, 24),
      customer_email: clip(order.customer_email, 160),
      city: clip(order.city, 60),
      neighborhood: clip(order.neighborhood, 80),
      street_address: clip(order.street_address, 240),
      notes: clip(order.notes, 400),
      delivery_mode: order.delivery_mode,
      payment_method: order.payment_method,
      payment_status: clip(order.payment_status, 32, 'PENDING'),
      status: 'EN_ATTENTE',
      subtotal_mad: Number(order.subtotal_mad) || 0,
      shipping_mad: Number(order.shipping_mad) || 0,
      discount_mad: Number(order.discount_mad) || 0,
      promo_code: order.promo_code ? clip(order.promo_code, 40) : null,
      total_mad: Number(order.total_mad) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    (order.items || []).forEach((item, index) => {
      const itemRef = doc(db, 'orders', safeOrderId, 'items', `item-${index + 1}`);
      batch.set(itemRef, {
        orderId: safeOrderId,
        userId: uid,
        productId: Number(item.product_id) || 1,
        product_name: clip(item.product_name, 200, 'Produit CasaVente'),
        product_image: clip(item.product_image, 500),
        variant_label: clip(item.variant_label, 120),
        quantity: Math.max(1, Math.min(999, Number(item.quantity) || 1)),
        unit_price_mad: Number(item.unit_price_mad) || 0,
        line_total_mad: Number(item.line_total_mad) || 0,
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCatalogToFirestore(
  categories: Category[],
  products: Product[],
  banners: Banner[],
  shippingZones: ShippingZone[]
): Promise<number> {
  const path = 'products';
  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const c of categories) {
      batch.set(doc(db, 'categories', String(c.id)), {
        slug: clip(c.slug, 100),
        name_fr: clip(c.name_fr, 120),
        name_ar: clip(c.name_ar, 120),
        description_fr: clip(c.description_fr, 500),
        description_ar: clip(c.description_ar, 500),
        image_url: clip(c.image_url, 500),
        sort_order: Number(c.sort_order) || 0,
        is_active: true,
      });
      count++;
    }

    for (const p of products) {
      const imgs = (p.images && p.images.length > 0 ? p.images : ['/images/hero_casavente_showcase_1794670919753.jpg'])
        .slice(0, 10)
        .map((img) => clip(img, 500));
      batch.set(doc(db, 'products', String(p.id)), {
        slug: clip(p.slug, 140),
        category_id: Number(p.category_id) || 1,
        brand: clip(p.brand, 80, 'CasaVente'),
        sku: clip(p.sku, 64, `SKU-${p.id}`),
        name_fr: clip(p.name_fr, 200),
        name_ar: clip(p.name_ar, 200),
        short_desc_fr: clip(p.short_desc_fr, 400),
        short_desc_ar: clip(p.short_desc_ar, 400),
        price_mad: Number(p.price_mad) || 0,
        old_price_mad: p.old_price_mad != null ? Number(p.old_price_mad) : null,
        stock: Math.max(0, Number(p.stock) || 0),
        images: imgs,
        is_featured: Boolean(p.is_featured),
        is_bestseller: Boolean(p.is_bestseller),
        is_new: Boolean(p.is_new),
        is_active: Boolean(p.is_active),
        rating_avg: Number(p.rating_avg) || 4.8,
        review_count: Math.max(0, Number(p.review_count) || 0),
        updatedAt: serverTimestamp(),
      });
      count++;
    }

    for (const b of banners) {
      batch.set(doc(db, 'banners', String(b.id)), {
        title_fr: clip(b.title_fr, 160),
        title_ar: clip(b.title_ar, 160),
        subtitle_fr: clip(b.subtitle_fr, 300),
        subtitle_ar: clip(b.subtitle_ar, 300),
        cta_label_fr: clip(b.cta_label_fr, 80),
        cta_label_ar: clip(b.cta_label_ar, 80),
        cta_link: clip(b.cta_link, 200),
        image_url: clip(b.image_url, 500),
        is_active: Boolean(b.is_active),
      });
      count++;
    }

    for (const z of shippingZones) {
      batch.set(doc(db, 'shippingZones', String(z.id)), {
        city: clip(z.city, 60),
        zone_name: clip(z.zone_name, 80),
        fee_mad: Number(z.fee_mad) || 0,
        free_threshold_mad: Number(z.free_threshold_mad) || 0,
        estimated_days: clip(z.estimated_days, 40),
      });
      count++;
    }

    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

import assert from 'node:assert/strict';

export interface DirtyDozenCase {
  id: string;
  targetPath: string;
  actorUid: string | null;
  emailVerified: boolean;
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 'DD-01-shadow-field-private-profile',
    targetPath: '/users/uid1/private/profile',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {
      userId: 'uid1',
      email: 'client@casavente.ma',
      full_name: 'Salma Bennani',
      phone: '+212612345678',
      isAdmin: true,
      updatedAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02-identity-spoofing-order',
    targetPath: '/orders/CV-2026-9999',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {
      order_number: 'CV-2026-9999',
      userId: 'uid2',
      status: 'EN_ATTENTE',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03-unverified-admin-email-spoof',
    targetPath: '/products/99',
    actorUid: 'uid-attacker',
    emailVerified: false,
    payload: {
      slug: 'fake-item',
      name_fr: 'Fake',
      is_active: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04-role-escalation-user-doc',
    targetPath: '/users/uid1',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {
      displayName: 'Attacker',
      role: 'ADMIN',
      createdAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05-id-poisoning',
    targetPath: `/users/${'a'.repeat(140)}`,
    actorUid: 'uid1',
    emailVerified: true,
    payload: { displayName: 'LongId', role: 'CLIENT' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06-oversized-review-comment',
    targetPath: '/products/1/reviews/rev1',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {
      productId: '1',
      userId: 'uid1',
      author_name: 'Karim',
      rating: 5,
      comment: 'x'.repeat(1500),
      createdAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07-state-shortcut-order-price',
    targetPath: '/orders/CV-2026-1041',
    actorUid: 'uid1',
    emailVerified: true,
    payload: { total_mad: 1, status: 'LIVREE' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08-terminal-order-mutation',
    targetPath: '/orders/CV-2026-1041',
    actorUid: 'uid1',
    emailVerified: true,
    payload: { notes: 'Change after delivery', updatedAt: 'SERVER_TIME' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09-orphaned-order-item',
    targetPath: '/orders/CV-NON-EXISTENT/items/item1',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {
      orderId: 'CV-NON-EXISTENT',
      userId: 'uid1',
      productId: 1,
      product_name: 'Test',
      quantity: 1,
      unit_price_mad: 100,
      line_total_mad: 100,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10-orphaned-product-review',
    targetPath: '/products/999999/reviews/rev1',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {
      productId: '999999',
      userId: 'uid1',
      author_name: 'Karim',
      rating: 5,
      comment: 'Orphaned review',
      createdAt: 'SERVER_TIME',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11-timestamp-forgery',
    targetPath: '/users/uid1/wishlist/1',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {
      userId: 'uid1',
      productId: 1,
      createdAt: '1999-01-01T00:00:00.000Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12-unscoped-order-list-scrape',
    targetPath: '/orders',
    actorUid: 'uid1',
    emailVerified: true,
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
];

assert.equal(DIRTY_DOZEN_PAYLOADS.length, 12, 'Dirty Dozen suite must contain 12 adversarial payloads');

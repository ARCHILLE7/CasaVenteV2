# CasaVente Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Any path not explicitly matched under `/databases/{database}/documents` is denied (`allow read, write: if false;`).
2. **PII Isolation**: User email, Moroccan phone number, and street addresses NEVER reside on `/users/{userId}`. They are stored exclusively in `/users/{userId}/private/{docId}` and `/users/{userId}/addresses/{addressId}`, readable only by the verified owner or an admin.
3. **Immutable Ownership & Timestamps**: `userId` and `createdAt` cannot be modified after document creation; `createdAt` and `updatedAt` must equal `request.time`.
4. **Master Gate on Subcollections**: `/orders/{orderId}/items/{itemId}` and `/products/{productId}/reviews/{reviewId}` verify parent existence (`exists(...)` / `get(...)`) and parent ownership where applicable.
5. **Terminal Order Locking**: Once an order's `status` reaches `'LIVREE'` or `'ANNULEE'`, non-admin clients cannot update it.
6. **Privilege Escalation Prevention**: Users cannot assign `role: 'ADMIN'` on `/users/{userId}` or create records in `/admins/{userId}` unless they are the verified bootstrapped admin (`archillevladimir@gmail.com` with `email_verified == true`).
7. **No Blanket List Reads or Unverified Writes**: Every `allow list` validates `resource.data` directly without `get()`/`exists()` O(n) reads, and every client write requires `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on Private Profile**: `{ userId: "uid1", email: "a@b.ma", full_name: "Ali", phone: "+212600000000", isAdmin: true, updatedAt: NOW }` -> DENIED (`keys().hasOnly`).
2. **Identity Spoofing on Order Create**: Signed in as `uid1`, sending `{ ..., userId: "uid2" }` -> DENIED (`data.userId == request.auth.uid`).
3. **Unverified Email Spoofing Admin**: Token `{ email: "archillevladimir@gmail.com", email_verified: false }` -> DENIED (`email_verified == true` required).
4. **Privilege Escalation via User Public Doc**: `{ displayName: "Ali", role: "ADMIN", createdAt: NOW }` -> DENIED (`data.role == 'CLIENT'`).
5. **ID Poisoning**: Document ID > 128 chars or containing `../` or `$` -> DENIED (`isValidId`).
6. **Resource Poisoning (1MB Comment)**: Review with `comment` length > 1000 chars -> DENIED (`comment.size() <= 1000`).
7. **State Shortcutting on Order**: Client updates order `status` directly to `'LIVREE'` or modifies `total_mad` -> DENIED (`affectedKeys().hasOnly(['notes', 'updatedAt'])` for client cancellation/note or admin-only status updates).
8. **Update After Terminal State**: Updating an order whose `existing().status == 'LIVREE'` as non-admin -> DENIED.
9. **Orphaned Order Item**: Creating `/orders/nonexistent/items/1` without parent order -> DENIED (`exists` parent check).
10. **Orphaned Review**: Creating `/products/nonexistent/reviews/1` without parent product -> DENIED (`exists` parent product check).
11. **Timestamp Forgery**: Setting `createdAt` to a client string or past timestamp instead of `request.time` -> DENIED.
12. **Cross-User Order Scraping (`list`)**: Querying `/orders` without `where('userId', '==', auth.uid)` -> DENIED (`resource.data.userId == request.auth.uid`).

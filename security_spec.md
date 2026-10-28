# Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth

1. **Default-Deny Safety Net**: Every path not explicitly matched under `/databases/{database}/documents` is denied (`allow read, write: if false;`).
2. **Path Variable Hardening (`isValidId`)**: Every single-document operation (`get`, `create`, `update`, `delete`) validates its path ID (`productId`, `slotId`, `orderId`, `adminUid`) using `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
3. **PII Isolation (Split Collection Strategy)**:
   - Public real-time slot state in `/rajaSlots/{slotId}` strictly forbids storing customer PII (`customerName`, `customerPhone`, `organization`, `shippingAddress`). It stores only `slotNumber` (1..99), `status` (`available` | `held` | `booked`), `sessionId`, `heldAt`, `heldUntil`, `orderNumber`, and `updatedAt`.
   - Customer PII is isolated in `/orders/{orderId}`. Public `list` scraping on `/orders` is restricted to verified administrators (`isAdmin()`).
4. **Atomic Slot Locking (`RajaSetNumberSlot`)**:
   - `slotNumber` must be an integer in `1..99`.
   - A slot with `status == 'booked'` is terminal for non-admins and cannot be overwritten by another buyer.
   - A slot with `status == 'held'` can only transition to `'booked'` or `'available'` by the holding session, an administrator, or when the 15-minute hold (`heldUntil`) has expired.
5. **Catalog Inventory Integrity (`ProductCatalogItem`)**:
   - `stock` can never be negative (`stock >= 0`) and `price > 0`.
   - Updates to `/products/{productId}` must pass `isValidProductCatalog(incoming())` and only modify allowed inventory fields (`stock`, `bookedCount`, `updatedAt`, `isVisible`, `price`, `name`) via explicit action gates.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on `/rajaSlots/slot-1`**:
   `{ "slotNumber": 1, "status": "held", "sessionId": "s1", "heldAt": 100, "heldUntil": 900, "orderNumber": "", "updatedAt": "2026-10-27T00:00:00Z", "isAdmin": true }` -> Rejected by `data.keys().hasOnly(...)`.
2. **Out-of-Range Slot Number (`/rajaSlots/slot-105`)**:
   `{ "slotNumber": 105, "status": "held", ... }` -> Rejected by `data.slotNumber >= 1 && data.slotNumber <= 99`.
3. **hijacking a Booked Slot (`/rajaSlots/slot-9`)**:
   Updating a slot where `existing().status == 'booked'` to `status: 'held'` as a non-admin -> Rejected by terminal state lock `existing().status != 'booked' || isAdmin()`.
4. **Negative Stock Injection (`/products/prod-ch2`)**:
   Updating `stock: -5` -> Rejected by `data.stock >= 0`.
5. **Price Tampering During Stock Deduction (`/products/prod-ch3`)**:
   Updating `stock` and `price: 1` simultaneously as a buyer -> Rejected by `affectedKeys().hasOnly(['stock', 'bookedCount', 'updatedAt'])` and `incoming().price == existing().price`.
6. **Oversized String DoW Attack (`/orders/ord-1`)**:
   `customerName` with 5,000 characters -> Rejected by `data.customerName.size() <= 120`.
7. **Invalid Payment Status Enum (`/orders/ord-1`)**:
   `paymentStatus: "free_bypass"` -> Rejected by `data.paymentStatus in ['pending_verification', 'verified_paid', 'payment_rejected']`.
8. **Unauthorized Order List Scraping (`list /orders`)**:
   Unauthenticated or non-admin client querying all orders -> Rejected by `allow list: if isAdmin();`.
9. **ID Poisoning Attack (`/products/bad$id!`)**:
   Path ID containing special characters -> Rejected by `isValidId(productId)`.
10. **Self-Assigned Admin Escalation (`create /admins/attacker`)**:
    Creating an admin document without existing admin privilege -> Rejected by `allow write: if false;`.
11. **Immutable Field Mutation (`update /orders/ord-1`)**:
    Changing `orderNumber` or `createdAt` during an order status update -> Rejected by `incoming().orderNumber == existing().orderNumber && incoming().createdAt == existing().createdAt`.
12. **Unverified Admin Email Spoofing**:
    Attempting admin actions with `email == 'subdivision513@gmail.com'` but `email_verified == false` -> Rejected by `request.auth.token.email_verified == true`.

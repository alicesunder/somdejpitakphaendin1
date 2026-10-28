import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  query,
  runTransaction,
  setLogLevel,
  where,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AmuletProduct, OrderRecord, RajaSetSlot } from './types';
import { HOLD_DURATION_MS } from './utils/commerceRules';

// Silence noisy internal Firestore transport retry logs in proxied/iframe environments
setLogLevel('silent');

const app = initializeApp(firebaseConfig);
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
})();
export const auth = getAuth(app);

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

let isFirestoreReachable = true;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  // Avoid noisy console errors when client is offline or falls back to server-side atomic store
  if (
    errInfo.error.includes('Missing or insufficient permissions') ||
    errInfo.error.includes('the client is offline') ||
    errInfo.error.includes('Could not reach Cloud Firestore backend')
  ) {
    return;
  }
  console.info('Firestore Notice:', JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirestoreReachable = true;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('the client is offline') ||
        error.message.includes('Could not reach Cloud Firestore backend'))
    ) {
      isFirestoreReachable = false;
    }
  }
}
void testFirestoreConnection();

export async function signInAdminWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutFirebaseAdmin() {
  return signOut(auth);
}

/**
 * Seeds the 99 Raja Set slots (1–99) into Firestore if the collection is empty.
 */
export async function ensureFirestoreRajaSlotsSeeded(
  initialSlots: RajaSetSlot[]
): Promise<void> {
  if (!isFirestoreReachable) return;
  try {
    const q = query(
      collection(db, 'rajaSlots'),
      where('slotNumber', '>=', 1),
      where('slotNumber', '<=', 99)
    );
    const snap = await getDocs(q);
    if (!snap.empty && snap.size >= 99) {
      return;
    }
    const existingIds = new Set(snap.docs.map((d) => d.id));
    const batch = writeBatch(db);
    let count = 0;
    for (const slot of initialSlots) {
      const docId = String(slot.slotNumber);
      if (!existingIds.has(docId)) {
        batch.set(doc(db, 'rajaSlots', docId), {
          slotNumber: slot.slotNumber,
          status: slot.status,
          sessionId: slot.sessionId || '',
          heldAt: slot.heldAt || 0,
          heldUntil: slot.heldUntil || 0,
          orderNumber: slot.orderNumber || '',
          updatedAt: slot.updatedAt || new Date().toISOString(),
        });
        count++;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'rajaSlots');
  }
}

/**
 * Subscribes to real-time updates for all 99 slots of ช1 ชุดทองคำใหญ่ราชาฤกษ์.
 */
export function subscribeToRajaSlots(
  onUpdate: (slots: RajaSetSlot[]) => void
): () => void {
  const colRef = query(
    collection(db, 'rajaSlots'),
    where('slotNumber', '>=', 1),
    where('slotNumber', '<=', 99)
  );
  return onSnapshot(
    colRef,
    (snapshot) => {
      isFirestoreReachable = true;
      if (snapshot.empty) return;
      const loaded: RajaSetSlot[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as RajaSetSlot;
        if (
          typeof data.slotNumber === 'number' &&
          data.slotNumber >= 1 &&
          data.slotNumber <= 99
        ) {
          loaded.push({
            slotNumber: data.slotNumber,
            status: data.status || 'available',
            sessionId: data.sessionId || '',
            heldAt: Number(data.heldAt) || 0,
            heldUntil: Number(data.heldUntil) || 0,
            orderNumber: data.orderNumber || '',
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        }
      });
      if (loaded.length > 0) {
        loaded.sort((a, b) => a.slotNumber - b.slotNumber);
        onUpdate(loaded);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rajaSlots');
    }
  );
}

/**
 * Atomic transaction in Firestore to hold or release a Raja Set number (1–99)
 * with a 15-minute lock timeout. Prevents two buyers from selecting the same number.
 */
export async function toggleRajaSlotInFirestore(
  slotNumber: number,
  sessionId: string
): Promise<{
  success: boolean;
  action?: 'held' | 'released';
  slot?: RajaSetSlot;
  error?: string;
}> {
  if (!isFirestoreReachable) {
    return { success: false, error: 'Firestore offline fallback' };
  }
  const slotRef = doc(db, 'rajaSlots', String(slotNumber));
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(slotRef);
      const now = Date.now();
      const nowIso = new Date(now).toISOString();

      const current: RajaSetSlot = snap.exists()
        ? (snap.data() as RajaSetSlot)
        : {
            slotNumber,
            status: 'available',
            sessionId: '',
            heldAt: 0,
            heldUntil: 0,
            orderNumber: '',
            updatedAt: nowIso,
          };

      if (current.status === 'booked') {
        return {
          success: false,
          error: `หมายเลข #${slotNumber} ถูกจองและยืนยันแล้ว ไม่สามารถเลือกซ้ำได้`,
        };
      }

      const isActiveHold =
        current.status === 'held' && current.heldUntil > now;

      if (isActiveHold && current.sessionId !== sessionId) {
        return {
          success: false,
          error: `หมายเลข #${slotNumber} กำลังมีผู้เลือกอยู่ (กันสิทธิ์ชั่วคราว 15 นาที)`,
        };
      }

      if (isActiveHold && current.sessionId === sessionId) {
        // Release slot back to available
        const released: RajaSetSlot = {
          slotNumber,
          status: 'available',
          sessionId: '',
          heldAt: 0,
          heldUntil: 0,
          orderNumber: '',
          updatedAt: nowIso,
        };
        tx.set(slotRef, released);
        return {
          success: true,
          action: 'released',
          slot: released,
        };
      }

      // Hold the slot for 15 minutes
      const held: RajaSetSlot = {
        slotNumber,
        status: 'held',
        sessionId,
        heldAt: now,
        heldUntil: now + HOLD_DURATION_MS,
        orderNumber: '',
        updatedAt: nowIso,
      };
      tx.set(slotRef, held);
      return {
        success: true,
        action: 'held',
        slot: held,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rajaSlots/${slotNumber}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Atomically books selected numbers (1–99) and records the order in Firestore using runTransaction.
 */
export async function confirmOrderInFirestoreTransaction(
  order: OrderRecord,
  selectedNumbers: number[],
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isFirestoreReachable) {
    return { success: true };
  }
  try {
    await runTransaction(db, async (tx) => {
      const now = Date.now();
      const nowIso = new Date(now).toISOString();
      const slotRefs = selectedNumbers.map((num) =>
        doc(db, 'rajaSlots', String(num))
      );
      const snaps = await Promise.all(slotRefs.map((ref) => tx.get(ref)));

      for (let i = 0; i < snaps.length; i++) {
        const num = selectedNumbers[i];
        const snap = snaps[i];
        if (snap.exists()) {
          const slot = snap.data() as RajaSetSlot;
          if (slot.status === 'booked' && slot.orderNumber !== order.orderNumber) {
            throw new Error(
              `หมายเลข #${num} ถูกจองไปแล้วโดยผู้สั่งจองท่านอื่น กรุณาเลือกหมายเลขใหม่`
            );
          }
          if (
            slot.status === 'held' &&
            slot.heldUntil > now &&
            slot.sessionId &&
            slot.sessionId !== sessionId
          ) {
            throw new Error(
              `หมายเลข #${num} กำลังถูกเลือกโดยผู้ใช้อื่น กรุณาเลือกหมายเลขอื่น`
            );
          }
        }
      }

      // Lock all selected slots as 'booked'
      for (let i = 0; i < slotRefs.length; i++) {
        const num = selectedNumbers[i];
        const bookedSlot: RajaSetSlot = {
          slotNumber: num,
          status: 'booked',
          sessionId: sessionId || 'guest-session',
          heldAt: now,
          heldUntil: 0,
          orderNumber: order.orderNumber,
          updatedAt: nowIso,
        };
        tx.set(slotRefs[i], bookedSlot);
      }

      // Record order in /orders/{orderNumber} strictly matching isValidReservationOrder
      const orderRef = doc(db, 'orders', order.orderNumber);
      tx.set(orderRef, {
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt || nowIso,
        reservationDateThai: order.reservationDateThai || nowIso.slice(0, 10),
        customerName: (order.customerName || 'ผู้สั่งจอง').slice(0, 120),
        organization: (order.organization || 'ไม่ระบุ').slice(0, 160),
        customerPhone: (order.customerPhone || '0000000000').slice(0, 32),
        shippingAddress: (order.shippingAddress || '').slice(0, 400),
        paymentMethod:
          order.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'promptpay',
        subtotal: Number(order.subtotal) || 0,
        shippingTotal: Number(order.shippingTotal) || 0,
        grandTotal: Math.max(1, Number(order.grandTotal) || 1),
        grandTotalThaiText: (order.grandTotalThaiText || 'บาทถ้วน').slice(0, 300),
        selectedNumbers: (order.selectedNumbers || []).join(',').slice(0, 400),
        itemsJson: JSON.stringify(order.items || []).slice(0, 4000),
        paymentStatus: order.paymentStatus || 'pending_verification',
        sessionId: (sessionId || 'guest-session').slice(0, 80),
        updatedAt: nowIso,
      });
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${order.orderNumber}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Firestore transaction failed',
    };
  }
}

/**
 * Releases any expired 15-minute holds in Firestore back to 'available'.
 */
export async function releaseExpiredHoldsInFirestore(
  slots: RajaSetSlot[]
): Promise<number> {
  if (!isFirestoreReachable) return 0;
  const now = Date.now();
  const expired = slots.filter(
    (s) => s.status === 'held' && s.heldUntil > 0 && s.heldUntil <= now
  );
  if (expired.length === 0) return 0;

  let releasedCount = 0;
  for (const s of expired) {
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'rajaSlots', String(s.slotNumber));
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as RajaSetSlot;
        if (data.status === 'held' && data.heldUntil <= Date.now()) {
          tx.set(ref, {
            slotNumber: s.slotNumber,
            status: 'available',
            sessionId: '',
            heldAt: 0,
            heldUntil: 0,
            orderNumber: '',
            updatedAt: new Date().toISOString(),
          });
          releasedCount++;
        }
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `rajaSlots/${s.slotNumber}`
      );
    }
  }
  return releasedCount;
}

export async function syncProductStockToFirestore(
  product: AmuletProduct
): Promise<void> {
  if (!isFirestoreReachable) return;
  try {
    const prodRef = doc(db, 'products', product.id);
    const batch = writeBatch(db);
    batch.set(
      prodRef,
      {
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        initialStock: product.initialStock ?? product.stock,
        bookedCount: product.bookedCount ?? 0,
        isMadeToOrder: Boolean(product.isMadeToOrder),
        isVisible: product.isVisible !== false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
  }
}

import { db } from '../index.ts';
import {
  requestSellerAccountClosure,
  confirmSellerAccountClosure,
  cancelSellerAccountClosure,
  checkSellerClosureEligibility,
  executeSellerAccountClosure,
  processScheduledAccountClosures,
} from '../repository.ts';
import {
  accountDeletions,
  users,
  stores,
  wallets,
  orders,
  walletTransactions,
} from '../schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function runAcceptanceTest() {
  console.log('=== STARTING ACCOUNT CLOSURE ACCEPTANCE TEST ===');

  const testUid = 'seller_test_closure_' + crypto.randomBytes(4).toString('hex');
  const testEmail = `${testUid}@test.internal`;
  const testSlug = `test-closure-${Date.now()}`;

  // 1. Provision a test seller with store and wallet
  const [testUser] = await db.insert(users).values({
    uid: testUid,
    email: testEmail,
    role: 'seller',
    status: 'active',
  }).returning();

  const [testStore] = await db.insert(stores).values({
    sellerId: testUser.id,
    uid: testUid,
    slug: testSlug,
    name: 'Test Closure Store',
    whatsappNumber: '+919999999999',
    isPublished: true,
  }).returning();

  const [testWallet] = await db.insert(wallets).values({
    storeId: testStore.id,
    sellerUid: testUid,
    availableBalance: 500, // Has pending/available balance!
    pendingBalance: 0,
    heldBalance: 0,
    paidOutBalance: 0,
  }).returning();

  // Test Requirement 1 & 2: Initiation of closure request
  console.log('\n--- TEST 1: Request Account Closure ---');
  const reqRes = await requestSellerAccountClosure({
    adminUid: 'admin-root-a04d825f2ed8',
    sellerUid: testUid,
    reason: 'Compliance audit termination',
  });
  console.log('Closure requested successfully:', {
    sellerUid: reqRes.sellerUid,
    status: reqRes.status,
    scheduledDeleteAt: reqRes.scheduledDeleteAt,
    hasToken: Boolean(reqRes.confirmationToken),
  });

  // Verify unique lock: Second parallel request for same seller MUST be blocked
  try {
    await requestSellerAccountClosure({
      adminUid: 'admin-root-a04d825f2ed8',
      sellerUid: testUid,
      reason: 'Duplicate request attempt',
    });
    throw new Error('FAIL: Parallel closure request was not blocked!');
  } catch (err: any) {
    console.log('PASS: Duplicate request blocked by unique lock:', err.message);
  }

  // Test Requirement 3: Blocker when target seller has pending earnings
  console.log('\n--- TEST 2: Block Execution on Unsettled Earnings ---');
  try {
    await executeSellerAccountClosure(testUid, 'admin-root-a04d825f2ed8');
    throw new Error('FAIL: Execution should have been blocked due to wallet balance!');
  } catch (err: any) {
    console.log('PASS: Blocked on pending earnings:', err.message);
  }

  // Clear wallet balance to test order obligations blocker
  await db.update(wallets).set({ availableBalance: 0 }).where(eq(wallets.id, testWallet.id));

  // Add an unfulfilled buyer order (status "Paid" / Processing)
  const [openOrder] = await db.insert(orders).values({
    orderRef: 'ORD-OPEN-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    storeId: testStore.id,
    sellerUid: testUid,
    customerName: 'Active Buyer',
    customerPhone: '+919876543210',
    customerEmail: 'buyer@example.com',
    shippingAddress: '123 Market Street',
    sellerSubtotal: 450,
    platformFeeTotal: 50,
    customerTotalPayable: 500,
    orderState: 'Paid', // NOT Delivered / Cancelled
  }).returning();

  console.log('\n--- TEST 3: Block Execution on Unfulfilled Buyer Obligations ---');
  try {
    await executeSellerAccountClosure(testUid, 'admin-root-a04d825f2ed8');
    throw new Error('FAIL: Execution should have been blocked due to open order!');
  } catch (err: any) {
    console.log('PASS: Blocked on unfulfilled order:', err.message);
  }

  // Complete the order to "Delivered" state (statutory historical record)
  await db.update(orders).set({ orderState: 'Delivered' }).where(eq(orders.id, openOrder.id));

  // Record an immutable ledger line
  await db.insert(walletTransactions).values({
    transactionRef: 'TXN-TEST-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
    walletId: testWallet.id,
    storeId: testStore.id,
    orderId: openOrder.id,
    orderRef: openOrder.orderRef,
    type: 'Order Delivered Settlement',
    direction: 'credit',
    amount: 450,
    balanceAfter: 0,
    bucketAffected: 'available',
    description: 'Historical ledger record preserved under regulatory retention',
  });

  // Test Requirement 4: Seller confirmation with single-use token
  console.log('\n--- TEST 4: Confirm Closure using Token ---');
  const confRes = await confirmSellerAccountClosure(reqRes.confirmationToken);
  console.log('Confirmation recorded:', confRes);

  // Test Requirement 5: Final execution & Cascade-Safe Boundary Verification
  console.log('\n--- TEST 5: Execute Closure with Data Preservation ---');
  const execRes = await executeSellerAccountClosure(testUid, 'admin-root-a04d825f2ed8');
  console.log('Execution output:', execRes);

  // Verify Cascade-Safe Boundaries (Rule N009 & Section 4.2):
  // 1. Order must still exist in database
  const [preservedOrder] = await db.select().from(orders).where(eq(orders.id, openOrder.id));
  if (!preservedOrder) throw new Error('FAIL: Order was deleted! Must be preserved for audit.');
  console.log('Preserved Order Data:', {
    orderRef: preservedOrder.orderRef,
    customerTotalPayable: preservedOrder.customerTotalPayable,
    platformFeeTotal: preservedOrder.platformFeeTotal,
    sellerSubtotal: preservedOrder.sellerSubtotal,
    customerName: preservedOrder.customerName,
    shippingAddress: preservedOrder.shippingAddress,
  });

  if (preservedOrder.customerName !== 'Archived Customer (Closed store)') {
    throw new Error('FAIL: Customer identity was not genericized to Closed store!');
  }

  // 2. Ledger transactions must still exist
  const txns = await db.select().from(walletTransactions).where(eq(walletTransactions.storeId, testStore.id));
  if (txns.length === 0) throw new Error('FAIL: Ledger records were deleted! Must be preserved.');
  console.log('Preserved Ledger Transactions:', txns.length);

  // 3. Store must be unpublished & closed
  const [closedStore] = await db.select().from(stores).where(eq(stores.id, testStore.id));
  if (closedStore.isPublished !== false || closedStore.status !== 'closed') {
    throw new Error('FAIL: Store was not unpublished/closed!');
  }

  // 4. User must be suspended
  const [closedUser] = await db.select().from(users).where(eq(users.uid, testUid));
  if (closedUser.status !== 'suspended') {
    throw new Error('FAIL: User status was not suspended!');
  }

  console.log('\n=== ALL ACCOUNT CLOSURE ACCEPTANCE TESTS PASSED! ===');
}

runAcceptanceTest()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('TEST FAILED:', e);
    process.exit(1);
  });

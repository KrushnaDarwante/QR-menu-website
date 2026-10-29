/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../core/store.ts';

test('store resolves valid table token and rejects invalid token', () => {
  const table4 = store.getTableByToken('qrd_tbl_a8f9c2d1e03b4785ca92d6e1fa50c841');
  assert.ok(table4);
  assert.equal(table4.tableNumber, '4');

  const invalid = store.getTableByToken('qrd_tbl_fake_invalid_token_123456');
  assert.equal(invalid, undefined);
});

test('submitting order calculates server pricing and updates table to OCCUPIED', () => {
  const result = store.submitOrder({
    qrToken: 'qrd_tbl_11223344556677889900aabbccddeeff', // Table 3
    customerName: 'Claire',
    paymentMethod: 'ONLINE_GATEWAY',
    tipCents: 200,
    items: [
      {
        menuItemId: 'item_foraged_mushroom_pizza',
        quantity: 1,
        variantId: 'var_crust_sourdough',
      },
    ],
    idempotencyKey: 'test_order_idem_1',
  });

  assert.equal(result.success, true);
  assert.ok(result.order);
  assert.equal(result.order.tableNumber, '3');
  assert.equal(result.order.paymentStatus, 'PAID');
  assert.ok(result.order.totalCents > 1800); // Base price + tax + fee + tip

  // Check table status was updated
  const table3 = store.getTableById('tbl_03');
  assert.equal(table3?.status, 'OCCUPIED');
});

test('idempotency key prevents duplicate orders from being created', () => {
  const first = store.submitOrder({
    qrToken: 'qrd_tbl_5566778899aabbccddeeff0011223344', // Table 5
    paymentMethod: 'CASH',
    items: [{ menuItemId: 'item_handcut_parmesan_fries', quantity: 1 }],
    idempotencyKey: 'idem_duplicate_test_key',
  });

  const duplicate = store.submitOrder({
    qrToken: 'qrd_tbl_5566778899aabbccddeeff0011223344',
    paymentMethod: 'CASH',
    items: [{ menuItemId: 'item_handcut_parmesan_fries', quantity: 1 }],
    idempotencyKey: 'idem_duplicate_test_key',
  });

  assert.equal(first.order?.id, duplicate.order?.id);
  assert.equal(first.order?.orderNumber, duplicate.order?.orderNumber);
});

test('cash collection flow strictly requires cashier or manager authorization', () => {
  // Submit cash order for table 1
  const orderRes = store.submitOrder({
    qrToken: 'qrd_tbl_7fa8e1b93d4c0291e56b82a391c4d0a1',
    customerName: 'Sam',
    paymentMethod: 'CASH',
    items: [{ menuItemId: 'item_handcut_parmesan_fries', quantity: 1 }],
    idempotencyKey: 'idem_cash_test_key',
  });
  assert.ok(orderRes.order);
  const orderId = orderRes.order.id;

  // Verify payment status is PENDING_CASH, NOT PAID
  assert.equal(orderRes.order.paymentStatus, 'PENDING_CASH');

  // Unauthorized attempt by diner
  const unauthorized = store.collectCashPayment(orderId, 'diner_phone', 'PUBLIC_DINER');
  assert.equal(unauthorized.success, false);

  // Authorized collection by cashier
  const authorized = store.collectCashPayment(orderId, 'cashier_elena', 'CASHIER');
  assert.equal(authorized.success, true);
  assert.equal(authorized.order?.paymentStatus, 'PAID');
});

test('86-ing an item blocks subsequent order submissions', () => {
  // Toggle crisp halloumi to unavailable
  const toggleRes = store.toggleItemAvailability('item_crispy_halloumi_bites', 'MANAGER');
  assert.equal(toggleRes.success, true);

  const attemptOrder = store.submitOrder({
    qrToken: 'qrd_tbl_7fa8e1b93d4c0291e56b82a391c4d0a1',
    paymentMethod: 'CASH',
    items: [{ menuItemId: 'item_crispy_halloumi_bites', quantity: 1 }],
    idempotencyKey: `idem_soldout_${Date.now()}`,
  });

  assert.equal(attemptOrder.success, false);
  assert.equal(attemptOrder.error?.code, 'ITEM_SOLD_OUT');

  // Re-enable item
  store.toggleItemAvailability('item_crispy_halloumi_bites', 'MANAGER');
});

test('rotating table QR token invalidates previous token', () => {
  const table1 = store.getTableById('tbl_01')!;
  const originalToken = table1.qrToken;

  const rotateRes = store.rotateTableToken('tbl_01', 'OWNER');
  assert.equal(rotateRes.success, true);
  assert.notEqual(rotateRes.table?.qrToken, originalToken);

  // Old token lookup should now fail
  assert.equal(store.getTableByToken(originalToken), undefined);
  // New token lookup succeeds
  assert.ok(store.getTableByToken(rotateRes.table!.qrToken));
});

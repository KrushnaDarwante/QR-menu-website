/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrder } from '../core/state-machine.ts';

test('order transitions correctly from RECEIVED to ACCEPTED by staff', () => {
  const result = canTransitionOrder('RECEIVED', 'ACCEPTED', 'KITCHEN', 'UNPAID');
  assert.equal(result.allowed, true);
});

test('diner cannot accept their own order', () => {
  const result = canTransitionOrder('RECEIVED', 'ACCEPTED', 'PUBLIC_DINER', 'UNPAID');
  assert.equal(result.allowed, false);
});

test('order transitions from PREPARING to READY by kitchen', () => {
  const result = canTransitionOrder('PREPARING', 'READY', 'KITCHEN', 'UNPAID');
  assert.equal(result.allowed, true);
});

test('order cannot be marked COMPLETED if unpaid', () => {
  const result = canTransitionOrder('SERVED', 'COMPLETED', 'CASHIER', 'UNPAID');
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /Payment has not been confirmed/);
});

test('order CAN be marked COMPLETED when paid', () => {
  const result = canTransitionOrder('SERVED', 'COMPLETED', 'CASHIER', 'PAID');
  assert.equal(result.allowed, true);
});

test('order cannot skip from RECEIVED directly to SERVED', () => {
  const result = canTransitionOrder('RECEIVED', 'SERVED', 'MANAGER', 'UNPAID');
  assert.equal(result.allowed, false);
});

test('ready order cannot be cancelled by cashier without manager/owner override', () => {
  const resultCashier = canTransitionOrder('READY', 'CANCELLED', 'CASHIER', 'UNPAID');
  assert.equal(resultCashier.allowed, false);

  const resultManager = canTransitionOrder('READY', 'CANCELLED', 'MANAGER', 'UNPAID');
  assert.equal(resultManager.allowed, true);
});

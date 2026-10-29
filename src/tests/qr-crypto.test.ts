/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTableQrToken, isValidTableToken } from '../core/qr-crypto.ts';

test('generated QR token matches expected 32 hex format', () => {
  const token = generateTableQrToken();
  assert.equal(isValidTableToken(token), true);
  assert.ok(token.startsWith('qrd_tbl_'));
  assert.equal(token.length, 40); // 'qrd_tbl_' (8) + 32 chars = 40 chars
});

test('subsequent generated QR tokens are unique (128-bit entropy)', () => {
  const set = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const token = generateTableQrToken();
    assert.equal(set.has(token), false);
    set.add(token);
  }
  assert.equal(set.size, 50);
});

test('invalid tokens are rejected by validator', () => {
  assert.equal(isValidTableToken('table_4'), false);
  assert.equal(isValidTableToken('qrd_tbl_123'), false); // too short
  assert.equal(isValidTableToken('qrd_tbl_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'), false); // invalid hex
  assert.equal(isValidTableToken(''), false);
});

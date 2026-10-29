/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTokenFromQrData } from '../core/token-extractor.ts';

const validToken = 'qrd_tbl_a8f9c2d1e03b4785ca92d6e1fa50c841';

test('extracts raw token directly', () => {
  assert.equal(extractTokenFromQrData(validToken), validToken);
});

test('extracts token from full HTTPS URL', () => {
  const url = `https://bistro.qrdine.os/scan?token=${validToken}&source=stand`;
  assert.equal(extractTokenFromQrData(url), validToken);
});

test('extracts token from local dev URL', () => {
  const url = `http://localhost:3000/?token=${validToken}`;
  assert.equal(extractTokenFromQrData(url), validToken);
});

test('extracts token from relative query string', () => {
  assert.equal(extractTokenFromQrData(`?token=${validToken}`), validToken);
});

test('extracts token from embedded text containing qrd_tbl pattern', () => {
  const text = `Welcome to Table 4! Scan verification code: ${validToken} - Enjoy!`;
  assert.equal(extractTokenFromQrData(text), validToken);
});

test('extracts token from JSON payload', () => {
  const jsonStr = JSON.stringify({ action: 'checkin', table: '4', token: validToken });
  assert.equal(extractTokenFromQrData(jsonStr), validToken);
});

test('rejects invalid or corrupted inputs', () => {
  assert.equal(extractTokenFromQrData(''), null);
  assert.equal(extractTokenFromQrData('https://example.com/some/path'), null);
  assert.equal(extractTokenFromQrData('qrd_tbl_too_short'), null);
  assert.equal(extractTokenFromQrData('?token=invalid_characters!'), null);
});

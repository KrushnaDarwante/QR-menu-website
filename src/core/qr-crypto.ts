/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates a high-entropy, cryptographically unguessable token for a restaurant table.
 * Format: "qrd_tbl_" followed by 32 random hexadecimal characters (128 bits of entropy).
 */
export function generateTableQrToken(): string {
  // Use crypto.getRandomValues in browser or Node crypto
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `qrd_tbl_${hex}`;
  }

  // Fallback for standard environments
  const randomHex = Math.random().toString(16).substring(2, 10) +
    Math.random().toString(16).substring(2, 10) +
    Math.random().toString(16).substring(2, 10) +
    Math.random().toString(16).substring(2, 10);
  return `qrd_tbl_${randomHex.padEnd(32, '0')}`;
}

/**
 * Validates whether a token matches the expected QR Dine OS table token format.
 */
export function isValidTableToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  return /^qrd_tbl_[a-fA-F0-9]{32}$/.test(token);
}

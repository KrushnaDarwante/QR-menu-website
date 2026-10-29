/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidTableToken } from './qr-crypto.ts';

/**
 * Extracts a restaurant table token from a scanned QR string.
 * Supports full URLs, relative paths, query strings, and raw tokens.
 */
export function extractTokenFromQrData(rawContent: string): string | null {
  if (!rawContent || typeof rawContent !== 'string') return null;

  const trimmed = rawContent.trim();

  // 1. Direct raw token
  if (isValidTableToken(trimmed)) {
    return trimmed;
  }

  // 2. URL parsing (e.g. https://domain.com/scan?token=qrd_tbl_... or http://localhost:3000/?token=...)
  try {
    // If it starts with http:// or https:// or //
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
      const url = new URL(trimmed, 'https://qrdine.os');
      const token = url.searchParams.get('token') || url.searchParams.get('tableToken');
      if (token && isValidTableToken(token)) {
        return token;
      }
    }
  } catch {
    // Ignore URL parse error and continue to regex
  }

  // 3. Regex search for token= parameter
  const queryMatch = trimmed.match(/[?&]token=([a-fA-F0-9_]+)/i);
  if (queryMatch && queryMatch[1] && isValidTableToken(queryMatch[1])) {
    return queryMatch[1];
  }

  // 4. Regex search for any qrd_tbl_<32 hex chars> occurrence anywhere in the string
  const tokenMatch = trimmed.match(/qrd_tbl_[a-fA-F0-9]{32}/i);
  if (tokenMatch && tokenMatch[0] && isValidTableToken(tokenMatch[0])) {
    return tokenMatch[0];
  }

  // 5. JSON parsing if QR encoded a JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.token && isValidTableToken(parsed.token)) {
        return parsed.token;
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  return null;
}

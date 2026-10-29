/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, OrderItemRequest, OrderItemSnapshot, Restaurant } from '../types/index.ts';

export interface CalculatedOrderPricing {
  subtotalCents: number;
  taxCents: number;
  serviceFeeCents: number;
  tipCents: number;
  totalCents: number;
  snapshots: OrderItemSnapshot[];
}

export interface PricingError {
  code: 'ITEM_NOT_FOUND' | 'ITEM_SOLD_OUT' | 'INVALID_QUANTITY' | 'INVALID_VARIANT' | 'INVALID_ADDON';
  message: string;
  itemId?: string;
}

/**
 * Pure server-side pricing engine.
 * Never trust client calculations. All additions, variant deltas,
 * add-on costs, taxes, and service charges are calculated strictly here.
 */
export function calculateOrderTotals(
  restaurant: Restaurant,
  itemsRequest: OrderItemRequest[],
  menuItemsMap: Map<string, MenuItem>,
  tipCents: number = 0,
  orderIdPlaceholder: string = ''
): { pricing?: CalculatedOrderPricing; error?: PricingError } {
  if (!itemsRequest || itemsRequest.length === 0) {
    return {
      error: {
        code: 'INVALID_QUANTITY',
        message: 'Order must contain at least one item.',
      },
    };
  }

  let subtotalCents = 0;
  const snapshots: OrderItemSnapshot[] = [];

  for (let i = 0; i < itemsRequest.length; i++) {
    const req = itemsRequest[i];
    const menuItem = menuItemsMap.get(req.menuItemId);

    if (!menuItem) {
      return {
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Menu item '${req.menuItemId}' does not exist.`,
          itemId: req.menuItemId,
        },
      };
    }

    if (!menuItem.isAvailable) {
      return {
        error: {
          code: 'ITEM_SOLD_OUT',
          message: `'${menuItem.name}' is currently 86'd (sold out).`,
          itemId: menuItem.id,
        },
      };
    }

    if (!req.quantity || req.quantity < 1 || !Number.isInteger(req.quantity)) {
      return {
        error: {
          code: 'INVALID_QUANTITY',
          message: `Invalid quantity for '${menuItem.name}'. Must be at least 1.`,
          itemId: menuItem.id,
        },
      };
    }

    // Resolve variant
    let variantDelta = 0;
    let selectedVariantName: string | undefined;
    if (req.variantId) {
      const variant = menuItem.variants?.find((v) => v.id === req.variantId);
      if (!variant) {
        return {
          error: {
            code: 'INVALID_VARIANT',
            message: `Variant '${req.variantId}' is not valid for '${menuItem.name}'.`,
            itemId: menuItem.id,
          },
        };
      }
      variantDelta = variant.priceDeltaCents;
      selectedVariantName = variant.name;
    }

    // Resolve add-ons
    let addonsTotalPerUnit = 0;
    const selectedAddons: { id: string; name: string; priceCents: number }[] = [];
    if (req.addonIds && req.addonIds.length > 0) {
      for (const addonId of req.addonIds) {
        const addon = menuItem.addons?.find((a) => a.id === addonId);
        if (!addon) {
          return {
            error: {
              code: 'INVALID_ADDON',
              message: `Add-on '${addonId}' is not valid for '${menuItem.name}'.`,
              itemId: menuItem.id,
            },
          };
        }
        addonsTotalPerUnit += addon.priceCents;
        selectedAddons.push({
          id: addon.id,
          name: addon.name,
          priceCents: addon.priceCents,
        });
      }
    }

    const unitPriceCents = menuItem.basePriceCents + variantDelta + addonsTotalPerUnit;
    const lineTotalCents = unitPriceCents * req.quantity;
    subtotalCents += lineTotalCents;

    snapshots.push({
      id: `snap_${Date.now()}_${i}`,
      orderId: orderIdPlaceholder,
      menuItemId: menuItem.id,
      snapshotItemName: menuItem.name,
      snapshotBasePriceCents: menuItem.basePriceCents,
      quantity: req.quantity,
      selectedVariantName,
      selectedVariantDeltaCents: variantDelta,
      selectedAddons,
      itemTotalCents: lineTotalCents,
      specialInstructions: req.specialInstructions?.trim() || undefined,
      prepStatus: 'PENDING',
    });
  }

  // Calculate taxes: round to nearest cent
  const taxCents = Math.round(subtotalCents * (restaurant.taxRatePercent / 100));

  // Calculate service fee: round to nearest cent
  const serviceFeeCents = Math.round(subtotalCents * (restaurant.serviceFeePercent / 100));

  // Sanitize tip
  const sanitizedTipCents = Math.max(0, Math.floor(tipCents || 0));

  const totalCents = subtotalCents + taxCents + serviceFeeCents + sanitizedTipCents;

  return {
    pricing: {
      subtotalCents,
      taxCents,
      serviceFeeCents,
      tipCents: sanitizedTipCents,
      totalCents,
      snapshots,
    },
  };
}

/**
 * Format currency cents to display string (e.g. 1450 -> "$14.50")
 */
export function formatCurrency(cents: number, symbol: string = '$'): string {
  const dollars = (cents / 100).toFixed(2);
  return `${symbol}${dollars}`;
}

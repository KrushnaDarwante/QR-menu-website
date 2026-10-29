/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals, formatCurrency } from '../core/pricing.ts';
import { MenuItem, Restaurant } from '../types/index.ts';

const mockRestaurant: Restaurant = {
  id: 'rest_bistro_01',
  name: 'The Grand Truffle Bistro',
  slug: 'grand-truffle',
  tagline: 'Artisan comfort food',
  currency: 'USD',
  currencySymbol: '$',
  taxRatePercent: 10.0, // 10% tax for clear math
  serviceFeePercent: 5.0, // 5% service fee
  isActive: true,
  address: '452 Artisan Way',
  phone: '+1 (555) 234-5678',
};

const mockItems: MenuItem[] = [
  {
    id: 'item_burger',
    restaurantId: 'rest_bistro_01',
    categoryId: 'cat_mains',
    name: 'Truffle Angus Burger',
    description: 'Brioche, wagyu patty, black truffle aioli',
    basePriceCents: 1600, // $16.00
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    isAvailable: true,
    dietaryFlags: ['CHEF_SPECIAL'],
    prepTimeMinutes: 12,
    sortOrder: 1,
    variants: [
      { id: 'var_double', name: 'Double Patty', priceDeltaCents: 400 }, // +$4.00
      { id: 'var_regular', name: 'Single Patty', priceDeltaCents: 0 },
    ],
    addons: [
      { id: 'addon_cheddar', name: 'Aged Cheddar', priceCents: 150 }, // +$1.50
      { id: 'addon_bacon', name: 'Smoked Bacon', priceCents: 250 }, // +$2.50
    ],
  },
  {
    id: 'item_truffle_fries',
    restaurantId: 'rest_bistro_01',
    categoryId: 'cat_sides',
    name: 'Hand-Cut Truffle Fries',
    description: 'Parmesan, parsley, rosemary salt',
    basePriceCents: 800, // $8.00
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600',
    isAvailable: true,
    dietaryFlags: ['VEGETARIAN', 'GLUTEN_FREE'],
    prepTimeMinutes: 8,
    sortOrder: 2,
  },
  {
    id: 'item_sold_out_dessert',
    restaurantId: 'rest_bistro_01',
    categoryId: 'cat_desserts',
    name: 'Lava Cake',
    description: 'Valrhona chocolate',
    basePriceCents: 900,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600',
    isAvailable: false, // 86'd
    dietaryFlags: ['VEGETARIAN'],
    prepTimeMinutes: 10,
    sortOrder: 3,
  },
];

const menuMap = new Map(mockItems.map((item) => [item.id, item]));

test('pricing engine calculates base item price, tax, and service fee correctly', () => {
  const result = calculateOrderTotals(
    mockRestaurant,
    [{ menuItemId: 'item_truffle_fries', quantity: 2 }],
    menuMap,
    200 // $2.00 tip
  );

  assert.ok(result.pricing);
  assert.equal(result.pricing.subtotalCents, 1600); // 2 * $8.00 = $16.00
  assert.equal(result.pricing.taxCents, 160); // 10% of 1600 = $1.60
  assert.equal(result.pricing.serviceFeeCents, 80); // 5% of 1600 = $0.80
  assert.equal(result.pricing.tipCents, 200); // $2.00
  assert.equal(result.pricing.totalCents, 2040); // 1600 + 160 + 80 + 200 = $20.40
  assert.equal(result.pricing.snapshots.length, 1);
  assert.equal(result.pricing.snapshots[0].snapshotItemName, 'Hand-Cut Truffle Fries');
});

test('pricing engine correctly calculates variants and multiple add-ons', () => {
  const result = calculateOrderTotals(
    mockRestaurant,
    [
      {
        menuItemId: 'item_burger',
        variantId: 'var_double', // +400 -> 2000
        addonIds: ['addon_cheddar', 'addon_bacon'], // +150 + 250 = +400 -> 2400
        quantity: 1,
      },
    ],
    menuMap,
    0
  );

  assert.ok(result.pricing);
  assert.equal(result.pricing.subtotalCents, 2400); // 1600 + 400 + 150 + 250 = 2400 ($24.00)
  assert.equal(result.pricing.taxCents, 240); // 10% = 240
  assert.equal(result.pricing.serviceFeeCents, 120); // 5% = 120
  assert.equal(result.pricing.totalCents, 2760); // 2400 + 240 + 120 = 2760
  assert.equal(result.pricing.snapshots[0].selectedVariantName, 'Double Patty');
  assert.equal(result.pricing.snapshots[0].selectedAddons.length, 2);
});

test('pricing engine rejects 86-ed (sold out) items', () => {
  const result = calculateOrderTotals(
    mockRestaurant,
    [{ menuItemId: 'item_sold_out_dessert', quantity: 1 }],
    menuMap
  );

  assert.ok(result.error);
  assert.equal(result.error.code, 'ITEM_SOLD_OUT');
});

test('pricing engine rejects invalid quantity', () => {
  const result = calculateOrderTotals(
    mockRestaurant,
    [{ menuItemId: 'item_truffle_fries', quantity: 0 }],
    menuMap
  );

  assert.ok(result.error);
  assert.equal(result.error.code, 'INVALID_QUANTITY');
});

test('formatCurrency outputs correctly formatted dollar strings', () => {
  assert.equal(formatCurrency(1450), '$14.50');
  assert.equal(formatCurrency(0), '$0.00');
  assert.equal(formatCurrency(50), '$0.50');
});

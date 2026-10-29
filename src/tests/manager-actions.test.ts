/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../core/store.ts';

test('manager can add a new dish to the digital menu', () => {
  const result = store.addItem(
    {
      restaurantId: 'rest_grand_truffle',
      categoryId: 'cat_burgers',
      name: 'Paneer Tikka Charcoal Burger',
      description: 'Marinated cottage cheese, mint chutney aioli, pickled onions',
      basePriceCents: 1400,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600',
      isAvailable: true,
      dietaryFlags: ['VEGETARIAN', 'SPICY'],
      prepTimeMinutes: 10,
      sortOrder: 99,
    },
    'MANAGER'
  );

  assert.equal(result.success, true);
  assert.ok(result.item);
  assert.equal(result.item.name, 'Paneer Tikka Charcoal Burger');
  assert.equal(store.getItemById(result.item.id)?.name, 'Paneer Tikka Charcoal Burger');
});

test('public diner cannot add or delete dishes', () => {
  const addAttempt = store.addItem(
    {
      restaurantId: 'rest_grand_truffle',
      categoryId: 'cat_burgers',
      name: 'Hacker Burger',
      description: 'Unauthorized addition',
      basePriceCents: 100,
      imageUrl: '',
      isAvailable: true,
      dietaryFlags: [],
      prepTimeMinutes: 5,
      sortOrder: 1,
    },
    'PUBLIC_DINER'
  );
  assert.equal(addAttempt.success, false);

  const deleteAttempt = store.deleteItem('item_truffle_wagyu_burger', 'PUBLIC_DINER');
  assert.equal(deleteAttempt.success, false);
});

test('manager can perform morning bulk reset of all items to available', () => {
  const resetRes = store.bulkSetAvailability(true, 'MANAGER');
  assert.equal(resetRes.success, true);

  const allItems = store.getItems();
  assert.ok(allItems.every((i) => i.isAvailable === true));
});

test('manager can delete a dish from the menu', () => {
  const addRes = store.addItem(
    {
      restaurantId: 'rest_grand_truffle',
      categoryId: 'cat_specials',
      name: 'Temporary Special Dish',
      description: 'Will be deleted',
      basePriceCents: 1500,
      imageUrl: '',
      isAvailable: true,
      dietaryFlags: [],
      prepTimeMinutes: 5,
      sortOrder: 100,
    },
    'MANAGER'
  );
  assert.ok(addRes.item);

  const deleteRes = store.deleteItem(addRes.item.id, 'MANAGER');
  assert.equal(deleteRes.success, true);
  assert.equal(store.getItemById(addRes.item.id), undefined);
});

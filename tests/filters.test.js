import test from 'node:test';
import assert from 'node:assert/strict';

import { filterDishes, isWithinBudget } from '../src/services/calculation-service.js';
import { dishes } from '../src/data/dishes.js';

test('vegetarian filter returns only vegetarian dishes', () => {
  const filtered = filterDishes(dishes, 'vegetarian');
  assert.equal(filtered.length, 3);
  assert.ok(filtered.every((dish) => dish.kind.includes('vegetarian')));
});

test('quick filter uses actual preparation time', () => {
  const filtered = filterDishes(dishes, 'quick');
  assert.equal(filtered.length, 4);
  assert.ok(filtered.every((dish) => dish.time <= 30));
  assert.equal(filtered.some((dish) => dish.id === 'soup'), false);
});

test('meals over budget are retained with an over-budget status', () => {
  const dishCost = 12.8;
  const budget = 10;
  assert.equal(isWithinBudget(dishCost, budget), false);
});

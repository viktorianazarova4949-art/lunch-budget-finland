import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateBasketCost,
  calculateCostForPeople,
  calculateDishCost,
  compareStoreCosts,
  findCheapestStore,
  isWithinBudget,
  roundCurrency
} from '../src/services/calculation-service.js';

test('calculates a dish cost for 4 servings', () => {
  assert.equal(calculateDishCost(10.2, 4), 10.2);
});

test('scales 4-serving prices for 1, 2, 4, 6, 10 and 20 people', () => {
  assert.deepEqual(
    [1, 2, 4, 6, 10, 20].map((people) => calculateCostForPeople(10.2, people)),
    [2.55, 5.1, 10.2, 15.3, 25.5, 51]
  );
});

test('compares store costs and finds the cheapest store', () => {
  const costs = compareStoreCosts(
    { prisma: 10.2, citymarket: 11.4, lidl: 9.7 },
    6,
    ['prisma', 'citymarket', 'lidl']
  );

  assert.deepEqual(costs, { prisma: 15.3, citymarket: 17.1, lidl: 14.55 });
  assert.equal(findCheapestStore(costs), 'lidl');
});

test('checks budget and rounds basket totals', () => {
  assert.equal(isWithinBudget(10.25, 10.25), true);
  assert.equal(isWithinBudget(10.26, 10.25), false);
  assert.equal(calculateBasketCost([10.2, 6.9, 2.25]), 19.35);
  assert.equal(roundCurrency(9.999), 10);
});

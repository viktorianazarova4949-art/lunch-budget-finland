import test from 'node:test';
import assert from 'node:assert/strict';

import { stores } from '../src/data/stores.js';
import { getDemoDishPrices, isDemoPriceStore } from '../src/services/price-service.js';

test('all demo stores keep links and remain marked as demo prices', () => {
  assert.equal(stores.length, 3);
  assert.ok(stores.every((store) => store.link.startsWith('https://')));
  assert.ok(stores.every(isDemoPriceStore));
});

test('price service scales demo basket prices', () => {
  assert.deepEqual(
    getDemoDishPrices('pasta', 6, ['prisma', 'citymarket', 'lidl']),
    { prisma: 15.3, citymarket: 17.1, lidl: 14.55 }
  );
});

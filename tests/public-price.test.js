import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadPrismaSnapshot,
  parsePublicPrice
} from '../src/services/public-price-service.js';

test('parses public Prisma package prices', () => {
  assert.equal(
    parsePublicPrice('<span data-test-id="display-price">1,55 €</span>'),
    1.55
  );
  assert.equal(
    parsePublicPrice('39,90 €/kg'),
    39.9
  );
  assert.equal(parsePublicPrice('Price unavailable'), null);
});

test('loads snapshot and handles unavailable browser fetch', async () => {
  const snapshot = await loadPrismaSnapshot(async () => ({
    ok: true,
    json: async () => ({
      status: 'partial-product-snapshot',
      products: { spaghetti_500g: { price: 1.55 } }
    })
  }));

  assert.equal(snapshot.status, 'partial-product-snapshot');
  assert.equal(snapshot.products.spaghetti_500g.price, 1.55);
  const unavailable = await loadPrismaSnapshot(async () => ({ ok: false }));
  assert.equal(unavailable.status, 'unavailable');
});

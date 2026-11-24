import fs from 'node:fs/promises';
import { parsePublicPrice } from '../src/services/public-price-service.js';

const target = new URL('../src/data/prisma-prices.json', import.meta.url);

const products = {
  // Explicit public product URLs. Basket mapping is added separately.
  spaghetti_500g: 'https://www.s-kaupat.fi/tuote/coop-spaghetti-pasta-luomu-500-g/7340191188013',
  lentils_500g: 'https://www.s-kaupat.fi/tuote/sabarot-beluga-linssi-500g/6406628000240',
  oven_salmon_kg: 'https://www.s-kaupat.fi/tuote/uuni-lohi/2006751600009'
};

async function fetchProduct(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LunchBudgetFinland/1.0 public-price-snapshot',
      'Accept': 'text/html'
    }
  });
  if (!response.ok) {
    throw new Error(`Public product fetch failed: ${response.status} ${url}`);
  }
  return response.text();
}

async function main() {
  const snapshot = {
    source: 'https://www.s-kaupat.fi/',
    sourceKind: 'public-snapshot',
    status: 'pending-product-mapping',
    updatedAt: null,
    products: {}
  };

  for (const [key, url] of Object.entries(products)) {
    try {
      const html = await fetchProduct(url);
      const price = parsePublicPrice(html);
      if (price !== null) {
        snapshot.products[key] = { url, price, fetchedAt: new Date().toISOString() };
      }
    } catch (error) {
      snapshot.products[key] = { url, error: error.message };
    }
  }

  const successful = Object.values(snapshot.products).filter((product) => product.price);
  snapshot.status = successful.length
    ? 'partial-product-snapshot'
    : 'fetch-failed';
  snapshot.updatedAt = successful.length ? new Date().toISOString() : null;

  await fs.writeFile(
    target,
    `${JSON.stringify(snapshot, null, 2)}\n`,
    'utf8'
  );
  console.log(`Saved ${successful.length} public Prisma product snapshots.`);
}

await main();

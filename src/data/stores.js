export const stores = [
  {
    id: 'prisma',
    name: 'Prisma',
    logo: 'S',
    link: 'https://www.s-kaupat.fi/',
    priceSource: 'public_snapshot',
    demo: true,
    availability: 'manual'
  },
  {
    id: 'citymarket',
    name: 'K‑Citymarket',
    logo: 'K',
    link: 'https://www.k-ruoka.fi/',
    priceSource: 'public_link',
    demo: true,
    availability: 'manual'
  },
  {
    id: 'lidl',
    name: 'Lidl',
    logo: 'L',
    link: 'https://www.lidl.fi/',
    priceSource: 'demo',
    demo: true,
    availability: 'manual'
  }
];

export const names = Object.fromEntries(stores.map((store) => [store.id, store.name]));
export const storeLinks = {
  prisma: 'https://www.s-kaupat.fi/',
  citymarket: 'https://www.k-ruoka.fi/',
  lidl: 'https://www.lidl.fi/'
};

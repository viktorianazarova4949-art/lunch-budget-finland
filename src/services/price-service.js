import { demoPrices } from '../data/prices.js';
import { compareStoreCosts } from './calculation-service.js';

export function getDemoDishPrices(dishId, people, storeIds) {
  const prices = demoPrices[dishId];
  if (!prices) return {};
  return compareStoreCosts(prices, people, storeIds);
}

export function isDemoPriceStore(store) {
  return Boolean(store?.demo);
}

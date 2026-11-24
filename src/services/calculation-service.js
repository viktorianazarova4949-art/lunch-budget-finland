export function roundCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

export function calculateDishCost(priceForFour, people) {
  const portions = Number(people);
  if (!Number.isFinite(portions) || portions <= 0) return 0;
  return roundCurrency(Number(priceForFour) * portions / 4);
}

export function calculateCostForPeople(priceForFour, people) {
  return calculateDishCost(priceForFour, people);
}

export function compareStoreCosts(prices, people, storeIds) {
  const selectedStores = Array.isArray(storeIds) ? storeIds : Object.keys(prices);
  return Object.fromEntries(
    selectedStores
      .filter((storeId) => Object.prototype.hasOwnProperty.call(prices, storeId))
      .map((storeId) => [storeId, calculateDishCost(prices[storeId], people)])
  );
}

export function findCheapestStore(storeCosts) {
  const entries = Object.entries(storeCosts);
  if (!entries.length) return null;
  return entries.reduce((cheapest, current) => (
    current[1] < cheapest[1] ? current : cheapest
  ))[0];
}

export function isWithinBudget(cost, budget) {
  const amount = Number(cost);
  const limit = Number(budget);
  if (!Number.isFinite(amount) || !Number.isFinite(limit)) return false;
  return amount <= limit;
}

export function calculateBasketCost(prices) {
  if (!Array.isArray(prices)) return 0;
  return roundCurrency(prices.reduce((total, price) => total + Number(price || 0), 0));
}

export function filterDishes(dishes, filter) {
  if (!Array.isArray(dishes)) return [];
  if (filter === 'vegetarian') {
    return dishes.filter((dish) => dish.kind?.split(' ').includes('vegetarian'));
  }
  if (filter === 'quick') {
    return dishes.filter((dish) => Number(dish.time) <= 30);
  }
  return dishes;
}

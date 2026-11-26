import test from 'node:test';
import assert from 'node:assert/strict';

import { dishes } from '../src/data/dishes.js';
import { demoPrices } from '../src/data/prices.js';
import { dishPhotos, dishPhotoCredits } from '../src/data/photos.js';
import { mealCopy } from '../src/i18n/index.js';

test('every recipe has unique data, demo prices and translations', () => {
  const ids = dishes.map((dish) => dish.id);
  assert.equal(new Set(ids).size, dishes.length);
  assert.equal(dishes.length, 12);

  for (const dish of dishes) {
    assert.ok(dish.name);
    assert.ok(dish.desc);
    assert.ok(dish.items.length > 0);
    assert.ok(dishPhotos[dish.id]?.startsWith('https://'), `${dish.id} should have a recipe photo`);
    assert.deepEqual(Object.keys(demoPrices[dish.id]).sort(), ['citymarket', 'lidl', 'prisma']);

    for (const translations of Object.values(mealCopy)) {
      assert.equal(translations[dish.id]?.length, 4, `${dish.id} should have a complete translation`);
    }
  }
});

test('zucchini fritter photo provides its required attribution and license', () => {
  assert.equal(dishPhotoCredits.pancakes.author, 'Tsatsos');
  assert.equal(dishPhotoCredits.pancakes.license, 'CC BY-SA 4.0');
  assert.ok(dishPhotoCredits.pancakes.sourceUrl.startsWith('https://'));
  assert.ok(dishPhotoCredits.pancakes.licenseUrl.startsWith('https://'));
});

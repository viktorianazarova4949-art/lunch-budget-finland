import test from 'node:test';
import assert from 'node:assert/strict';

import { loadSettings, saveSettings } from '../src/services/storage-service.js';

function createMemoryStorage(initial) {
  const values = new Map(initial ? [['lunch-budget-settings', initial]] : []);
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

test('restores Swedish language', () => {
  const storage = createMemoryStorage(JSON.stringify({
    language: 'sv',
    budget: 25,
    people: 4,
    stores: ['prisma'],
    filter: 'all'
  }));
  assert.equal(loadSettings(storage).language, 'sv');
});

test('restores valid saved settings', () => {
  const storage = createMemoryStorage(JSON.stringify({
    language: 'fi',
    budget: 30,
    people: 6,
    stores: ['prisma', 'lidl'],
    filter: 'vegetarian'
  }));

  assert.deepEqual(loadSettings(storage), {
    language: 'fi',
    budget: 30,
    people: 6,
    stores: ['prisma', 'lidl'],
    filter: 'vegetarian'
  });
});

test('sanitizes invalid JSON and invalid values', () => {
  assert.equal(loadSettings(createMemoryStorage('{bad')).language, 'ru');
  assert.equal(loadSettings(createMemoryStorage(JSON.stringify({
    language: 'de',
    budget: -5,
    people: 99,
    stores: ['unknown'],
    filter: 'missing'
  }))).budget, 1);
});

test('saves settings and handles unavailable storage', () => {
  const storage = createMemoryStorage();
  assert.equal(saveSettings({
    language: 'en',
    budget: 20,
    people: 4,
    stores: ['lidl'],
    filter: 'quick'
  }, storage), true);

  assert.equal(loadSettings(storage).language, 'en');
  assert.equal(saveSettings({}, {
    setItem() {
      throw new Error('unavailable');
    }
  }), false);
});

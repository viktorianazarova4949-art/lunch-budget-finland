import test from 'node:test';
import assert from 'node:assert/strict';

import {
  copy,
  formatCurrency,
  formatDate,
  getSupportedLanguage
} from '../src/i18n/index.js';

test('language switching supports ru, fi, en and sv only', () => {
  assert.equal(getSupportedLanguage('ru'), 'ru');
  assert.equal(getSupportedLanguage('fi'), 'fi');
  assert.equal(getSupportedLanguage('en'), 'en');
  assert.equal(getSupportedLanguage('sv'), 'sv');
  assert.equal(getSupportedLanguage('de'), 'ru');
  assert.ok(copy.ru.brand);
  assert.ok(copy.fi.brand);
  assert.ok(copy.en.brand);
  assert.ok(copy.sv.brand);
});

test('Euro formatting produces locale-specific strings', () => {
  assert.match(formatCurrency(20.5, 'fi'), /20/);
  assert.match(formatCurrency(20.5, 'ru'), /20/);
  assert.match(formatCurrency(20.5, 'en'), /20/);
  assert.match(formatCurrency(20.5, 'sv'), /20/);
});

test('date formatting uses a valid locale', () => {
  assert.ok(formatDate(new Date('2026-11-24T12:00:00'), 'ru').length > 0);
  assert.ok(formatDate(new Date('2026-11-24T12:00:00'), 'fi').length > 0);
  assert.ok(formatDate(new Date('2026-11-24T12:00:00'), 'en').length > 0);
  assert.ok(formatDate(new Date('2026-11-24T12:00:00'), 'sv').length > 0);
});

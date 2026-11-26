import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseSeasonalRecipes,
  validateSeasonalRecipeInput
} from '../src/services/seasonal-recipe-service.js';

test('seasonal recipe requests accept supported languages and bounded settings', () => {
  assert.deepEqual(
    validateSeasonalRecipeInput({ people: 4, budget: 20, language: 'ru' }),
    { people: 4, budget: 20, language: 'ru' }
  );
  assert.throws(
    () => validateSeasonalRecipeInput({ people: 21, budget: 20, language: 'ru' }),
    TypeError
  );
  assert.throws(
    () => validateSeasonalRecipeInput({ people: 4, budget: 20, language: 'de' }),
    TypeError
  );
});

test('Gemini recipe output is parsed into bounded display-safe fields', () => {
  const recipes = parseSeasonalRecipes(JSON.stringify({
    recipes: [{
      title: 'Seasonal soup',
      description: 'A quick vegetable soup.',
      prepMinutes: 25,
      ingredients: ['Potatoes — 500 g', 'Carrots — 2'],
      price: 999
    }]
  }));

  assert.deepEqual(recipes, [{
    title: 'Seasonal soup',
    description: 'A quick vegetable soup.',
    prepMinutes: 25,
    ingredients: ['Potatoes — 500 g', 'Carrots — 2']
  }]);
  assert.throws(() => parseSeasonalRecipes('not json'), SyntaxError);
  assert.throws(
    () => parseSeasonalRecipes(JSON.stringify({ recipes: [{ title: 'Invalid' }] })),
    TypeError
  );
});

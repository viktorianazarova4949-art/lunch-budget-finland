const supportedLanguages = new Set(['ru', 'fi', 'en', 'sv']);

export function validateSeasonalRecipeInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Request body must be an object.');
  }

  const { people, budget, language } = input;
  if (!Number.isInteger(people) || people < 1 || people > 20) {
    throw new TypeError('People must be an integer from 1 to 20.');
  }
  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget < 1 || budget > 500) {
    throw new TypeError('Budget must be a number from 1 to 500.');
  }
  if (!supportedLanguages.has(language)) {
    throw new TypeError('Language is not supported.');
  }

  return { people, budget, language };
}

export function parseSeasonalRecipes(responseText) {
  const response = JSON.parse(responseText);
  if (!Array.isArray(response?.recipes) || response.recipes.length === 0) {
    throw new TypeError('Generated response must contain recipes.');
  }

  return response.recipes.slice(0, 3).map((recipe) => {
    const title = typeof recipe.title === 'string' ? recipe.title.trim() : '';
    const description = typeof recipe.description === 'string' ? recipe.description.trim() : '';
    if (!title || title.length > 100 || !description || description.length > 300) {
      throw new TypeError('Generated recipe text is invalid.');
    }
    if (!Number.isInteger(recipe.prepMinutes) || recipe.prepMinutes < 5 || recipe.prepMinutes > 180) {
      throw new TypeError('Generated preparation time is invalid.');
    }
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 2 || recipe.ingredients.length > 8) {
      throw new TypeError('Generated ingredients are invalid.');
    }

    const ingredients = recipe.ingredients.map((ingredient) => (
      typeof ingredient === 'string' ? ingredient.trim() : ''
    ));
    if (ingredients.some((ingredient) => !ingredient || ingredient.length > 120)) {
      throw new TypeError('Generated ingredients are invalid.');
    }

    return { title, description, prepMinutes: recipe.prepMinutes, ingredients };
  });
}

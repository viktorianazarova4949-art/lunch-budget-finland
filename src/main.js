import { dishes } from './data/dishes.js';
import { dishPhotos, dishPhotoCredits } from './data/photos.js';
import { names, storeLinks } from './data/stores.js';
import {
  copy,
  mealCopy,
  formatCurrency,
  formatDate,
  getSupportedLanguage
} from './i18n/index.js';
import {
  findCheapestStore,
  filterDishes
} from './services/calculation-service.js';
import { getDemoDishPrices } from './services/price-service.js';
import { loadSettings, saveSettings } from './services/storage-service.js';

const savedSettings=loadSettings();
let filter=savedSettings.filter;
let lang=getSupportedLanguage(savedSettings.language);
const fmt=(amount)=>formatCurrency(amount,lang);
function applyLanguage(){const t=copy[lang];document.documentElement.lang=lang;document.title=t.title;document.querySelector('.brand').innerHTML='<span class="mark">🍲</span> '+t.brand;document.querySelector('.eyebrow').textContent=t.eyebrow;document.querySelector('.hero h1').innerHTML=t.hero;document.querySelector('.hero p').textContent=t.intro;document.querySelector('.badge').textContent=t.compare;document.querySelector('.controls h2').textContent=t.plan;document.querySelector('label[for="budget"]').textContent=t.budget;document.querySelector('label[for="people"]').textContent=t.people;document.querySelector('[data-filter="all"]').textContent=t.all;document.querySelector('[data-filter="vegetarian"]').textContent=t.veg;document.querySelector('[data-filter="quick"]').textContent=t.quick;document.querySelector('.stores-box h2').textContent=t.stores;document.querySelector('[value="prisma"]~.store-label .store-note').textContent=t.prismaNote;document.querySelector('[value="citymarket"]~.store-label .store-note').textContent=t.kNote;document.querySelector('[value="lidl"]~.store-label .store-note').textContent=t.lidlNote;document.querySelector('.section-head h2').textContent=t.cook;const notice=document.querySelector('.notice div');notice.innerHTML='<strong>'+t.warningTitle+'</strong> '+t.warning;const foot=document.querySelector('.foot');foot.children[0].textContent=t.footer;const links=foot.querySelectorAll('a');links[0].textContent=t.sLink;links[1].textContent=t.kLink;links[2].textContent=t.lLink;document.querySelector('#language').value=lang;document.querySelector('#today').textContent=formatDate(new Date(),lang);render()}

function applyGeminiLanguage() {
  const t = copy[lang];
  document.querySelector('#aiIdeas').textContent = `✨ ${t.aiButton}`;
  document.querySelector('#aiNote').textContent = t.aiNote;
  document.querySelector('#aiStatus').textContent = '';
  const results = document.querySelector('#aiResults');
  results.setAttribute('aria-label', t.aiResultsLabel);
  results.replaceChildren();
}

function renderSeasonalRecipes(recipes) {
  const t = copy[lang];
  const root = document.querySelector('#aiResults');
  root.replaceChildren();

  recipes.forEach((recipe) => {
    const card = document.createElement('article');
    card.className = 'ai-recipe';

    const title = document.createElement('h3');
    title.textContent = recipe.title;
    card.append(title);

    const description = document.createElement('p');
    description.textContent = recipe.description;
    card.append(description);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `◷ ${recipe.prepMinutes} ${t.minute}`;
    card.append(meta);

    const ingredientsHeading = document.createElement('h4');
    ingredientsHeading.textContent = t.aiIngredients;
    card.append(ingredientsHeading);

    const ingredients = document.createElement('ul');
    recipe.ingredients.forEach((ingredient) => {
      const item = document.createElement('li');
      item.textContent = ingredient;
      ingredients.append(item);
    });
    card.append(ingredients);
    root.append(card);
  });
}

function render() {
  const t = copy[lang];
  const budget = Math.max(0, Number(document.querySelector('#budget').value) || 0);
  const people = Math.min(20, Math.max(1, Number(document.querySelector('#people').value) || 1));
  const active = [...document.querySelectorAll('.store input:checked')].map((input) => input.value);
  const root = document.querySelector('#results');
  const portion = lang === 'en'
    ? (people === 1 ? 'serving' : 'servings')
    : lang === 'sv'
      ? (people === 1 ? 'portion' : 'portioner')
    : lang === 'fi'
      ? (people === 1 ? 'annos' : 'annosta')
      : (people === 1 ? 'порция' : people % 10 >= 2 && people % 10 <= 4 && !(people % 100 >= 12 && people % 100 <= 14) ? 'порции' : 'порций');

  document.querySelector('#resultCount').textContent =
    `${people} ${portion} · ${t.budgetWord} ${fmt(budget)}`;

  if (!active.length) {
    root.innerHTML = `<div class="empty">${t.empty}</div>`;
    return;
  }

  const list = filterDishes(dishes, filter)
    .map((dish) => ({
      ...dish,
      costs: getDemoDishPrices(dish.id, people, active)
    }))
    .sort((a, b) =>
      Math.min(...Object.values(a.costs)) - Math.min(...Object.values(b.costs))
    );

  if (!list.length) {
    root.innerHTML = `<div class="empty">${t.noMatch}</div>`;
    return;
  }

  root.innerHTML = list.map((dish) => {
    const min = Math.min(...Object.values(dish.costs));
    const winner = findCheapestStore(dish.costs);
    const over = min > budget;
    const translated = mealCopy[lang]?.[dish.id];
    const name = translated?.[0] || dish.name;
    const tag = translated?.[1] || dish.tag;
    const desc = translated?.[2] || dish.desc;
    const person = lang === 'en'
      ? (people === 1 ? 'person' : 'people')
      : lang === 'sv'
        ? (people === 1 ? 'person' : 'personer')
      : lang === 'fi'
        ? (people === 1 ? 'henkilö' : 'henkilöä')
        : (people === 1 ? 'человек' : people % 10 >= 2 && people % 10 <= 4 && !(people % 100 >= 12 && people % 100 <= 14) ? 'человека' : 'человек');
    const maxCost = Math.max(...Object.values(dish.costs));

    return `<article class="recipe ${!over ? 'featured' : ''}">
      <div class="dish-visual visual-${dish.id}">
        <span class="emoji">${dish.emoji}</span>
        ${dishPhotos[dish.id] ? `<img class="dish-photo" src="${dishPhotos[dish.id]}" alt="${name}" loading="lazy" onerror="this.style.display='none'">` : ''}
        ${dishPhotoCredits[dish.id] ? `<span class="dish-photo-credit">© <a href="${dishPhotoCredits[dish.id].sourceUrl}" target="_blank" rel="noreferrer">${dishPhotoCredits[dish.id].author}</a> · <a href="${dishPhotoCredits[dish.id].licenseUrl}" target="_blank" rel="noreferrer">${dishPhotoCredits[dish.id].license}</a></span>` : ''}
      </div>
      <div class="recipe-top"><span class="tag">${tag}</span></div>
      <h3>${name}</h3>
      <p class="description">${desc}</p>
      <div class="meta"><span>◷ ${dish.time} ${t.minute}</span><span>♧ ${people} ${person}</span></div>
      <div class="costs">${Object.entries(dish.costs).map(([storeId, cost]) => `
        <div class="cost ${storeId === winner ? 'winner' : ''}">
          <div class="cost-row">
            <span>${names[storeId]} ${storeId === winner ? t.cheaper : ''}</span>
            <div class="cost-bar"><i style="width:${Math.max(8, 100 * cost / maxCost)}%"></i></div>
            <b>${fmt(cost)}</b>
          </div>
        </div>`).join('')}
      </div>
      <div class="fine ${over ? 'over-budget' : 'within-budget'}">${over ? t.over : t.within} ${t.forAll}</div>
      <div class="recipe-bottom">
        <button class="btn" data-id="${dish.id}">${t.items}</button>
        <button class="btn secondary" data-store="${winner}">${t.store}</button>
      </div>
    </article>`;
  }).join('');

  root.querySelectorAll('[data-id]').forEach((button) => {
    button.onclick = () => {
      const dish = dishes.find((item) => item.id === button.dataset.id);
      const items = mealCopy[lang]?.[dish.id]?.[3] || dish.items;
      toast(items.join(' · '));
    };
  });
  root.querySelectorAll('[data-store]').forEach((button) => {
    button.onclick = () => {
      window.open(storeLinks[button.dataset.store], '_blank', 'noopener');
    };
  });
}
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove('show'),4200)}
document.querySelectorAll('#budget,#people,.store input').forEach(el=>el.addEventListener('input',()=>{
  persistSettings();
  render();
}));

function persistSettings() {
  saveSettings({
    language: lang,
    budget: Number(document.querySelector('#budget').value),
    people: Number(document.querySelector('#people').value),
    stores: [...document.querySelectorAll('.store input:checked')].map((input)=>input.value),
    filter
  });
}

document.querySelectorAll('.tab').forEach((button)=>{
  button.onclick=()=>{
    document.querySelector('.tab.active').classList.remove('active');
    button.classList.add('active');
    filter=button.dataset.filter;
    persistSettings();
    render();
  };
});

document.querySelector('#language').addEventListener('change',(event)=>{
  lang=getSupportedLanguage(event.target.value);
  persistSettings();
  applyLanguage();
  applyGeminiLanguage();
});

document.querySelector('#aiIdeas').addEventListener('click', async () => {
  const t = copy[lang];
  const button = document.querySelector('#aiIdeas');
  const status = document.querySelector('#aiStatus');
  const budget = Number(document.querySelector('#budget').value);
  const people = Number(document.querySelector('#people').value);
  if (!Number.isFinite(budget) || budget < 1 || budget > 500 || !Number.isInteger(people) || people < 1 || people > 20) {
    status.textContent = t.aiInvalidInput;
    return;
  }

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = t.aiLoading;
  status.textContent = '';
  document.querySelector('#aiResults').replaceChildren();

  try {
    const response = await fetch('/api/seasonal-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget, people, language: lang })
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(t.aiFailed);
    }

    if (!response.ok) {
      const messageKey = {
        api_key_missing: 'aiMissingKey',
        gemini_rate_limited: 'aiRateLimited',
        gemini_timeout: 'aiTimeout'
      }[payload.errorCode];
      throw new Error(messageKey ? t[messageKey] : t.aiFailed);
    }
    if (!Array.isArray(payload.recipes) || payload.recipes.length === 0) {
      throw new Error(t.aiFailed);
    }

    renderSeasonalRecipes(payload.recipes);
    status.textContent = t.aiReady;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : t.aiFailed;
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = `✨ ${copy[lang].aiButton}`;
  }
});

document.querySelector('#budget').value=String(savedSettings.budget);
document.querySelector('#people').value=String(savedSettings.people);
document.querySelectorAll('.store input').forEach((input)=>{
  input.checked=savedSettings.stores.includes(input.value);
});
const savedTab=document.querySelector(`.tab[data-filter="${filter}"]`);
if(savedTab){
  document.querySelector('.tab.active')?.classList.remove('active');
  savedTab.classList.add('active');
}

applyLanguage();
applyGeminiLanguage();
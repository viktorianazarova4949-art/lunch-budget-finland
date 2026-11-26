# Lunch Budget Finland

Модульное ES Module-приложение для сравнения примерной стоимости обедов в Finland.

Поддерживаемые языки интерфейса: русский, финский, английский и шведский.

## Запуск

Требуется Node.js 18 или новее.

```bash
npm start
```

Откройте `http://127.0.0.1:4173`.

## Сезонные идеи через Gemini

1. Создайте API-ключ в Google AI Studio.
2. Скопируйте `.env.example` в `.env` и добавьте свой ключ в `GEMINI_API_KEY`.
3. Перезапустите `npm start` и нажмите «Идеи сезона от Gemini».

Ключ хранится только на сервере и исключён из Git. Не вставляйте его в код, браузер или чат.
Модель предлагает сезонные рецепты, но не проверяет цены и наличие продуктов; цены в карточках
по-прежнему демонстрационные. Ключ и использование Gemini API могут иметь ограничения и стоимость
со стороны Google.

## Тесты

```bash
npm test
```

## Обновление публичных цен Prisma

```bash
npm run sync:prisma-prices
```

Скрипт обновляет только явно заданные публичные карточки товаров S‑kaupat и сохраняет snapshot в
`src/data/prisma-prices.json`.

Полная агрегация рецепта по реальным ценам ещё не включена. Цены в приложении являются демонстрационными
и не загружаются из Prisma, K‑Citymarket и Lidl в реальном времени.

Фото овощных оладий: Tsatsos, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Crispy_Greek_Zucchini_Fritters_(Kolokythokeftedes).jpg).

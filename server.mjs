import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseSeasonalRecipes,
  validateSeasonalRecipeInput
} from './src/services/seasonal-recipe-service.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp'
};

class HttpError extends Error {
  constructor(status, errorCode) {
    super(errorCode);
    this.status = status;
    this.errorCode = errorCode;
  }
}

async function loadLocalEnvironment() {
  let contents;
  try {
    contents = await readFile(join(root, '.env'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;

    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    process.env[match[1]] = value;
  }
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(value));
}

async function readJsonBody(request) {
  if (!request.headers['content-type']?.includes('application/json')) {
    throw new HttpError(415, 'json_required');
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) throw new HttpError(413, 'request_too_large');
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

function verifySameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return;

  try {
    if (new URL(origin).host !== request.headers.host) {
      throw new HttpError(403, 'origin_not_allowed');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(403, 'origin_not_allowed');
  }
}

function createPrompt({ people, budget, language }) {
  const languageNames = {
    ru: 'Russian',
    fi: 'Finnish',
    en: 'English',
    sv: 'Swedish'
  };
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'Europe/Helsinki'
  }).format(new Date());

  return `Suggest exactly three varied, practical seasonal lunch recipes for people living in Finland.
Current month: ${month}. Write all recipe text in ${languageNames[language]}.
Plan for ${people} people and a target grocery budget of €${budget}.
Prefer ingredients commonly available in Finnish grocery stores and in season now.
Do not invent or state prices, store availability, health claims, or guarantees that the budget will be met.
Return only JSON matching the requested schema. Each recipe needs a short title, one-sentence description,
preparation time in minutes, and 3 to 8 ingredient strings with quantities for ${people} people.`;
}

async function generateSeasonalRecipes(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(503, 'api_key_missing');

  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  if (!/^[A-Za-z0-9._-]+$/.test(model)) throw new HttpError(500, 'invalid_model_configuration');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let providerResponse;
  try {
    providerResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: createPrompt(input) }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                recipes: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      description: { type: 'STRING' },
                      prepMinutes: { type: 'INTEGER' },
                      ingredients: { type: 'ARRAY', items: { type: 'STRING' } }
                    },
                    required: ['title', 'description', 'prepMinutes', 'ingredients']
                  }
                }
              },
              required: ['recipes']
            }
          }
        }),
        signal: controller.signal
      }
    );
  } catch (error) {
    if (controller.signal.aborted) throw new HttpError(504, 'gemini_timeout');
    throw new HttpError(502, 'gemini_unavailable');
  } finally {
    clearTimeout(timeout);
  }

  if (!providerResponse.ok) {
    if (providerResponse.status === 429) throw new HttpError(503, 'gemini_rate_limited');
    throw new HttpError(502, 'gemini_unavailable');
  }

  let providerData;
  try {
    providerData = await providerResponse.json();
  } catch {
    throw new HttpError(502, 'gemini_invalid_response');
  }

  const text = providerData.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('');
  if (!text) throw new HttpError(502, 'gemini_invalid_response');

  try {
    return parseSeasonalRecipes(text);
  } catch {
    throw new HttpError(502, 'gemini_invalid_response');
  }
}

async function serveStatic(request, response, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    throw new HttpError(400, 'invalid_path');
  }

  const relativePath = decodedPath.replace(/^[/\\]+/, '') || 'index.html';
  const filePath = resolve(root, relativePath);
  const pathFromRoot = relative(root, filePath);
  if (isAbsolute(pathFromRoot) || pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`)) {
    throw new HttpError(404, 'not_found');
  }
  const normalizedPath = pathFromRoot.replace(/\\/g, '/');
  if (
    normalizedPath !== 'index.html' &&
    !normalizedPath.startsWith('src/') &&
    !normalizedPath.startsWith('assets/')
  ) {
    throw new HttpError(404, 'not_found');
  }
  if (basename(filePath) === '.env' || basename(filePath).startsWith('.env.')) {
    throw new HttpError(404, 'not_found');
  }

  let fileInfo;
  try {
    fileInfo = await stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') throw new HttpError(404, 'not_found');
    throw error;
  }
  if (!fileInfo.isFile()) throw new HttpError(404, 'not_found');

  const content = await readFile(filePath);
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(request.method === 'HEAD' ? undefined : content);
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);

  if (requestUrl.pathname === '/api/seasonal-recipes') {
    if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
    verifySameOrigin(request);
    const input = validateSeasonalRecipeInput(await readJsonBody(request));
    const recipes = await generateSeasonalRecipes(input);
    sendJson(response, 200, { recipes });
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    throw new HttpError(405, 'method_not_allowed');
  }
  await serveStatic(request, response, requestUrl.pathname);
}

await loadLocalEnvironment();
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    if (error instanceof HttpError) {
      sendJson(response, error.status, { errorCode: error.errorCode });
      return;
    }
    console.error('Request failed:', error);
    sendJson(response, 500, { errorCode: 'internal_error' });
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Lunch Budget Finland running at http://127.0.0.1:${port}`);
});

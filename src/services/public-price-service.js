export async function loadPrismaSnapshot(fetchImpl = globalThis.fetch) {
  if (!fetchImpl) {
    return { status: 'unavailable', products: {} };
  }

  try {
    const response = await fetchImpl('./src/data/prisma-prices.json', {
      cache: 'no-store'
    });
    if (!response.ok) {
      return { status: 'unavailable', products: {} };
    }
    return await response.json();
  } catch {
    return { status: 'unavailable', products: {} };
  }
}

export function parsePublicPrice(html) {
  const structured = html.match(/display-price[^>]*>(?:Noin\s*)?([0-9]+(?:[,.][0-9]+)?)[\s\u00a0]*€/i);
  const fallback = html.match(/(?:Noin\s*)?([0-9]+(?:[,.][0-9]+)?)[\s\u00a0]*€(?:\/kg|\/l)?/i);
  const match = structured || fallback;
  if (!match) return null;
  const price = Number(match[1].replace(',', '.'));
  return Number.isFinite(price) ? price : null;
}

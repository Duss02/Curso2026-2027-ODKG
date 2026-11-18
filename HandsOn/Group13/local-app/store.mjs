export const endpoint = process.env.FUSEKI_QUERY_URL ?? 'http://127.0.0.1:3030/parking/query';

export async function execute(query, url = endpoint) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sparql-query', Accept: 'application/sparql-results+json' },
    body: query,
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw new Error(`Fuseki query failed (${response.status}): ${(await response.text()).slice(0, 1000)}`);
  }
  const result = await response.json();
  if (!Array.isArray(result.results?.bindings)) throw new Error('Fuseki returned invalid SPARQL results.');
  return result;
}

export function catalogSets(result) {
  const allowed = { districts: new Set(), parkings: new Set(), types: new Set(), years: new Set() };
  for (const row of result.results.bindings) {
    const key = { district: 'districts', parking: 'parkings', type: 'types', period: 'years' }[row.kind.value];
    if (key) allowed[key].add(row.value.value);
  }
  return allowed;
}

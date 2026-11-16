import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { makeQuery } from './queries.mjs';
import { catalogSets, execute } from './store.mjs';

const publicFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/map.js', ['map.js', 'text/javascript; charset=utf-8']],
  ['/vendor/leaflet.js', ['vendor/leaflet.js', 'text/javascript; charset=utf-8']],
  ['/vendor/leaflet.css', ['vendor/leaflet.css', 'text/css; charset=utf-8']],
  ['/data/districts.geojson', ['data/districts.geojson', 'application/geo+json']],
]);
const operations = new Set(['catalog', 'coverage', 'search', 'history', 'neighbors', 'compare', 'comparisonCoverage', 'facilityComparison']);
const catalogQuery = makeQuery('catalog', {});
let catalog;
async function getCatalog() {
  if (!catalog) {
    const result = await execute(catalogQuery);
    const allowed = catalogSets(result);
    if (!allowed.parkings.size || !allowed.districts.size || !allowed.years.size) {
      throw new Error('Reviewed RDF graph is missing or incomplete. Stop the services and run setup.ps1.');
    }
    catalog = { result, allowed };
  }
  return catalog;
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  const send = (status, data) => {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(data));
  };
  try {
    const host = request.headers.host;
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
      send(403, { error: 'Only localhost requests are accepted.' });
      return;
    }
    const url = new URL(request.url, `http://${host}`);
    if (request.method !== 'GET') {
      send(405, { error: 'Only read-only GET operations are supported.' });
      return;
    }
    if (url.pathname === '/api/query') {
      const { operation, ...params } = Object.fromEntries(url.searchParams);
      if (!operations.has(operation)) throw new RangeError('Unknown query operation.');
      const current = await getCatalog();
      const query = makeQuery(operation, params, current.allowed);
      const results = operation === 'catalog' ? current.result : await execute(query);
      if (operation === 'coverage' && (!results.results.bindings.length ||
          Number(results.results.bindings[0].edges.value) === 0)) {
        throw new Error('Wikidata snapshot is missing. Stop the services and run setup.ps1.');
      }
      send(200, { operation, query, results });
      return;
    }
    const file = publicFiles.get(url.pathname);
    if (!file) {
      send(404, { error: 'Not found.' });
      return;
    }
    const content = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': file[1] });
    response.end(content);
  } catch (error) {
    console.error(error);
    send(error instanceof RangeError ? 400 : 503, {
      error: error instanceof Error ? error.message : 'Unexpected server failure.',
    });
  }
});
const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
server.on('error', error => { console.error(error); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  console.log(`Madrid Parking Explorer: http://127.0.0.1:${port}`);
  console.log(`Application directory: ${fileURLToPath(new URL('.', import.meta.url))}`);
});

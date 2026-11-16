import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { seedsQuery, reviewedGraph, wikidataGraph, geographyGraph, makeQuery } from './queries.mjs';
import { execute } from './store.mjs';

const sourcePath = '../rdf/aparcamientos-with-links.ttl';
const source = new URL(sourcePath, import.meta.url);
const snapshot = new URL('./data/wikidata.ttl', import.meta.url);
const hash = data => createHash('sha256').update(data).digest('hex');
const maintenance = 'http://127.0.0.1:3031/parking';
const mode = process.argv[2];

async function entities(ids) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'wbgetentities', ids: ids.join('|'), props: 'claims|labels',
    languages: 'en|es', format: 'json',
  });
  const response = await fetch(url, {
    headers: { 'User-Agent': 'MadridParkingExplorer/1.0 (educational local linked-data application)' },
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`Wikidata request failed (${response.status}). Previous snapshot retained.`);
  const result = await response.json();
  if (result.error || !result.entities) throw new Error(`Invalid Wikidata response: ${JSON.stringify(result.error)}`);
  for (const id of ids) {
    if (!result.entities[id]?.claims) throw new Error(`Wikidata entity ${id} is missing claims.`);
  }
  return result.entities;
}

async function refresh(queryUrl) {
  const rows = (await execute(seedsQuery, queryUrl)).results.bindings;
  const ids = [...new Set(rows.map(row => {
    const match = /^http:\/\/www\.wikidata\.org\/entity\/(Q[1-9]\d*)$/.exec(row.wd.value);
    if (!match) throw new Error(`Unsupported district identity: ${row.wd.value}`);
    return match[1];
  }))].sort();
  if (!ids.length || ids.length > 50) throw new Error('Expected between 1 and 50 linked district identities.');
  const seeds = await entities(ids);
  const related = new Set();
  const links = [];
  for (const id of ids) {
    for (const property of ['P47', 'P131']) {
      for (const statement of seeds[id].claims[property] ?? []) {
        if (statement.rank === 'deprecated') continue;
        const target = statement.mainsnak.datavalue?.value?.id;
        if (target && /^Q[1-9]\d*$/.test(target)) {
          links.push(`wd:${id} wdt:${property} wd:${target} .`);
          related.add(target);
        }
      }
    }
    if (!links.some(line => line.startsWith(`wd:${id} wdt:P47 `))) {
      throw new Error(`No border statements returned for ${id}; previous snapshot retained.`);
    }
  }
  const missing = [...related].filter(id => !seeds[id]);
  const all = { ...seeds };
  for (let i = 0; i < missing.length; i += 50) Object.assign(all, await entities(missing.slice(i, i + 50)));
  const lines = [
    '@prefix wd: <http://www.wikidata.org/entity/> .',
    '@prefix wdt: <http://www.wikidata.org/prop/direct/> .',
    '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
    '@prefix dct: <http://purl.org/dc/terms/> .',
    '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
    '<urn:madrid-parking:snapshot>',
    `  dct:created "${new Date().toISOString()}"^^xsd:dateTime ;`,
    '  dct:license <https://creativecommons.org/publicdomain/zero/1.0/> ;',
    '  dct:source <https://www.wikidata.org/> ;',
    '  dct:description "Bounded snapshot of non-deprecated district border and administrative-parent statements; not a complete Wikidata mirror." .',
    ...ids.map(id => `<urn:madrid-parking:snapshot> dct:subject wd:${id} .`),
    ...[...new Set(links)].sort(),
  ];
  for (const id of Object.keys(all).sort()) {
    const label = all[id].labels.en?.value ?? all[id].labels.es?.value;
    if (label) lines.push(`wd:${id} rdfs:label ${JSON.stringify(label)} .`);
    lines.push(`wd:${id} dct:source <https://www.wikidata.org/wiki/Special:EntityData/${id}.json> .`);
  }
  await mkdir(new URL('./data/', import.meta.url), { recursive: true });
  const temporary = new URL('./data/wikidata.ttl.tmp', import.meta.url);
  await writeFile(temporary, `${lines.join('\n')}\n`, 'utf8');
  await rename(temporary, snapshot);
  console.log(`Saved Wikidata snapshot for ${ids.length} districts. Reload with setup.ps1 while services are stopped.`);
}

async function putGraph(graph, bytes) {
  const response = await fetch(`${maintenance}/data?graph=${encodeURIComponent(graph)}`, {
    method: 'PUT', headers: { 'Content-Type': 'text/turtle' }, body: bytes,
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Graph import failed (${response.status}): ${await response.text()}`);
}

async function prepare() {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${maintenance}/query?query=${encodeURIComponent('ASK {}')}`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) { ready = true; break; }
      if (response.status !== 503) throw new Error(`Unexpected setup endpoint status: ${response.status}`);
    } catch (error) {
      if (error.cause?.code !== 'ECONNREFUSED' && error.name !== 'TimeoutError') throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Maintenance Fuseki did not start. Inspect runtime setup logs.');
  const bytes = await readFile(source);
  const before = hash(bytes);
  await putGraph(reviewedGraph, bytes);
  let snapshotBytes;
  try { snapshotBytes = await readFile(snapshot); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.log('No cached snapshot found; fetching district relationships from Wikidata.');
    await refresh(`${maintenance}/query`);
    snapshotBytes = await readFile(snapshot);
  }
  await putGraph(wikidataGraph, snapshotBytes);
  await putGraph(geographyGraph, await readFile(new URL('./data/geography.ttl', import.meta.url)));
  const missing = await execute(`
    SELECT ?wd WHERE {
      GRAPH <${reviewedGraph}> { ?d <http://www.w3.org/2002/07/owl#sameAs> ?wd }
      FILTER NOT EXISTS { GRAPH <${wikidataGraph}> {
        <urn:madrid-parking:snapshot> <http://purl.org/dc/terms/subject> ?wd
      } }
    }`, `${maintenance}/query`);
  if (missing.results.bindings.length) throw new Error('Snapshot lacks reviewed district identities. Refresh the snapshot and rerun setup.');
  const coverage = (await execute(makeQuery('coverage', {}), `${maintenance}/query`)).results.bindings[0];
  if (!coverage || Number(coverage.edges.value) === 0) throw new Error('Loaded snapshot has no border relationships.');
  if (hash(await readFile(source)) !== before) throw new Error('Reviewed RDF changed during setup.');
  await mkdir(new URL('./runtime/', import.meta.url), { recursive: true });
  await writeFile(new URL('./runtime/source.json', import.meta.url), JSON.stringify({
    source: sourcePath, sha256: before, imported: new Date().toISOString(),
    counts: Object.fromEntries(Object.entries(coverage).map(([key, term]) => [key, term.value])),
  }, null, 2));
  console.log('Imported reviewed RDF unchanged. SHA-256:', before);
  console.log('Coverage:', JSON.stringify(Object.fromEntries(Object.entries(coverage).map(([k, v]) => [k, v.value]))));
}

try {
  if (mode === 'prepare') await prepare();
  else if (mode === 'refresh') await refresh();
  else throw new Error('Usage: node data.mjs prepare|refresh');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

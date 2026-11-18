import { mkdir, writeFile, rename } from 'node:fs/promises';
import { execute } from './store.mjs';
import { prefixes, reviewedGraph } from './queries.mjs';

const root = 'https://sigma.madrid.es/hosted/rest/services/';
const parkingSource = `${root}GEOPORTAL/APARCAMIENTOS_PUBLICOS/MapServer/0`;
const districtSource = `${root}CARTOGRAFIA/LIMITES_ADMINISTRATIVOS/MapServer/3`;
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
async function geojson(source) {
  const response = await fetch(`${source}/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Municipal geography HTTP ${response.status}`);
  const data = await response.json();
  if (data.error || !Array.isArray(data.features) || !data.features.length || data.exceededTransferLimit) {
    throw new Error(`Incomplete municipal geography: ${JSON.stringify(data.error)}`);
  }
  return data;
}
function contains(point, geometry) {
  const ringContains = ring => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x, y] = ring[i], [xx, yy] = ring[j];
      if ((y > point[1]) !== (yy > point[1]) && point[0] < (xx - x) * (point[1] - y) / (yy - y) + x) inside = !inside;
    }
    return inside;
  };
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  return polygons.some(rings => ringContains(rings[0]) && !rings.slice(1).some(ringContains));
}
try {
  const facilities = (await execute(`${prefixes}
    SELECT DISTINCT ?parking ?name ?districtName WHERE {
      GRAPH <${reviewedGraph}> {
        ?parking a mp:ParkingFacility ; prop:parkingName ?name ; prop:locatedIn ?district .
        ?district prop:districtName ?districtName .
      }
    } ORDER BY ?name`)).results.bindings;
  if (!facilities.length) throw new Error('No reviewed facilities returned. Start Fuseki first.');
  const [points, districts] = await Promise.all([geojson(parkingSource), geojson(districtSource)]);
  if (districts.features.length !== 21) throw new Error('Expected 21 municipal district outlines.');
  const retrieved = new Date().toISOString();
  const lines = [
    '@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .',
    '@prefix dct: <http://purl.org/dc/terms/> .',
    '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
    `<urn:madrid-parking:geography-snapshot> dct:created "${retrieved}"^^xsd:dateTime ;`,
    ` dct:source <${parkingSource}> ;`,
    ' dct:license <https://datos.madrid.es/pages/condiciones-generales-ayuntamiento-de-madrid> .',
  ];
  const grouped = new Map();
  for (const row of facilities) {
    if (!grouped.has(row.parking.value)) grouped.set(row.parking.value, []);
    grouped.get(row.parking.value).push(row);
  }
  const report = [];
  for (const records of grouped.values()) {
    const row = records[0];
    const candidates = points.features.filter(feature => normalize(feature.properties.NOMBRE) === normalize(row.name.value));
    const claimedDistricts = districts.features.filter(feature => records.some(record =>
      normalize(feature.properties.NOMBRE) === normalize(record.districtName.value)));
    const match = candidates.length === 1 && candidates[0].geometry?.type === 'Point' &&
      claimedDistricts.some(district => contains(candidates[0].geometry.coordinates, district.geometry)) ? candidates[0] : null;
    const entry = { parking: row.parking.value, name: row.name.value, districts: records.map(record => record.districtName.value),
      status: match ? 'matched' : candidates.length ? 'ambiguous-or-district-mismatch' : 'unmatched',
      method: 'Unique normalized exact name plus point-in-reviewed-district validation' };
    if (match) {
      const [longitude, latitude] = match.geometry.coordinates;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 40 || latitude > 41 || longitude < -4 || longitude > -3) {
        throw new Error(`Implausible coordinate for ${row.name.value}`);
      }
      const source = `${parkingSource}/${match.properties.OBJECTID}`;
      Object.assign(entry, { source, latitude, longitude, address: match.properties.DIRECCION });
      lines.push(`<${row.parking.value}> geo:lat "${latitude}"^^xsd:decimal ; geo:long "${longitude}"^^xsd:decimal ;`,
        ` dct:source <${source}> ; dct:description ${JSON.stringify(entry.method)} .`);
    }
    report.push(entry);
  }
  await mkdir(new URL('./data/', import.meta.url), { recursive: true });
  const assets = [
    ['geography.ttl', `${lines.join('\n')}\n`],
    ['districts.geojson', JSON.stringify({ ...districts, provenance: { source: districtSource, retrieved, crs: 'EPSG:4326',
      attribution: 'Ayuntamiento de Madrid', license: 'https://datos.madrid.es/pages/condiciones-generales-ayuntamiento-de-madrid' } })],
    ['geography-report.json', JSON.stringify({ retrieved, source: parkingSource, crs: 'EPSG:4326', facilities: report }, null, 2)],
  ];
  for (const [file, text] of assets) await writeFile(new URL(`./data/${file}.tmp`, import.meta.url), text);
  for (const [file] of assets) await rename(new URL(`./data/${file}.tmp`, import.meta.url), new URL(`./data/${file}`, import.meta.url));
  console.log(`Verified municipal locations: ${report.filter(row => row.status === 'matched').length}/${report.length}.`);
  console.log('Unmapped:', report.filter(row => row.status !== 'matched').map(row => `${row.name}: ${row.status}`).join('; '));
  console.log('Reload graphs using setup.ps1 with services stopped.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

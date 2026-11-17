/**
 * Data layer di LA 311 Fieldnotes: builder delle query SPARQL (FR1–FR5) e
 * funzioni che le eseguono restituendo oggetti tipizzati.
 *
 * Convenzioni sulle variabili condivise da tutte le query:
 *   ?sr  la311:ServiceRequest      ?loc  la311:Location
 *   ?requestType ?status ?created  ?lat ?lon ?wkt
 * In questo modo filterBlock() si può riusare ovunque.
 */
import type { Area, Bbox, Filters } from '../state';
import { type Row, SparqlClient } from './client';
import { dayEndExclusive, dayStart, dec, int, parseWktPoint, str, values, type LatLng } from './terms';

export const PREFIXES = `PREFIX la311:  <http://linkeddata.la311.com/ontology#>
PREFIX geo:    <http://www.opengis.net/ont/geosparql#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd:    <http://www.w3.org/2001/XMLSchema#>
PREFIX schema: <http://schema.org/>
`;

/* ------------------------------------------------------------------ */
/* Frammenti riusabili                                                  */
/* ------------------------------------------------------------------ */

function areaPattern(area: Area | null): string {
  if (!area) return '';
  switch (area.kind) {
    case 'cd':
      return `?loc la311:isWithin/la311:cd ${int(area.value)} .`;
    case 'nc':
      return `?loc la311:isWithin/la311:nc ${int(area.value)} .`;
    case 'zip':
      return `?loc la311:zipCode ${str(area.value)} .`;
  }
}

function bboxFilter(b: Bbox | null): string {
  if (!b) return '';
  return `FILTER (?lat >= ${dec(b.south)} && ?lat <= ${dec(b.north)} && ?lon >= ${dec(b.west)} && ?lon <= ${dec(b.east)})`;
}

interface BlockOptions {
  /** Applica il filtro sui tipi (false per i conteggi della legenda). */
  types?: boolean;
  /** Tutti i tipi disponibili: se la selezione li comprende tutti, il VALUES si omette. */
  allTypes?: string[];
}

/** Vincoli comuni: tipi, stati, intervallo di date e area. */
export function filterBlock(f: Filters, opts: BlockOptions = {}): string {
  const applyTypes = opts.types ?? true;
  const everyType = opts.allTypes && f.types.length === opts.allTypes.length;
  return [
    applyTypes && !everyType ? values('requestType', f.types) : '',
    values('status', f.statuses),
    `FILTER (?created >= ${dayStart(f.from)} && ?created < ${dayEndExclusive(f.to)})`,
    areaPattern(f.area),
  ]
    .filter(Boolean)
    .join('\n  ');
}

/* ------------------------------------------------------------------ */
/* FR1 · Mappa                                                          */
/* ------------------------------------------------------------------ */

export function markersQuery(f: Filters, allTypes: string[], bbox: Bbox | null, limit: number): string {
  return `${PREFIXES}
# Locations are minted from coordinates, so one point can carry several la311:address values.
# GROUP BY + SAMPLE keeps exactly one row (one marker) per request.
SELECT ?srNumber ?requestType ?status ?created ?wkt (SAMPLE(?addr) AS ?address)
WHERE {
  ?sr a la311:ServiceRequest ;
      la311:srNumber    ?srNumber ;
      la311:requestType ?requestType ;
      la311:status      ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ?loc geo:asWKT       ?wkt ;
       la311:latitude  ?lat ;
       la311:longitude ?lon .
  OPTIONAL { ?loc la311:address ?addr }
  ${filterBlock(f, { allTypes })}
  ${bboxFilter(bbox)}
}
GROUP BY ?srNumber ?requestType ?status ?created ?wkt
LIMIT ${int(limit)}`;
}

/** Densità: aggregazione su griglia regolare lato endpoint (cella = step gradi). */
export function densityQuery(f: Filters, allTypes: string[], step = 0.005, bbox: Bbox | null = null): string {
  const s = dec(step);
  return `${PREFIXES}
SELECT ?cellLat ?cellLon (COUNT(?sr) AS ?n)
WHERE {
  ?sr la311:requestType ?requestType ;
      la311:status      ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ?loc la311:latitude ?lat ;
       la311:longitude ?lon .
  ${filterBlock(f, { allTypes })}
  ${bboxFilter(bbox)}
  BIND (FLOOR(?lat / ${s}) * ${s} + ${s} / 2 AS ?cellLat)
  BIND (FLOOR(?lon / ${s}) * ${s} + ${s} / 2 AS ?cellLon)
}
GROUP BY ?cellLat ?cellLon`;
}

/** Conteggi per tipo con i filtri correnti, escluso quello sui tipi (legenda del pannello). */
export function typeCountsQuery(f: Filters): string {
  return `${PREFIXES}
SELECT ?requestType (COUNT(?sr) AS ?n)
WHERE {
  ?sr la311:requestType ?requestType ;
      la311:status      ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ?loc geo:asWKT ?wkt .
  ${filterBlock(f, { types: false })}
}
GROUP BY ?requestType
ORDER BY DESC(?n)`;
}

/* ------------------------------------------------------------------ */
/* FR2 · Ricerca e opzioni dei filtri                                   */
/* ------------------------------------------------------------------ */

const SR_NUMBER = /^\d-\d{6,}$/;

export function searchQuery(text: string, f: Filters, limit = 25): string {
  const term = text.trim();
  // Un numero SR identifica un record: si cerca in tutto l'estratto, ignorando i filtri.
  if (SR_NUMBER.test(term)) {
    return `${PREFIXES}
SELECT ?srNumber ?requestType ?status ?created ?address ?areaLabel ?wkt
WHERE {
  VALUES ?srNumber { ${str(term)} }
  ?sr la311:srNumber ?srNumber ;
      la311:requestType ?requestType ;
      la311:status ?status ;
      la311:createdDate ?created .
  OPTIONAL {
    ?sr la311:hasLocation ?loc .
    OPTIONAL { ?loc la311:address ?address }
    OPTIONAL { ?loc geo:asWKT ?wkt }
    OPTIONAL { ?loc la311:isWithin/rdfs:label ?areaLabel }
  }
}`;
  }
  // Indirizzo: sottostringa case-insensitive (gli indirizzi nel grafo sono in maiuscolo).
  return `${PREFIXES}
SELECT ?srNumber ?requestType ?status ?created (SAMPLE(?addr) AS ?address)
       (SAMPLE(?area) AS ?areaLabel) (SAMPLE(?geom) AS ?wkt)
WHERE {
  ?sr la311:srNumber ?srNumber ;
      la311:requestType ?requestType ;
      la311:status ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ?loc la311:address ?addr .
  FILTER (CONTAINS(LCASE(?addr), LCASE(${str(term)})))
  OPTIONAL { ?loc geo:asWKT ?geom }
  OPTIONAL { ?loc la311:isWithin/rdfs:label ?area }
  ${filterBlock(f, { types: true })}
}
GROUP BY ?srNumber ?requestType ?status ?created
ORDER BY DESC(?created)
LIMIT ${int(limit)}`;
}

export const FILTER_OPTIONS_QUERY = `${PREFIXES}
SELECT ?kind ?value ?label (COUNT(?sr) AS ?n)
WHERE {
  {
    ?sr la311:requestType ?value . BIND ("type" AS ?kind) BIND (?value AS ?label)
  } UNION {
    ?sr la311:status ?value .      BIND ("status" AS ?kind) BIND (?value AS ?label)
  } UNION {
    ?sr la311:hasLocation/la311:isWithin/la311:cd ?value .
    FILTER (?value != 0)
    BIND ("cd" AS ?kind) BIND (CONCAT("Council District ", STR(?value)) AS ?label)
  } UNION {
    ?sr la311:hasLocation/la311:isWithin ?region .
    ?region la311:nc ?value ; rdfs:label ?regionLabel .
    FILTER (?value != 0)
    BIND ("nc" AS ?kind)
    BIND (REPLACE(?regionLabel, " \\\\(CD [0-9]+\\\\)$", "") AS ?label)
  }
}
GROUP BY ?kind ?value ?label
ORDER BY ?kind DESC(?n)`;

/* ------------------------------------------------------------------ */
/* FR3 · Scheda record                                                  */
/* ------------------------------------------------------------------ */

export function recordQuery(srNumber: string): string {
  return `${PREFIXES}
SELECT ?sr ?srNumber ?requestType ?status ?created ?updated ?serviceDate ?closed
       ?actionTaken ?requestSource ?ownerNode ?owner ?serviceNode ?assignTo
       ?loc ?address ?zip ?approximate ?wkt
       ?region ?regionLabel ?cd ?nc ?apc ?policePrecinct ?ncWikidata ?cdMemberWikidata ?city
WHERE {
  VALUES ?srNumber { ${str(srNumber)} }
  ?sr la311:srNumber ?srNumber ;
      la311:requestType ?requestType ;
      la311:status ?status ;
      la311:createdDate ?created .
  OPTIONAL { ?sr la311:updatedDate ?updated }
  OPTIONAL { ?sr la311:serviceDate ?serviceDate }
  OPTIONAL { ?sr la311:closedDate ?closed }
  OPTIONAL { ?sr la311:actionTaken ?actionTaken }
  OPTIONAL { ?sr la311:requestSource ?requestSource }
  OPTIONAL { ?sr la311:responsible ?ownerNode . ?ownerNode la311:name ?owner }
  OPTIONAL { ?sr la311:assignedTo ?serviceNode . ?serviceNode la311:name ?assignTo }
  OPTIONAL {
    ?sr la311:hasLocation ?loc .
    OPTIONAL { ?loc la311:address ?address }
    OPTIONAL { ?loc la311:zipCode ?zip }
    OPTIONAL { ?loc la311:approximateAddress ?approximate }
    OPTIONAL { ?loc geo:asWKT ?wkt }
    OPTIONAL {
      ?loc la311:isWithin ?region .
      ?region rdfs:label ?regionLabel .
      OPTIONAL { ?region la311:cd ?cd }
      OPTIONAL { ?region la311:nc ?nc }
      OPTIONAL { ?region la311:apc ?apc }
      OPTIONAL { ?region la311:policePrecinct ?policePrecinct }
      OPTIONAL { ?region la311:ncName ?ncWikidata }
      OPTIONAL { ?region la311:cdMember ?cdMemberWikidata }
      OPTIONAL { ?region schema:containedInPlace ?city }
    }
  }
}
LIMIT 1`;
}

/** Da eseguire su query.wikidata.org: etichette inglesi degli IRI collegati. */
export function wikidataLabelsQuery(iris: string[]): string {
  const ids = iris.filter((iri) => /^http:\/\/www\.wikidata\.org\/entity\/Q\d+$/.test(iri));
  return `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
SELECT ?item ?label ?description WHERE {
  VALUES ?item { ${ids.map((i) => `<${i}>`).join(' ')} }
  ?item rdfs:label ?label . FILTER (LANG(?label) = "en")
  OPTIONAL { ?item schema:description ?description . FILTER (LANG(?description) = "en") }
}`;
}

/* ------------------------------------------------------------------ */
/* FR4 · Snapshot di area (Mockup C, non implementato nel prototipo)    */
/* ------------------------------------------------------------------ */

export function areaSummaryQuery(f: Filters): string {
  return `${PREFIXES}
SELECT ?requestType ?status (COUNT(?sr) AS ?n)
WHERE {
  ?sr la311:requestType ?requestType ;
      la311:status ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ${filterBlock(f, { types: true })}
}
GROUP BY ?requestType ?status
ORDER BY DESC(?n)`;
}

export function areaComparisonQuery(f: Filters): string {
  return `${PREFIXES}
SELECT ?cd (COUNT(?sr) AS ?n)
       (SUM(IF(?status IN ("Open", "Pending"), 1, 0)) AS ?openOrPending)
WHERE {
  ?sr la311:requestType ?requestType ;
      la311:status ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ?loc la311:isWithin/la311:cd ?cd .
  FILTER (?cd != 0)
  ${filterBlock({ ...f, area: null }, { types: true })}
}
GROUP BY ?cd
ORDER BY DESC(?n)`;
}

/* ------------------------------------------------------------------ */
/* FR5 · Estensione del dataset                                         */
/* ------------------------------------------------------------------ */

export const EXTENT_QUERY = `${PREFIXES}
SELECT (MIN(?created) AS ?first) (MAX(?created) AS ?last) (COUNT(?sr) AS ?records)
WHERE { ?sr a la311:ServiceRequest ; la311:createdDate ?created . }`;

/* ================================================================== */
/* Repository tipizzato: ciò che l'interfaccia usa davvero              */
/* ================================================================== */

export interface MapPoint extends LatLng {
  srNumber: string;
  requestType: string;
  status: string;
  created: Date;
  address?: string;
}

export interface DensityCell extends LatLng {
  n: number;
}

export interface FilterOptions {
  types: { value: string; n: number }[];
  statuses: { value: string; n: number }[];
  councilDistricts: { value: string; label: string; n: number }[];
  neighborhoodCouncils: { value: string; label: string; n: number }[];
}

export interface SearchHit {
  srNumber: string;
  requestType: string;
  status: string;
  created: Date;
  address?: string;
  areaLabel?: string;
  point: LatLng | null;
}

export type RecordDetails = Row;

const s = (v: unknown) => (v === undefined ? undefined : String(v));

export class La311Repository {
  constructor(
    private readonly client: SparqlClient,
    private readonly wikidata?: SparqlClient,
  ) {}

  async filterOptions(signal?: AbortSignal): Promise<FilterOptions> {
    const rows = await this.client.select(FILTER_OPTIONS_QUERY, signal, 'FR2 · filter options');
    const pick = (kind: string) =>
      rows
        .filter((r) => r.kind === kind)
        .map((r) => ({ value: String(r.value), label: String(r.label), n: Number(r.n) }));
    return {
      types: pick('type'),
      statuses: pick('status'),
      councilDistricts: pick('cd').sort((a, b) => Number(a.value) - Number(b.value)),
      neighborhoodCouncils: pick('nc').sort((a, b) => a.label.localeCompare(b.label)),
    };
  }

  /** Punti per i marker. `truncated` indica che è stato raggiunto il LIMIT. */
  async markers(
    f: Filters,
    allTypes: string[],
    bbox: Bbox | null,
    limit: number,
    signal?: AbortSignal,
  ): Promise<{ points: MapPoint[]; truncated: boolean }> {
    if (f.types.length === 0) return { points: [], truncated: false };
    const rows = await this.client.select(markersQuery(f, allTypes, bbox, limit), signal, 'FR1 · map markers');
    const points: MapPoint[] = [];
    for (const r of rows) {
      const p = parseWktPoint(String(r.wkt));
      if (!p) continue; // geometria non interpretabile: la si salta invece di disegnarla in (0,0)
      points.push({
        ...p,
        srNumber: String(r.srNumber),
        requestType: String(r.requestType),
        status: String(r.status),
        created: r.created as Date,
        address: s(r.address),
      });
    }
    return { points, truncated: rows.length >= limit };
  }

  async density(
    f: Filters,
    allTypes: string[],
    step: number,
    bbox: Bbox | null,
    signal?: AbortSignal,
  ): Promise<DensityCell[]> {
    if (f.types.length === 0) return [];
    const rows = await this.client.select(densityQuery(f, allTypes, step, bbox), signal, 'FR1 · density grid');
    return rows.map((r) => ({ lat: Number(r.cellLat), lng: Number(r.cellLon), n: Number(r.n) }));
  }

  async typeCounts(f: Filters, signal?: AbortSignal): Promise<Map<string, number>> {
    const rows = await this.client.select(typeCountsQuery(f), signal, 'FR1 · type counts');
    return new Map(rows.map((r) => [String(r.requestType), Number(r.n)]));
  }

  async search(text: string, f: Filters, signal?: AbortSignal): Promise<SearchHit[]> {
    const rows = await this.client.select(searchQuery(text, f), signal, 'FR2 · search');
    return rows.map((r) => ({
      srNumber: String(r.srNumber),
      requestType: String(r.requestType),
      status: String(r.status),
      created: r.created as Date,
      address: s(r.address),
      areaLabel: s(r.areaLabel),
      point: r.wkt ? parseWktPoint(String(r.wkt)) : null,
    }));
  }

  async record(srNumber: string, signal?: AbortSignal): Promise<RecordDetails | null> {
    const rows = await this.client.select(recordQuery(srNumber), signal, 'FR3 · record');
    return rows[0] ?? null;
  }

  /** Etichette Wikidata (best effort: se Wikidata non risponde la scheda resta valida). */
  async wikidataLabels(iris: string[], signal?: AbortSignal): Promise<Map<string, string>> {
    if (!this.wikidata || iris.length === 0) return new Map();
    try {
      const rows = await this.wikidata.select(wikidataLabelsQuery(iris), signal, 'FR3 · Wikidata labels');
      return new Map(rows.map((r) => [String(r.item), String(r.label)]));
    } catch {
      return new Map();
    }
  }

  async extent(signal?: AbortSignal): Promise<{ first: Date; last: Date; records: number }> {
    const [r] = await this.client.select(EXTENT_QUERY, signal, 'FR5 · dataset extent');
    return { first: r.first as Date, last: r.last as Date, records: Number(r.records) };
  }
}

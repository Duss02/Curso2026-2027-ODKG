/**
 * Query "linked data" per la demo: join federati con Wikidata, navigazione
 * di qualunque IRI (follow your nose) e statistiche del grafo.
 *
 * Federazione: la query gira sul NOSTRO endpoint (GraphDB), che chiama Wikidata con
 * SERVICE <https://query.wikidata.org/sparql>. GraphDB valuta il SERVICE nella
 * posizione in cui è scritto:
 *   - SERVICE dopo la parte locale  → "bound join": una richiesta a Wikidata per
 *     ogni valore trovato (≈ 8 s per 15 distretti);
 *   - SERVICE per primo, con gli IRI in un unico VALUES → una sola richiesta (≈ 0,7 s).
 * Si usa quindi il secondo schema, in due passi:
 *   1) query locale che raccoglie gli IRI Wikidata collegati nel grafo (pochi ms);
 *   2) query federata: SERVICE { VALUES ?iri {…} … } seguita dal join con i conteggi locali.
 */
import type { Filters } from '../state';
import type { Row, SparqlClient } from './client';
import { filterBlock } from './queries';
import { parseWktPoint, type LatLng } from './terms';

export const LD_PREFIXES = `PREFIX la311:  <http://linkeddata.la311.com/ontology#>
PREFIX rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs:   <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:    <http://www.w3.org/2002/07/owl#>
PREFIX xsd:    <http://www.w3.org/2001/XMLSchema#>
PREFIX geo:    <http://www.opengis.net/ont/geosparql#>
PREFIX schema: <http://schema.org/>
PREFIX wd:     <http://www.wikidata.org/entity/>
PREFIX wdt:    <http://www.wikidata.org/prop/direct/>
`;

const WDQS = '<https://query.wikidata.org/sparql>';
const LOCAL_NS = 'http://linkeddata.la311.com/';
const WD_ENTITY = /^http:\/\/www\.wikidata\.org\/entity\/Q\d+$/;

export const isWikidata = (iri: string) => WD_ENTITY.test(iri);
export const isLocal = (iri: string) => iri.startsWith(LOCAL_NS);

/** IRI validato, pronto per essere scritto tra < > in una query. */
export function iriRef(iri: string): string {
  if (!/^https?:\/\/[^\s<>"{}|\\^`]+$/.test(iri)) throw new TypeError(`IRI non valido: ${iri}`);
  return `<${iri}>`;
}

/* ------------------------------------------------------------------ */
/* Distretti consiliari × consiglieri su Wikidata                       */
/* ------------------------------------------------------------------ */

export const LINKED_MEMBERS_QUERY = `${LD_PREFIXES}
# Step 1: which Wikidata council members are linked from our graph?
SELECT DISTINCT ?member WHERE { ?region la311:cdMember ?member }`;

const wdValues = (variable: string, iris: string[]) =>
  `VALUES ?${variable} { ${iris.filter(isWikidata).map((i) => `wd:${i.split('/').pop()}`).join(' ')} }`;

/** Conteggi locali per distretto, inclusi quelli senza consigliere collegato. */
export function districtCountsQuery(f: Filters, allTypes: string[] = []): string {
  return `${LD_PREFIXES}
SELECT ?cd (COUNT(?sr) AS ?n) (SUM(IF(?status IN ("Open", "Pending"), 1, 0)) AS ?openOrPending)
WHERE {
  ?sr la311:requestType ?requestType ;
      la311:status ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ?loc la311:isWithin/la311:cd ?cd .
  FILTER (?cd != 0)
  ${filterBlock({ ...f, area: null }, { allTypes })}
}
GROUP BY ?cd
ORDER BY DESC(?n)`;
}

export function districtsFederatedQuery(f: Filters, members: string[], allTypes: string[] = []): string {
  return `${LD_PREFIXES}
# Step 2: ONE query joining council-member data (Wikidata) with request counts (our graph).
# The SERVICE comes first so GraphDB sends a single request with all linked IRIs.
SELECT ?cd ?n ?member
       (SAMPLE(?nm) AS ?name) (SAMPLE(?ds) AS ?description) (SAMPLE(?img) AS ?image)
       (GROUP_CONCAT(DISTINCT ?pl; separator=", ") AS ?party) (SAMPLE(?art) AS ?article)
WHERE {
  SERVICE ${WDQS} {
    ${wdValues('member', members)}
    OPTIONAL { ?member rdfs:label ?nm . FILTER (LANG(?nm) IN ("en", "mul")) }
    OPTIONAL { ?member schema:description ?ds . FILTER (LANG(?ds) = "en") }
    OPTIONAL { ?member wdt:P18 ?img }
    OPTIONAL { ?member wdt:P102 ?p . ?p rdfs:label ?pl . FILTER (LANG(?pl) = "en") }
    OPTIONAL { ?art schema:about ?member ; schema:isPartOf <https://en.wikipedia.org/> }
  }
  {
    SELECT ?cd ?member (COUNT(?sr) AS ?n)
    WHERE {
      ?sr la311:requestType ?requestType ;
          la311:status ?status ;
          la311:createdDate ?created ;
          la311:hasLocation ?loc .
      ?loc la311:isWithin ?region .
      ?region la311:cd ?cd ;
              la311:cdMember ?member .
      ${filterBlock({ ...f, area: null }, { allTypes })}
    }
    GROUP BY ?cd ?member
  }
}
GROUP BY ?cd ?n ?member
ORDER BY DESC(?n)`;
}

export function districtTopTypesQuery(f: Filters, allTypes: string[] = []): string {
  return `${LD_PREFIXES}
SELECT ?cd ?requestType (COUNT(?sr) AS ?n)
WHERE {
  ?sr la311:requestType ?requestType ;
      la311:status ?status ;
      la311:createdDate ?created ;
      la311:hasLocation ?loc .
  ?loc la311:isWithin/la311:cd ?cd .
  FILTER (?cd != 0)
  ${filterBlock({ ...f, area: null }, { allTypes })}
}
GROUP BY ?cd ?requestType
ORDER BY ?cd DESC(?n)`;
}

/* ------------------------------------------------------------------ */
/* Quartieri: coordinate e dati da Wikidata, conteggi dal nostro grafo  */
/* ------------------------------------------------------------------ */

export const LINKED_NEIGHBORHOODS_QUERY = `${LD_PREFIXES}
# Step 1: Wikidata entities linked to our Neighborhood Councils (la311:ncName / owl:sameAs)
SELECT DISTINCT ?nc WHERE { ?region la311:ncName ?nc }`;

export function neighborhoodsFederatedQuery(f: Filters, ncs: string[], allTypes: string[] = []): string {
  return `${LD_PREFIXES}
# Step 2: coordinates (P625), image, population and Wikipedia article from Wikidata,
# joined with request counts per neighborhood from our graph. SERVICE first = one request.
SELECT ?nc ?n (SAMPLE(?lbl) AS ?label) (SAMPLE(?ds) AS ?description) (SAMPLE(?c) AS ?coord)
       (SAMPLE(?img) AS ?image) (MAX(?pop) AS ?population) (SAMPLE(?art) AS ?article)
WHERE {
  SERVICE ${WDQS} {
    ${wdValues('nc', ncs)}
    OPTIONAL { ?nc rdfs:label ?lbl . FILTER (LANG(?lbl) IN ("en", "mul")) }
    OPTIONAL { ?nc schema:description ?ds . FILTER (LANG(?ds) = "en") }
    OPTIONAL { ?nc wdt:P625 ?c }
    OPTIONAL { ?nc wdt:P18 ?img }
    OPTIONAL { ?nc wdt:P1082 ?pop }
    OPTIONAL { ?art schema:about ?nc ; schema:isPartOf <https://en.wikipedia.org/> }
  }
  {
    SELECT ?nc (COUNT(?sr) AS ?n)
    WHERE {
      ?sr la311:requestType ?requestType ;
          la311:status ?status ;
          la311:createdDate ?created ;
          la311:hasLocation ?loc .
      ?loc la311:isWithin/la311:ncName ?nc .
      ${filterBlock({ ...f, area: null }, { allTypes })}
    }
    GROUP BY ?nc
  }
}
GROUP BY ?nc ?n`;
}

/* ------------------------------------------------------------------ */
/* Resource browser (follow your nose)                                  */
/* ------------------------------------------------------------------ */

export function outgoingQuery(iri: string): string {
  return `${LD_PREFIXES}
SELECT ?p ?o WHERE { ${iriRef(iri)} ?p ?o } ORDER BY ?p LIMIT 300`;
}

export function incomingQuery(iri: string): string {
  return `${LD_PREFIXES}
SELECT ?p (COUNT(?s) AS ?n) (SAMPLE(?s) AS ?example) (SAMPLE(?sl) AS ?exampleLabel)
WHERE { ?s ?p ${iriRef(iri)} . OPTIONAL { ?s rdfs:label ?sl } }
GROUP BY ?p ORDER BY DESC(?n)`;
}

/** Quante richieste raggiungono questo nodo, e attraverso quale cammino del grafo. */
export function requestPathsQuery(iri: string): string {
  const target = iriRef(iri);
  const paths = [
    'la311:responsible',
    'la311:assignedTo',
    'la311:hasLocation',
    'la311:hasLocation/la311:isWithin',
    'la311:hasLocation/la311:isWithin/la311:cdMember',
    'la311:hasLocation/la311:isWithin/la311:ncName',
    'la311:hasLocation/la311:isWithin/schema:containedInPlace',
  ];
  return `${LD_PREFIXES}
SELECT ?path (COUNT(DISTINCT ?sr) AS ?n)
WHERE {
${paths.map((p) => `  { ?sr ${p} ${target} . BIND ("${p}" AS ?path) }`).join('\n  UNION\n')}
}
GROUP BY ?path ORDER BY DESC(?n)`;
}

/** Eseguita direttamente su Wikidata: intestazione dell'entità. */
export function wikidataHeaderQuery(iri: string): string {
  return `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
SELECT (SAMPLE(?l) AS ?label) (SAMPLE(?d) AS ?description) (SAMPLE(?i) AS ?image) (SAMPLE(?a) AS ?article)
WHERE {
  VALUES ?item { ${iriRef(iri)} }
  OPTIONAL { ?item rdfs:label ?l . FILTER (LANG(?l) IN ("en", "mul")) }
  OPTIONAL { ?item schema:description ?d . FILTER (LANG(?d) = "en") }
  OPTIONAL { ?item wdt:P18 ?i }
  OPTIONAL { ?a schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
}`;
}

/** Eseguita direttamente su Wikidata: affermazioni leggibili (niente identificatori esterni). */
export function wikidataFactsQuery(iri: string): string {
  return `PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
SELECT ?prop ?propLabel ?value ?valueLabel
WHERE {
  VALUES ?item { ${iriRef(iri)} }
  ?item ?p ?value .
  ?prop wikibase:directClaim ?p ; wikibase:propertyType ?type .
  FILTER (?type IN (wikibase:WikibaseItem, wikibase:Time, wikibase:Quantity, wikibase:String,
                    wikibase:Url, wikibase:GlobeCoordinate, wikibase:Monolingualtext))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}
LIMIT 80`;
}

/* ------------------------------------------------------------------ */
/* Il grafo nel suo insieme                                             */
/* ------------------------------------------------------------------ */

/*
 * GraphDB materializza le inferenze del ruleset (RDFS-Plus): i grafi virtuali
 * <http://www.ontotext.com/explicit> e <http://www.ontotext.com/implicit> separano
 * le triple caricate da quelle dedotte. Le statistiche usano solo quelle esplicite.
 */
const EXPLICIT = 'FROM <http://www.ontotext.com/explicit>';

export const TRIPLE_COUNT_QUERY = `# Triples loaded from our Turtle file
SELECT (COUNT(*) AS ?triples) ${EXPLICIT} WHERE { ?s ?p ?o }`;

export const INFERRED_COUNT_QUERY = `# Triples inferred by GraphDB's RDFS-Plus ruleset
SELECT (COUNT(*) AS ?triples) FROM <http://www.ontotext.com/implicit> WHERE { ?s ?p ?o }`;

export const CLASS_COUNTS_QUERY = `${LD_PREFIXES}
SELECT ?class (COUNT(?s) AS ?n) (SAMPLE(?s) AS ?example)
${EXPLICIT}
WHERE { ?s a ?class }
GROUP BY ?class ORDER BY DESC(?n)`;

export const PREDICATE_COUNTS_QUERY = `${LD_PREFIXES}
SELECT ?p (COUNT(*) AS ?n) ${EXPLICIT} WHERE { ?s ?p ?o } GROUP BY ?p ORDER BY DESC(?n)`;

export const EXTERNAL_LINKS_QUERY = `${LD_PREFIXES}
# Outgoing links to external datasets (anything outside the linkeddata.la311.com namespace)
SELECT ?p (COUNT(*) AS ?links) (COUNT(DISTINCT ?o) AS ?targets) (SAMPLE(?o) AS ?example)
${EXPLICIT}
WHERE {
  ?s ?p ?o .
  FILTER (isIRI(?o) && ?p != rdf:type && !STRSTARTS(STR(?o), "${LOCAL_NS}"))
}
GROUP BY ?p ORDER BY DESC(?links)`;

/* ================================================================== */
/* Repository                                                           */
/* ================================================================== */

export interface District {
  cd: number;
  n: number;
  openOrPending: number;
  member?: string;
  name?: string;
  description?: string;
  image?: string;
  party?: string;
  article?: string;
  topTypes: { type: string; n: number }[];
}

export interface Neighborhood extends LatLng {
  nc: string;
  n: number;
  label?: string;
  description?: string;
  image?: string;
  population?: number;
  article?: string;
}

export interface ResourceView {
  iri: string;
  outgoing: { p: string; o: string; isIri: boolean }[];
  incoming: { p: string; n: number; example: string; exampleLabel?: string }[];
  paths: { path: string; n: number }[];
  wikidata?: {
    label?: string;
    description?: string;
    image?: string;
    article?: string;
    facts: { prop: string; propLabel: string; value: string; valueLabel: string }[];
  };
}

export interface GraphStats {
  /** Triple caricate (esplicite). */
  triples: number;
  /** Triple dedotte da GraphDB. */
  inferred: number;
  classes: { cls: string; n: number; example: string }[];
  predicates: Map<string, number>;
  external: { p: string; links: number; targets: number; example: string }[];
}

const opt = (v: unknown) => (v === undefined || v === '' ? undefined : String(v));

export class LinkedRepository {
  constructor(
    private readonly kg: SparqlClient,
    private readonly wikidata: SparqlClient,
  ) {}

  async districts(f: Filters, allTypes: string[], signal?: AbortSignal): Promise<District[]> {
    const members = (await this.kg.select(LINKED_MEMBERS_QUERY, signal, 'LD · linked council members')).map((r) =>
      String(r.member),
    );
    const [counts, linked, types] = await Promise.all([
      this.kg.select(districtCountsQuery(f, allTypes), signal, 'LD · requests per district'),
      this.kg.select(districtsFederatedQuery(f, members, allTypes), signal, 'LD · districts ⋈ Wikidata (federated)'),
      this.kg.select(districtTopTypesQuery(f, allTypes), signal, 'LD · top types per district'),
    ]);
    // Tutti i distretti dai conteggi locali; i dati Wikidata dove esiste il link.
    const byCd = new Map(linked.map((r) => [Number(r.cd), r]));
    return counts.map((c) => {
      const cd = Number(c.cd);
      const r = byCd.get(cd);
      return {
        cd,
        n: Number(c.n),
        openOrPending: Number(c.openOrPending),
        member: r && isWikidata(String(r.member)) ? String(r.member) : undefined,
        name: opt(r?.name),
        description: opt(r?.description),
        image: opt(r?.image),
        party: opt(r?.party),
        article: opt(r?.article),
        topTypes: types
          .filter((t) => Number(t.cd) === cd)
          .slice(0, 3)
          .map((t) => ({ type: String(t.requestType), n: Number(t.n) })),
      };
    });
  }

  async neighborhoods(f: Filters, allTypes: string[], signal?: AbortSignal): Promise<Neighborhood[]> {
    const ncs = (await this.kg.select(LINKED_NEIGHBORHOODS_QUERY, signal, 'LD · linked neighborhoods')).map((r) =>
      String(r.nc),
    );
    const rows = await this.kg.select(
      neighborhoodsFederatedQuery(f, ncs, allTypes),
      signal,
      'LD · neighborhoods ⋈ Wikidata (federated)',
    );
    const out: Neighborhood[] = [];
    for (const r of rows) {
      const point = r.coord ? parseWktPoint(String(r.coord)) : null;
      if (!point) continue;
      out.push({
        ...point,
        nc: String(r.nc),
        n: Number(r.n),
        label: opt(r.label),
        description: opt(r.description),
        image: opt(r.image),
        population: r.population === undefined ? undefined : Number(r.population),
        article: opt(r.article),
      });
    }
    return out;
  }

  async resource(iri: string, signal?: AbortSignal): Promise<ResourceView> {
    const short = iri.split('/').pop();
    const local = Promise.all([
      this.kg.selectRaw(outgoingQuery(iri), signal, `LD · ${short} → outgoing`),
      this.kg.select(incomingQuery(iri), signal, `LD · ${short} ← incoming`),
      this.kg.select(requestPathsQuery(iri), signal, `LD · requests reaching ${short}`),
    ]);
    const remote = isWikidata(iri)
      ? Promise.all([
          this.wikidata.select(wikidataHeaderQuery(iri), signal, `Wikidata · ${short} header`),
          this.wikidata.select(wikidataFactsQuery(iri), signal, `Wikidata · ${short} statements`),
        ]).catch(() => null)
      : Promise.resolve(null);

    const [[out, inc, paths], wd] = await Promise.all([local, remote]);
    const view: ResourceView = {
      iri,
      outgoing: out.results.bindings.map((b) => ({ p: b.p.value, o: b.o.value, isIri: b.o.type === 'uri' })),
      incoming: inc.map((r: Row) => ({
        p: String(r.p),
        n: Number(r.n),
        example: String(r.example),
        exampleLabel: opt(r.exampleLabel),
      })),
      paths: paths.map((r) => ({ path: String(r.path), n: Number(r.n) })).filter((x) => x.n > 0),
    };
    if (wd) {
      const [header, facts] = wd;
      const h = header[0] ?? {};
      view.wikidata = {
        label: opt(h.label),
        description: opt(h.description),
        image: opt(h.image),
        article: opt(h.article),
        facts: facts.map((r) => ({
          prop: String(r.prop),
          propLabel: String(r.propLabel),
          value: String(r.value instanceof Date ? r.value.toISOString().slice(0, 10) : r.value),
          valueLabel: String(r.valueLabel instanceof Date ? r.valueLabel.toISOString().slice(0, 10) : r.valueLabel),
        })),
      };
    }
    return view;
  }

  async graphStats(signal?: AbortSignal): Promise<GraphStats> {
    const [t, i, c, p, e] = await Promise.all([
      this.kg.select(TRIPLE_COUNT_QUERY, signal, 'Graph · explicit triples'),
      this.kg.select(INFERRED_COUNT_QUERY, signal, 'Graph · inferred triples'),
      this.kg.select(CLASS_COUNTS_QUERY, signal, 'Graph · instances per class'),
      this.kg.select(PREDICATE_COUNTS_QUERY, signal, 'Graph · triples per predicate'),
      this.kg.select(EXTERNAL_LINKS_QUERY, signal, 'Graph · external links'),
    ]);
    return {
      triples: Number(t[0]?.triples ?? 0),
      inferred: Number(i[0]?.triples ?? 0),
      classes: c.map((r) => ({ cls: String(r.class), n: Number(r.n), example: String(r.example) })),
      predicates: new Map(p.map((r) => [String(r.p), Number(r.n)])),
      external: e.map((r) => ({
        p: String(r.p),
        links: Number(r.links),
        targets: Number(r.targets),
        example: String(r.example),
      })),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Utilità di presentazione                                             */
/* ------------------------------------------------------------------ */

const PREFIX_MAP: [string, string][] = [
  ['http://linkeddata.la311.com/ontology#', 'la311:'],
  ['http://linkeddata.la311.com/resource/', 'res:'],
  ['http://www.w3.org/1999/02/22-rdf-syntax-ns#', 'rdf:'],
  ['http://www.w3.org/2000/01/rdf-schema#', 'rdfs:'],
  ['http://www.w3.org/2002/07/owl#', 'owl:'],
  ['http://www.opengis.net/ont/geosparql#', 'geo:'],
  ['http://schema.org/', 'schema:'],
  ['http://www.wikidata.org/entity/', 'wd:'],
  ['http://www.wikidata.org/prop/direct/', 'wdt:'],
];

/** IRI in forma compatta (CURIE) per la UI. */
export function curie(iri: string): string {
  for (const [ns, prefix] of PREFIX_MAP) if (iri.startsWith(ns)) return prefix + decodeURIComponent(iri.slice(ns.length));
  return iri;
}

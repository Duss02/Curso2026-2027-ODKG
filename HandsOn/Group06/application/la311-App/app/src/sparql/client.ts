/**
 * Client SPARQL 1.1 Protocol minimale, senza dipendenze.
 *
 * - POST application/x-www-form-urlencoded (niente limiti di lunghezza dell'URL
 *   quando i VALUES contengono molti tipi di richiesta).
 * - Accept: application/sparql-results+json (formato W3C "SPARQL 1.1 Query Results JSON").
 * - AbortSignal esterno + timeout, così una nuova interazione annulla la query precedente.
 * - Cache in memoria per testo di query: i filtri ripetuti non rifanno la richiesta.
 */

export type RdfTerm =
  | { type: 'uri'; value: string }
  | { type: 'bnode'; value: string }
  | { type: 'literal'; value: string; datatype?: string; 'xml:lang'?: string };

export interface SelectResults {
  head: { vars: string[] };
  results: { bindings: Record<string, RdfTerm>[] };
}

/** Valore JS ottenuto da un termine RDF (vedi parseTerm). */
export type JsValue = string | number | boolean | Date;
export type Row = Record<string, JsValue | undefined>;

const XSD = 'http://www.w3.org/2001/XMLSchema#';
const NUMERIC = new Set(
  ['integer', 'decimal', 'double', 'float', 'int', 'long', 'short', 'nonNegativeInteger', 'positiveInteger'].map(
    (t) => XSD + t,
  ),
);
const TEMPORAL = new Set([XSD + 'dateTime', XSD + 'date']);

/** Converte un termine RDF nel tipo JS più utile in base al datatype XSD. */
export function parseTerm(term: RdfTerm): JsValue {
  if (term.type !== 'literal' || !term.datatype) return term.value;
  if (NUMERIC.has(term.datatype)) return Number(term.value);
  if (TEMPORAL.has(term.datatype)) return new Date(term.value);
  if (term.datatype === XSD + 'boolean') return term.value === 'true';
  // geo:wktLiteral e xsd:string restano stringhe: la geometria si interpreta con parseWktPoint.
  return term.value;
}

export class SparqlError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly query?: string,
  ) {
    super(message);
    this.name = 'SparqlError';
  }
}

export interface SparqlClientOptions {
  endpoint: string;
  /** Nome mostrato nello SPARQL Inspector ("LA311 KG", "Wikidata"). */
  name: string;
  timeoutMs?: number;
  cacheSize?: number;
  /**
   * Salva in localStorage (24 h) i risultati delle query verso Wikidata e di quelle
   * federate: una demo "riscaldata" non dipende dalla disponibilità di Wikidata.
   */
  persistRemote?: boolean;
}

const PERSIST_TTL_MS = 24 * 60 * 60 * 1000;

function persistKey(endpoint: string, query: string): string {
  // Hash FNV-1a: chiave corta e stabile per endpoint + testo della query.
  let h = 0x811c9dc5;
  for (const ch of endpoint + '\n' + query) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return `la311-sparql:${(h >>> 0).toString(16)}:${query.length}`;
}

function readPersisted(key: string): SelectResults | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, json } = JSON.parse(raw) as { at: number; json: SelectResults };
    return Date.now() - at < PERSIST_TTL_MS ? json : null;
  } catch {
    return null;
  }
}

function writePersisted(key: string, json: SelectResults): void {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), json }));
  } catch {
    /* quota piena o storage non disponibile: si continua senza */
  }
}

/* ------------------------------------------------------------------ */
/* Registro delle query: alimenta lo SPARQL Inspector della demo        */
/* ------------------------------------------------------------------ */

export type QueryKind = 'local' | 'wikidata' | 'federated';
export type QueryStatus = 'running' | 'ok' | 'cached' | 'error' | 'aborted';

export interface QueryLogEntry {
  id: number;
  label: string;
  endpointName: string;
  endpoint: string;
  kind: QueryKind;
  query: string;
  startedAt: Date;
  ms?: number;
  rows?: number;
  status: QueryStatus;
  error?: string;
}

type LogListener = (entry: QueryLogEntry) => void;
const logListeners = new Set<LogListener>();
let nextId = 1;

/** Ogni query (inizio e fine) viene notificata ai listener registrati qui. */
export function onQueryLog(listener: LogListener): () => void {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
}

function emit(entry: QueryLogEntry): void {
  logListeners.forEach((l) => l({ ...entry }));
}

const allClients = new Set<SparqlClient>();

/** Svuota cache in memoria e localStorage: per mostrare in demo le query "dal vivo". */
export function clearAllCaches(): number {
  let removed = 0;
  allClients.forEach((c) => c.clearCache());
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('la311-sparql:')) {
        localStorage.removeItem(key);
        removed++;
      }
    }
  } catch {
    /* storage non disponibile */
  }
  return removed;
}

export class SparqlClient {
  private readonly cache = new Map<string, SelectResults>();
  private readonly timeoutMs: number;
  private readonly cacheSize: number;

  constructor(private readonly opts: SparqlClientOptions) {
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.cacheSize = opts.cacheSize ?? 50;
    allClients.add(this);
  }

  clearCache(): void {
    this.cache.clear();
  }

  get endpoint(): string {
    return this.opts.endpoint;
  }

  private kindOf(query: string): QueryKind {
    if (/\bSERVICE\s*</i.test(query)) return 'federated';
    return /wikidata\.org/.test(this.opts.endpoint) ? 'wikidata' : 'local';
  }

  /** Esegue una SELECT e restituisce il JSON grezzo (con cache LRU semplice). */
  async selectRaw(query: string, signal?: AbortSignal, label = 'query'): Promise<SelectResults> {
    const entry: QueryLogEntry = {
      id: nextId++,
      label,
      endpointName: this.opts.name,
      endpoint: this.opts.endpoint,
      kind: this.kindOf(query),
      query,
      startedAt: new Date(),
      status: 'running',
    };

    const persist = this.opts.persistRemote && entry.kind !== 'local';
    const key = persist ? persistKey(this.opts.endpoint, query) : '';
    const cached = this.cache.get(query) ?? (persist ? readPersisted(key) : null);
    if (cached) {
      // Rinfresca la posizione LRU.
      this.cache.delete(query);
      this.cache.set(query, cached);
      emit({ ...entry, status: 'cached', ms: 0, rows: cached.results.bindings.length });
      return cached;
    }
    emit(entry);
    const t0 = performance.now();

    const timeout = AbortSignal.timeout(this.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let response: Response;
    try {
      response = await fetch(this.opts.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: 'application/sparql-results+json',
        },
        body: new URLSearchParams({ query }),
        signal: combined,
      });
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      if (signal?.aborted) {
        emit({ ...entry, status: 'aborted', ms });
        throw err; // annullata dall'utente: la gestisce il chiamante
      }
      const message = timeout.aborted
        ? `Timeout dopo ${this.timeoutMs} ms`
        : `Endpoint SPARQL non raggiungibile (${this.opts.endpoint})`;
      emit({ ...entry, status: 'error', ms, error: message });
      throw new SparqlError(message, undefined, query);
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      emit({ ...entry, status: 'error', ms: Math.round(performance.now() - t0), error: detail });
      throw new SparqlError(`HTTP ${response.status}: ${detail}`, response.status, query);
    }
    const json = (await response.json()) as SelectResults;
    emit({ ...entry, status: 'ok', ms: Math.round(performance.now() - t0), rows: json.results.bindings.length });

    this.cache.set(query, json);
    if (persist) writePersisted(key, json);
    if (this.cache.size > this.cacheSize) {
      this.cache.delete(this.cache.keys().next().value as string);
    }
    return json;
  }

  /** Esegue una SELECT e converte ogni binding in un oggetto con valori JS tipizzati. */
  async select(query: string, signal?: AbortSignal, label?: string): Promise<Row[]> {
    const json = await this.selectRaw(query, signal, label);
    return json.results.bindings.map((binding) => {
      const row: Row = {};
      for (const [name, term] of Object.entries(binding)) row[name] = parseTerm(term);
      return row;
    });
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

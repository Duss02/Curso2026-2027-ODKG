/**
 * Serializzazione sicura dei valori dell'interfaccia in termini SPARQL
 * e parsing della geometria WKT.
 *
 * Le query vengono costruite come stringhe: OGNI valore proveniente dall'utente
 * passa da queste funzioni, mai concatenato direttamente (evita "SPARQL injection").
 */

/** Letterale stringa con escape secondo la grammatica SPARQL 1.1 (STRING_LITERAL2). */
export function str(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/** Intero validato (es. numero di Council District / Neighborhood Council). */
export function int(value: number | string): string {
  const n = Number(value);
  if (!Number.isInteger(n)) throw new TypeError(`Intero non valido: ${value}`);
  return String(n);
}

/** Numero decimale validato (coordinate della viewport). */
export function dec(value: number): string {
  if (!Number.isFinite(value)) throw new TypeError(`Numero non valido: ${value}`);
  return value.toFixed(6);
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "2025-03-12" -> "2025-03-12T00:00:00Z"^^xsd:dateTime (inizio giornata, UTC). */
export function dayStart(day: string): string {
  if (!ISO_DAY.test(day)) throw new TypeError(`Data non valida: ${day}`);
  return `"${day}T00:00:00Z"^^xsd:dateTime`;
}

/** Fine giornata esclusiva: il giorno successivo a mezzanotte, per un intervallo [from, to]. */
export function dayEndExclusive(day: string): string {
  if (!ISO_DAY.test(day)) throw new TypeError(`Data non valida: ${day}`);
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return `"${next.toISOString().slice(0, 10)}T00:00:00Z"^^xsd:dateTime`;
}

/** Blocco VALUES per una variabile; restituisce '' se la lista è vuota (= nessun vincolo). */
export function values(variable: string, items: string[]): string {
  if (items.length === 0) return '';
  return `VALUES ?${variable} { ${items.map(str).join(' ')} }`;
}

export interface LatLng {
  lat: number;
  lng: number;
}

const WKT_POINT = /^\s*(?:<([^>]+)>\s*)?POINT\s*(?:Z\s*)?\(\s*([-+\d.eE]+)\s+([-+\d.eE]+)/i;

/**
 * Interpreta un geo:wktLiteral di tipo POINT.
 *
 * GeoSPARQL: senza IRI di CRS il sistema di default è CRS84 con ordine (lon lat),
 * che è il caso del dataset ("POINT (-118.29 33.70)"). Se il letterale dichiara
 * esplicitamente EPSG:4326, l'ordine ufficiale degli assi è (lat lon).
 */
export function parseWktPoint(wkt: string): LatLng | null {
  const m = WKT_POINT.exec(wkt);
  if (!m) return null;
  const crs = m[1] ?? '';
  const a = Number(m[2]);
  const b = Number(m[3]);
  const latFirst = /EPSG\/0\/4326$/.test(crs);
  const point = latFirst ? { lat: a, lng: b } : { lat: b, lng: a };
  if (Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return null;
  return point;
}

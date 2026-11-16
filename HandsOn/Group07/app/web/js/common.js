// Helpers shared by the map and the station detail panel.

// Colour classes for an arrival delay (upper bound inclusive, in minutes).
// The ≤ 1 min class exists because most stations are on time and would otherwise share one colour.
export const DELAY_CLASSES = [
  { max: 1, color: "#1a9641", label: "≤ 1 min" },
  { max: 5, color: "#a6d96a", label: "1–5 min" },
  { max: 15, color: "#fdae61", label: "5–15 min" },
  { max: Infinity, color: "#d7191c", label: "> 15 min" },
];

export function delayClass(delayMinutes) {
  return DELAY_CLASSES.find(({ max }) => delayMinutes <= max);
}

// Also support older graph exports whose station labels had a "Station:" prefix.
export function stationName(label) {
  return label.replace(/^Station:/, "");
}

// Builds DOM nodes with textContent, so labels from the KG or Wikidata are never interpreted as HTML
// (Leaflet inserts string content of tooltips and popups as HTML).
export function textElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function toQid(wikidataUri) {
  return wikidataUri?.match(/Q\d+$/)?.[0];
}

// Only URIs that came back from GraphDB are put into queries; this guards against
// characters that would end the IRI early.
export function toSparqlIri(uri) {
  if (/[<>"{}|\\^`\s]/.test(uri)) throw new Error(`Invalid IRI: ${uri}`);
  return `<${uri}>`;
}

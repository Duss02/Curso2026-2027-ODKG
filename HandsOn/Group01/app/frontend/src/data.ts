import type {
  Accident,
  AccidentFilters,
  DatasetMetadata,
  Severity,
} from "./types";

export const PAGE_SIZE = 500;
export const MAX_LOADED = 5000;

// Fixed count bands keep intensity comparable when switching filters.
export const HOTSPOT_BANDS = [
  { min: 1, label: "1–9", color: "#f7df89" },
  { min: 10, label: "10–49", color: "#f2b65c" },
  { min: 50, label: "50–199", color: "#e67e42" },
  { min: 200, label: "200–999", color: "#c84435" },
  { min: 1000, label: "1,000+", color: "#862d35" },
];

export function hotspotColor(count: number): string {
  return (
    [...HOTSPOT_BANDS].reverse().find((band) => count >= band.min)?.color ??
    HOTSPOT_BANDS[0].color
  );
}

export const DEFAULT_FILTERS: AccidentFilters = {
  severities: [1, 2, 3, 4],
  start_date: "",
  end_date: "",
  street: "",
};

export function datasetBounds(
  metadata: DatasetMetadata | null,
): [[number, number], [number, number]] | null {
  if (
    !metadata ||
    metadata.south === null ||
    metadata.north === null ||
    metadata.west === null ||
    metadata.east === null
  )
    return null;
  return [
    [metadata.south, metadata.west],
    [metadata.north, metadata.east],
  ];
}

export const SEVERITIES: Severity[] = [1, 2, 3, 4];
export const SEVERITY_COLORS: Record<Severity, string> = {
  1: "#23866b",
  2: "#c48a16",
  3: "#df7134",
  4: "#c74050",
};
export const number = (value: number) => value.toLocaleString("en-US");

export function mergeAccidents(
  current: Accident[],
  incoming: Accident[],
): Accident[] {
  return [
    ...new Map(
      [...current, ...incoming].map((item) => [item.uri, item]),
    ).values(),
  ];
}

// RDF dateTimes have no offset. Display the supplied wall-clock time verbatim,
// without JavaScript Date silently interpreting it in the browser's timezone.
export function formatStartTime(value: string): string {
  return value.replace("T", " ");
}

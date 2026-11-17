export type Severity = 1 | 2 | 3 | 4;
export type MapMode = "markers" | "hotspots";

export interface HotspotCell {
  south: number;
  north: number;
  west: number;
  east: number;
  count: number;
}

export interface HotspotResult {
  cell_size_degrees: number;
  cells: HotspotCell[];
  total: number;
  max_count: number;
}

export interface Accident {
  id: string;
  uri: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  start_time: string;
  street_name: string | null;
}

export interface AccidentPage {
  items: Accident[];
  limit: number;
  offset: number;
}

export interface SeverityCount {
  severity: Severity;
  count: number;
}

export interface Health {
  status: "ok";
  graphdb: "reachable";
}

export interface AccidentFilters {
  severities: Severity[];
  start_date: string;
  end_date: string;
  street: string;
}

export interface AccidentDetail extends Accident {
  end_time: string | null;
  description: string | null;
  has_traffic_signal: boolean | null;
  street_uri: string | null;
  street_wikidata_uri: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface DatasetMetadata {
  start_time: string | null;
  end_time: string | null;
  south: number | null;
  north: number | null;
  west: number | null;
  east: number | null;
}

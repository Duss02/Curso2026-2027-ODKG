/**
 * Stato dell'applicazione: un unico store osservabile, senza librerie.
 *
 * Tutto ciò che determina una query vive in `filters` (+ `mapMode`);
 * i componenti si iscrivono e reagiscono solo alle parti che li riguardano.
 * `route` (e il derivato `selectedSr`) segue l'hash dell'URL, così ogni vista
 * è condivisibile con un link (vedi router.ts).
 */
import { parseRoute, type Route } from './router';
import type { FilterOptions, MapPoint } from './sparql/queries';

export type Area =
  | { kind: 'cd'; value: string }
  | { kind: 'nc'; value: string }
  | { kind: 'zip'; value: string };

export interface Bbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface Filters {
  /** Tipi di richiesta attivi (vuoto = nessun punto sulla mappa). */
  types: string[];
  /** Stati attivi (vuoto = tutti). */
  statuses: string[];
  /** Intervallo sulla data di creazione, estremi inclusi, formato YYYY-MM-DD. */
  from: string;
  to: string;
  area: Area | null;
}

export type MapMode = 'markers' | 'heat';

export interface AppState {
  options: FilterOptions | null;
  filters: Filters;
  mapMode: MapMode;
  typeCounts: Map<string, number>;
  /** Punti attualmente disegnati (per la ricerca e per l'anteprima). */
  points: MapPoint[];
  /** true quando la mappa mostra solo la viewport perché l'insieme completo supera il LIMIT. */
  truncated: boolean;
  route: Route;
  selectedSr: string | null;
  /** Livello "quartieri da Wikidata" sulla mappa. */
  showNeighborhoods: boolean;
  loading: boolean;
  error: string | null;
}

type Listener<S> = (state: S, prev: S) => void;

export interface Store<S> {
  get(): S;
  set(patch: Partial<S> | ((s: S) => Partial<S>)): void;
  subscribe(listener: Listener<S>): () => void;
}

export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<Listener<S>>();
  return {
    get: () => state,
    set(patch) {
      const prev = state;
      const delta = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...delta };
      listeners.forEach((l) => l(state, prev));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const initialState: AppState = {
  options: null,
  filters: { types: [], statuses: [], from: '2025-01-01', to: '2025-12-31', area: null },
  mapMode: 'markers',
  typeCounts: new Map(),
  points: [],
  truncated: false,
  route: { name: 'map' },
  selectedSr: null,
  showNeighborhoods: false,
  loading: false,
  error: null,
};

/** Confronto strutturale dei filtri, per non rilanciare query identiche. */
export function sameFilters(a: Filters, b: Filters): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* --- Routing: l'hash dell'URL è la fonte di verità ---------------- */

export function bindRouter(store: Store<AppState>): void {
  const apply = () => {
    const route = parseRoute(location.hash);
    store.set({ route, selectedSr: route.name === 'request' ? route.sr : null });
  };
  window.addEventListener('hashchange', apply);
  apply();
}

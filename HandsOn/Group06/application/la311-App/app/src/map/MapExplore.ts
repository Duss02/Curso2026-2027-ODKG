/**
 * Mockup A · Explore requests on the map (FR1).
 *
 * Flusso dati:
 *   cambio di filters / mapMode (o pan/zoom in modalità viewport)
 *     -> scheduleLoad() (debounce 250 ms, annulla la query precedente)
 *     -> repository.markers() | repository.density()   [SPARQL SELECT]
 *     -> parsing JSON -> MapPoint[] / DensityCell[]
 *     -> renderMarkers() (markercluster) | renderHeat() (leaflet.heat)
 *
 * Strategia di volume: si chiede l'intero insieme filtrato con un LIMIT.
 * Se il LIMIT viene raggiunto (troncato) la mappa passa in "modalità viewport"
 * e ricarica solo il bounding box visibile a ogni pan/zoom.
 */
import L from './leaflet-global';
import 'leaflet.markercluster';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';

import { isAbortError } from '../sparql/client';
import type { DensityCell, La311Repository, MapPoint } from '../sparql/queries';
import type { LinkedRepository, Neighborhood } from '../sparql/linked';
import { resourceHref } from '../router';
import type { AppState, Bbox, Store } from '../state';
import { sameFilters } from '../state';
import { badgeHtml, escapeHtml, markerIcon, statusHtml, styleFor } from './icons';
import { icon } from '../ui/symbols';

const LA_CENTER: L.LatLngExpression = [34.05, -118.35];
const LA_BOUNDS: L.LatLngBoundsExpression = [
  [33.75, -118.62],
  [34.32, -118.18],
];
// L'estratto 2025 ha ~20k punti: entrano tutti. Col dataset completo (milioni di righe) scatta la modalità viewport.
const MARKER_LIMIT = 25000;
/** Passo della griglia di densità (gradi) adatto allo zoom: ~1 cella ogni 10–14 px. */
const GRID_STEPS = [0.02, 0.01, 0.005, 0.0025, 0.001, 0.0005, 0.00025];
function gridStep(zoom: number): number {
  const target = (3600 / (256 * 2 ** zoom)) * 1.4;
  return GRID_STEPS.find((s) => s <= target) ?? GRID_STEPS[GRID_STEPS.length - 1];
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export class MapExplore {
  readonly map: L.Map;
  private readonly clusters: L.MarkerClusterGroup;
  private readonly heat: L.HeatLayer;
  private readonly markersBySr = new Map<string, L.Marker>();
  /** Livello "quartieri Wikidata": cerchi su coordinate P625 dimensionati coi nostri conteggi. */
  private readonly neighborhoods = L.layerGroup();
  private nbController: AbortController | null = null;
  private controller: AbortController | null = null;
  private debounce: number | undefined;
  /** true dopo che la query senza bbox ha raggiunto il LIMIT; si azzera al cambio dei filtri. */
  private viewportMode = false;
  /** Passo della griglia usato dall'ultima heatmap caricata. */
  private heatStep = 0;
  /** Ultima area su cui si è centrata la mappa (per non ricentrare a ogni filtro). */
  private framedArea = '';

  constructor(
    container: HTMLElement,
    private readonly store: Store<AppState>,
    private readonly repo: La311Repository,
    private readonly linked: LinkedRepository,
  ) {
    this.map = L.map(container, { zoomControl: false, preferCanvas: true, zoomSnap: 0.5 }).setView(LA_CENTER, 11);
    // Inquadra la città lasciando libero lo spazio occupato da topbar e pannello in vetro.
    this.map.fitBounds(LA_BOUNDS, this.framePadding());
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    // Tile OSM: adatte allo sviluppo. In produzione usare un provider con chiave (MapTiler, Stadia…).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'basemap',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · ' +
        'Data: <a href="https://data.lacity.org/">MyLA311 2025</a>, City of Los Angeles, CC0 1.0',
    }).addTo(this.map);

    this.clusters = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (cluster) => {
        const n = cluster.getChildCount();
        const size = n < 50 ? 34 : n < 500 ? 42 : 50;
        return L.divIcon({
          className: 'sr-cluster',
          html: `<span>${n.toLocaleString('en-US')}</span>`,
          iconSize: [size, size],
        });
      },
    });
    this.heat = L.heatLayer([], {
      radius: 14,
      blur: 18,
      minOpacity: 0.15,
      gradient: { 0.2: '#9cc9c2', 0.45: '#176d68', 0.7: '#e4b34d', 1: '#cf654b' },
    });

    this.map.on('moveend', () => {
      const mode = this.store.get().mapMode;
      // Marker: la viewport conta solo quando il risultato completo non sta nel LIMIT.
      if (mode === 'markers' && this.viewportMode) this.scheduleLoad();
      // Heatmap: si ricarica quando lo zoom cambia la risoluzione della griglia
      // o, a griglia fine (interrogata per viewport), quando ci si sposta.
      const step = gridStep(this.map.getZoom());
      if (mode === 'heat' && (step !== this.heatStep || step < 0.001)) this.scheduleLoad();
    });

    if (import.meta.env.DEV) (window as unknown as { __fieldnotesMap: L.Map }).__fieldnotesMap = this.map;

    store.subscribe((s, prev) => {
      if (!s.options) return;
      if (s.options !== prev.options || !sameFilters(s.filters, prev.filters) || s.mapMode !== prev.mapMode) {
        this.viewportMode = false;
        this.scheduleLoad();
      }
      if (s.showNeighborhoods !== prev.showNeighborhoods || (s.showNeighborhoods && !sameFilters(s.filters, prev.filters))) {
        void this.loadNeighborhoods();
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* 1) Fetch: costruisce ed esegue la query SPARQL dai filtri correnti */
  /* ---------------------------------------------------------------- */

  private scheduleLoad(): void {
    window.clearTimeout(this.debounce);
    this.debounce = window.setTimeout(() => void this.load(), 250);
  }

  private async load(): Promise<void> {
    this.controller?.abort(); // una sola query "viva": l'ultima interazione vince
    const controller = new AbortController();
    this.controller = controller;

    const { filters, mapMode, options } = this.store.get();
    const allTypes = options?.types.map((t) => t.value) ?? [];
    this.store.set({ loading: true, error: null });

    try {
      if (mapMode === 'heat') {
        const step = gridStep(this.map.getZoom());
        // Griglia fine = molte celle: si limita alla viewport.
        const bbox = step < 0.001 ? this.currentBbox() : null;
        const cells = await this.repo.density(filters, allTypes, step, bbox, controller.signal);
        this.heatStep = step;
        this.renderHeat(cells);
        this.store.set({ points: [], loading: false });
      } else {
        const bbox = this.viewportMode ? this.currentBbox() : null;
        const { points, truncated } = await this.repo.markers(filters, allTypes, bbox, MARKER_LIMIT, controller.signal);
        if (truncated && !this.viewportMode) {
          // Il set completo non sta nel LIMIT: da ora si interroga solo la viewport.
          this.viewportMode = true;
          return this.load();
        }
        this.renderMarkers(points);
        this.frameArea(points);
        this.store.set({ points, truncated: this.viewportMode, loading: false });
      }
    } catch (err) {
      if (isAbortError(err)) return; // superata da una richiesta più recente
      this.store.set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  /** Quando l'utente sceglie un'area, la mappa si centra sui suoi punti (una volta sola). */
  private frameArea(points: MapPoint[]): void {
    const { area } = this.store.get().filters;
    const key = area ? `${area.kind}:${area.value}` : '';
    if (key === this.framedArea) return;
    this.framedArea = key;
    if (key && points.length > 0 && !this.viewportMode) {
      this.map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as L.LatLngTuple)), { ...this.framePadding(), maxZoom: 15 });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Livello federato: quartieri da Wikidata                            */
  /* ---------------------------------------------------------------- */

  private async loadNeighborhoods(): Promise<void> {
    this.nbController?.abort();
    const { showNeighborhoods, filters, options } = this.store.get();
    if (!showNeighborhoods) {
      this.map.removeLayer(this.neighborhoods);
      return;
    }
    this.nbController = new AbortController();
    try {
      const allTypes = options?.types.map((t) => t.value) ?? [];
      const items = await this.linked.neighborhoods(filters, allTypes, this.nbController.signal);
      this.renderNeighborhoods(items);
    } catch (err) {
      if (isAbortError(err)) return;
      this.store.set({ error: `Wikidata neighborhoods: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  private renderNeighborhoods(items: Neighborhood[]): void {
    this.neighborhoods.clearLayers();
    const max = Math.max(1, ...items.map((i) => i.n));
    for (const nb of items) {
      const circle = L.circleMarker([nb.lat, nb.lng], {
        radius: 8 + 26 * Math.sqrt(nb.n / max),
        // Stile esplicito: col renderer canvas (preferCanvas) le classi CSS non si applicano.
        color: '#7457e8',
        weight: 1.5,
        opacity: 0.9,
        fillColor: '#7457e8',
        fillOpacity: 0.22,
      });
      circle.bindTooltip(`${escapeHtml(nb.label ?? '')} · ${nb.n.toLocaleString('en-US')} requests`, { direction: 'top' });
      circle.bindPopup(() => this.neighborhoodHtml(nb), { maxWidth: 300, minWidth: 240, className: 'sr-popup' });
      this.neighborhoods.addLayer(circle);
    }
    if (!this.map.hasLayer(this.neighborhoods)) this.map.addLayer(this.neighborhoods);
  }

  private neighborhoodHtml(nb: Neighborhood): string {
    const img = nb.image
      ? `<img class="pop__img" src="${escapeHtml(nb.image.replace(/^http:/, 'https:'))}?width=320" alt="" loading="lazy">`
      : '';
    return `
      <div class="pop">
        ${img}
        <span class="chip chip--wd">Wikidata</span>
        <div class="pop__head" style="margin-top:6px"><div><strong>${escapeHtml(nb.label ?? '')}</strong>
          <small style="font-family:inherit">${escapeHtml(nb.description ?? '')}</small></div></div>
        <div class="pop__stats">
          <div><strong>${nb.n.toLocaleString('en-US')}</strong><span>requests (our graph)</span></div>
          ${nb.population ? `<div><strong>${nb.population.toLocaleString('en-US')}</strong><span>population (Wikidata)</span></div>` : ''}
        </div>
        <div class="pop__actions">
          <a class="btn btn--sm btn--wd" href="${resourceHref(nb.nc)}">Explore</a>
          ${nb.article ? `<a class="btn btn--sm" href="${escapeHtml(nb.article)}" target="_blank" rel="noopener">Wikipedia ${icon('external', 13)}</a>` : ''}
        </div>
      </div>`;
  }

  /** Margini per fitBounds: su desktop i pannelli coprono il lato sinistro e la parte alta. */
  private framePadding(): L.FitBoundsOptions {
    return window.innerWidth > 760
      ? { paddingTopLeft: [340, 90], paddingBottomRight: [30, 30] }
      : { paddingTopLeft: [20, 130], paddingBottomRight: [20, 90] };
  }

  private currentBbox(): Bbox {
    const b = this.map.getBounds().pad(0.2);
    return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
  }

  /* ---------------------------------------------------------------- */
  /* 2) Plot: dai risultati parsati ai layer Leaflet                    */
  /* ---------------------------------------------------------------- */

  private renderMarkers(points: MapPoint[]): void {
    this.map.removeLayer(this.heat);
    this.clusters.clearLayers();
    this.markersBySr.clear();

    const markers = points.map((p) => {
      const marker = L.marker([p.lat, p.lng], {
        icon: markerIcon(p.requestType),
        title: `${styleFor(p.requestType).label} · ${p.status} · SR ${p.srNumber}`,
        keyboard: true,
      });
      marker.bindPopup(() => this.previewHtml(p), { maxWidth: 280, minWidth: 220, className: 'sr-popup' });
      this.markersBySr.set(p.srNumber, marker);
      return marker;
    });
    this.clusters.addLayers(markers);
    if (!this.map.hasLayer(this.clusters)) this.map.addLayer(this.clusters);
  }

  private renderHeat(cells: DensityCell[]): void {
    this.map.removeLayer(this.clusters);
    // Scala a radice: comprime i picchi. Il guadagno cresce con lo zoom: in vista
    // città le celle si sovrappongono molto (rischio saturazione), in vista strada
    // sono isolate e servirebbero pesi più alti per essere visibili.
    const zoom = this.map.getZoom();
    const gain = zoom <= 12 ? 0.35 : zoom <= 14 ? 0.45 : 1;
    const max = Math.max(1, ...cells.map((c) => c.n));
    const scale = (n: number) => Math.min(1, gain * Math.sqrt(n / max) + (zoom >= 15 ? 0.3 : 0));
    this.heat.setLatLngs(cells.map((c) => [c.lat, c.lng, scale(c.n)]));
    // Le celle sono già aggregate: niente attenuazione automatica sotto maxZoom.
    this.heat.setOptions({ max: 1, maxZoom: this.map.getZoom() });
    if (!this.map.hasLayer(this.heat)) this.map.addLayer(this.heat);
  }

  private previewHtml(p: MapPoint): string {
    return `
      <div class="pop">
        <div class="pop__head">${badgeHtml(p.requestType)}<div><strong>${escapeHtml(styleFor(p.requestType).label)}</strong>
          <small>SR ${escapeHtml(p.srNumber)}</small></div></div>
        <div class="pop__meta">${statusHtml(p.status)}<span>${DATE_FMT.format(p.created)}</span></div>
        <div class="pop__addr">${escapeHtml(p.address ?? 'Address not published')}</div>
        <a class="btn btn--sm btn--primary" href="#/request/${encodeURIComponent(p.srNumber)}">Open record ${icon('arrow', 14)}</a>
      </div>`;
  }

  /** Usato dalla ricerca: centra la mappa su un risultato e apre l'anteprima se il marker è caricato. */
  focus(srNumber: string, point: { lat: number; lng: number } | null): void {
    const marker = this.markersBySr.get(srNumber);
    if (marker) {
      this.clusters.zoomToShowLayer(marker, () => marker.openPopup());
    } else if (point) {
      this.map.flyTo([point.lat, point.lng], 17);
    }
  }
}

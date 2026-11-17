/**
 * Punto di ingresso: crea store, client SPARQL, componenti e routing tra le viste
 * (mappa, distretti, grafo, resource browser) + SPARQL Inspector.
 */
// Prima il CSS di Leaflet, poi il nostro: così le personalizzazioni vincono a parità di specificità.
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './styles.css';
import { DATASET, SPARQL_ENDPOINT, WIKIDATA_ENDPOINT } from './config';
import { MapExplore } from './map/MapExplore';
import { isAbortError, SparqlClient } from './sparql/client';
import { La311Repository } from './sparql/queries';
import { LinkedRepository } from './sparql/linked';
import { href } from './router';
import { bindRouter, createStore, initialState, sameFilters, type AppState } from './state';
import { DistrictsView } from './ui/DistrictsView';
import { FilterPanel } from './ui/FilterPanel';
import { GraphView } from './ui/GraphView';
import { Inspector } from './ui/Inspector';
import { RecordDrawer } from './ui/RecordDrawer';
import { ResourceView } from './ui/ResourceView';
import { SearchBox } from './ui/SearchBox';
import { hydrateIcons } from './ui/symbols';

const kgClient = new SparqlClient({ endpoint: SPARQL_ENDPOINT, name: 'GraphDB · repository la311', timeoutMs: 30000, persistRemote: true });
const wikidataClient = new SparqlClient({ endpoint: WIKIDATA_ENDPOINT, name: 'Wikidata', timeoutMs: 15000, persistRemote: true });
const repo = new La311Repository(kgClient, wikidataClient);
const linked = new LinkedRepository(kgClient, wikidataClient);
const store = createStore<AppState>(initialState);

hydrateIcons();
new Inspector(document.getElementById('inspector')!, document.getElementById('inspector-open') as HTMLButtonElement);
const mapView = new MapExplore(document.getElementById('map')!, store, repo, linked);
new FilterPanel(document.getElementById('panel')!, store);
new RecordDrawer(document.getElementById('drawer')!, store, repo);
new SearchBox(document.getElementById('search') as HTMLFormElement, store, repo, (hit) => {
  mapView.focus(hit.srNumber, hit.point);
  location.hash = href({ name: 'request', sr: hit.srNumber });
});

/* Viste a pagina intera sopra la mappa: distretti, grafo, resource browser. */
const page = document.getElementById('page')!;
const districts = new DistrictsView(page, store, linked);
const graph = new GraphView(page, linked);
const resource = new ResourceView(page, store, linked);
let pageKey = '';

store.subscribe((s, prev) => {
  if (s.route === prev.route && s.options === prev.options) return;
  const r = s.route;
  document.querySelectorAll<HTMLAnchorElement>('.nav a').forEach((a) =>
    a.classList.toggle('is-active', a.dataset.route === (r.name === 'request' ? 'map' : r.name === 'resource' ? 'graph' : r.name)),
  );
  if (r.name === 'map' || r.name === 'request') {
    document.body.classList.remove('filters-open');
    page.hidden = true;
    pageKey = '';
    return;
  }
  // I distretti usano i filtri: aspettano le opzioni caricate all'avvio.
  if (r.name === 'districts' && !s.options) return;
  const key = JSON.stringify(r);
  if (key === pageKey) return;
  pageKey = key;
  page.hidden = false;
  page.scrollTop = 0;
  if (r.name === 'districts') void districts.show();
  else if (r.name === 'graph') void graph.show();
  else void resource.show(r.iri);
});
bindRouter(store);

/* FR1-c · i conteggi della legenda seguono data, stato e area (non i tipi). */
let countsController: AbortController | null = null;
store.subscribe(async (s, prev) => {
  if (!s.options) return;
  const ignoringTypes = (f: AppState['filters']) => ({ ...f, types: [] });
  if (s.options === prev.options && sameFilters(ignoringTypes(s.filters), ignoringTypes(prev.filters))) return;
  countsController?.abort();
  countsController = new AbortController();
  try {
    store.set({ typeCounts: await repo.typeCounts(s.filters, countsController.signal) });
  } catch (err) {
    if (!isAbortError(err)) console.error(err);
  }
});

/* Errori come toast non invadente, invece di testo fisso nel pannello. */
const toast = document.getElementById('toast')!;
let toastTimer: number | undefined;
function showToast(message: string, isError = false): void {
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.hidden = true), 6000);
}
store.subscribe((s, prev) => {
  if (s.error && s.error !== prev.error) showToast(s.error, true);
});

/* Mobile: il pannello filtri è un bottom sheet aperto dal pulsante "Filters". */
const filtersOpen = document.getElementById('filters-open')!;
filtersOpen.addEventListener('click', () => {
  const open = document.body.classList.toggle('filters-open');
  filtersOpen.setAttribute('aria-expanded', String(open));
});

/* FR5 · fonte, periodo effettivo dell'estratto e licenza. */
async function renderAbout(): Promise<void> {
  const el = document.getElementById('about-body')!;
  const fmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
  let period = '2025';
  try {
    const ext = await repo.extent();
    period = `${fmt.format(ext.first)} – ${fmt.format(ext.last)}`;
  } catch {
    /* il testo statico resta valido */
  }
  el.innerHTML = `
    <dl class="kv">
      <dt>Dataset</dt><dd><a href="${DATASET.url}" target="_blank" rel="noopener">${DATASET.title}</a></dd>
      <dt>Publisher</dt><dd>${DATASET.publisher}</dd>
      <dt>Period</dt><dd>${period}</dd>
      <dt>License</dt><dd><a href="${DATASET.licenseUrl}" target="_blank" rel="noopener">CC0 1.0</a></dd>
    </dl>
    <p>${DATASET.caveat}</p>`;
}

async function boot(): Promise<void> {
  try {
    const options = await repo.filterOptions();
    store.set((s) => ({ options, filters: { ...s.filters, types: options.types.map((t) => t.value) } }));
  } catch {
    showToast(`Can't reach the SPARQL endpoint (${SPARQL_ENDPOINT}). Is the server running?`, true);
  }
}

const about = document.getElementById('about') as HTMLDialogElement;
document.getElementById('about-open')!.addEventListener('click', () => {
  about.showModal();
  void renderAbout();
});
about.querySelector('[data-close]')!.addEventListener('click', () => about.close());
about.addEventListener('click', (e) => {
  if (e.target === about) about.close(); // clic fuori dal foglio
});

void boot();

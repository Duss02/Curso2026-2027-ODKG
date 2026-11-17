/**
 * #/districts — Council District ⋈ Wikidata.
 *
 * Una query federata unisce i conteggi del nostro grafo (SR → Location →
 * AdministrativeRegion → la311:cd) con foto, partito e articolo Wikipedia del
 * consigliere collegato via la311:cdMember. Rispetta i filtri della mappa.
 */
import { isAbortError } from '../sparql/client';
import type { District, LinkedRepository } from '../sparql/linked';
import { badgeHtml, escapeHtml, styleFor } from '../map/icons';
import { resourceHref } from '../router';
import { initialState, type AppState, type Filters, type Store } from '../state';
import { icon } from './symbols';

const NF = new Intl.NumberFormat('en-US');
const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const OPEN = ['Open', 'Pending'];

/** Riassunto leggibile dei filtri del pannello Explore che si applicano anche qui ('' = nessuno). */
function activeFilters(f: Filters, typeCount: number): string {
  const parts: string[] = [];
  const d = initialState.filters;
  if (f.from !== d.from || f.to !== d.to) {
    parts.push(`${DAY.format(new Date(`${f.from}T00:00:00Z`))} – ${DAY.format(new Date(`${f.to}T00:00:00Z`))}`);
  }
  if (f.types.length > 0 && f.types.length < typeCount) parts.push(`${f.types.length} of ${typeCount} types`);
  if (f.statuses.length > 0) parts.push(f.statuses.join(', '));
  return parts.join(' · ');
}

/**
 * Quota di richieste ancora aperte. Con valori piccoli (spesso < 1%) l'intero
 * arrotondato mostrerebbe "0%" ovunque: sotto il 10% si usa un decimale.
 */
function openLabel(d: District, f: Filters): { text: string; title: string } {
  if (f.statuses.length > 0 && !f.statuses.some((s) => OPEN.includes(s))) {
    return { text: '— open', title: 'The status filter excludes Open and Pending requests' };
  }
  const title = `${NF.format(d.openOrPending)} of ${NF.format(d.n)} requests still open or pending`;
  if (d.openOrPending === 0 || d.n === 0) return { text: '0 open', title };
  const pct = (d.openOrPending / d.n) * 100;
  const shown = pct < 10 ? pct.toFixed(1).replace(/\.0$/, '') : String(Math.round(pct));
  return { text: `${NF.format(d.openOrPending)} open · ${shown}%`, title };
}

/** Miniatura da Wikimedia Commons (Special:FilePath accetta ?width=). */
export const thumb = (url: string, width = 160) => `${url.replace(/^http:/, 'https:')}?width=${width}`;

export class DistrictsView {
  private controller: AbortController | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: Store<AppState>,
    private readonly repo: LinkedRepository,
  ) {}

  async show(): Promise<void> {
    this.controller?.abort();
    this.controller = new AbortController();
    const { filters, options } = this.store.get();
    this.root.innerHTML = `
      <div class="page__inner">
        <header class="page__head">
          <div>
            <p class="eyebrow">Council districts × Wikidata</p>
            <h1>Who represents the requests?</h1>
            <p class="sub">Request counts from our graph, council members live from Wikidata — joined in one federated SPARQL query.</p>
          </div>
          <div class="head-chips"></div>
        </header>
        <div class="skeletons">${'<div class="skeleton"></div>'.repeat(6)}</div>
      </div>`;

    try {
      const allTypes = options?.types.map((t) => t.value) ?? [];
      const districts = await this.repo.districts(filters, allTypes, this.controller.signal);
      const max = Math.max(1, ...districts.map((d) => d.n));
      const linked = districts.filter((d) => d.member).length;
      const filtered = activeFilters(filters, allTypes.length);
      this.root.querySelector('.head-chips')!.innerHTML = `
        ${filtered ? `<span class="chip" title="Filters from the Explore panel also apply here">Filtered: ${escapeHtml(filtered)}</span>
          <button type="button" class="btn btn--sm" data-action="reset">Reset filters</button>` : ''}
        <span class="chip chip--wd" title="Districts with a la311:cdMember link">${linked} of ${districts.length} linked to Wikidata</span>`;
      this.root.querySelector('.skeletons')!.outerHTML = `<div class="dgrid">${districts.map((d) => this.card(d, max, filters)).join('')}</div>`;
      this.root.querySelector('[data-action=reset]')?.addEventListener('click', () => {
        this.store.set({ filters: { ...initialState.filters, types: allTypes } });
        void this.show();
      });
      this.root.querySelectorAll<HTMLButtonElement>('[data-cd]').forEach((btn) =>
        btn.addEventListener('click', () => {
          this.store.set((s) => ({ filters: { ...s.filters, area: { kind: 'cd', value: btn.dataset.cd! } } }));
          location.hash = '#/';
        }),
      );
    } catch (err) {
      if (isAbortError(err)) return;
      this.root.querySelector('.skeletons')!.outerHTML = `<div class="glass-sub panel-card">
        <strong>Wikidata didn't answer.</strong> <span class="muted">It may be rate-limiting; try again in a minute.</span></div>`;
    }
  }

  private card(d: District, max: number, f: Filters): string {
    const open = openLabel(d, f);
    const avatar = d.image
      ? `<img class="avatar" src="${escapeHtml(thumb(d.image, 120))}" alt="" loading="lazy">`
      : `<div class="avatar avatar--empty" aria-hidden="true">${d.member ? '?' : '—'}</div>`;
    const name = d.member ? escapeHtml(d.name ?? d.member.split('/').pop()!) : 'No linked member';
    // Wikidata può elencare più partiti (es. nazionale e statale): basta il primo.
    const party = d.party?.split(', ')[0];
    const sub = d.member ? escapeHtml(party || 'Council member') : 'Missing la311:cdMember';
    return `
      <article class="dcard glass-sub ${d.member ? '' : 'dcard--unlinked'}">
        <div class="dcard__person">${avatar}
          <div><p class="eyebrow">District ${d.cd}</p><h2>${name}</h2><p>${sub}</p></div>
        </div>
        <div>
          <div class="dcard__metric"><strong>${NF.format(d.n)}</strong><span>requests</span>
            <span class="dcard__open" title="${escapeHtml(open.title)}">${open.text}</span></div>
          <div class="bar" style="--w:${(d.n / max) * 100}%"><span></span></div>
        </div>
        <div class="dcard__types" aria-label="Most frequent request types">${d.topTypes
          .map((t) => `<span title="${escapeHtml(styleFor(t.type).label)} · ${NF.format(t.n)}">${badgeHtml(t.type, 'sm')}</span>`)
          .join('')}</div>
        <div class="dcard__actions">
          <button type="button" class="btn btn--sm btn--primary" data-cd="${d.cd}">${icon('map', 14)} Map</button>
          ${d.member ? `<a class="btn btn--sm btn--wd" href="${resourceHref(d.member)}">${icon('graph', 14)} Explore</a>` : ''}
          ${d.article ? `<a class="btn btn--sm" href="${escapeHtml(d.article)}" target="_blank" rel="noopener" aria-label="Wikipedia">W ${icon('external', 12)}</a>` : ''}
        </div>
      </article>`;
  }
}

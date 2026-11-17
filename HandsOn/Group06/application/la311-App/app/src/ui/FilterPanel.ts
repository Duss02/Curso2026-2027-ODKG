/**
 * Pannello "Explore": tipi di richiesta, periodo, area, stato, stile mappa e
 * livello Wikidata. Scrive solo nello store; non conosce SPARQL.
 *
 * In testa mostra il numero di richieste che corrispondono ai filtri: è la
 * somma dei conteggi per tipo (FR1-c), quindi vale sia per i punti sia per la
 * vista densità senza query aggiuntive.
 */
import { badgeHtml, escapeHtml, styleFor } from '../map/icons';
import type { Area, AppState, MapMode, Store } from '../state';
import { icon } from './symbols';

const NF = new Intl.NumberFormat('en-US');

export class FilterPanel {
  /** true mentre è il pannello stesso a modificare i filtri (non serve ridisegnarlo). */
  private ownChange = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: Store<AppState>,
  ) {
    store.subscribe((s, prev) => {
      // Ridisegna anche quando i filtri cambiano da fuori (Reset nei Districts, pulsante Map…).
      if (s.options !== prev.options || (s.filters !== prev.filters && !this.ownChange)) this.render();
      if (s.typeCounts !== prev.typeCounts || s.filters.types !== prev.filters.types) this.renderCounts();
      if (s.loading !== prev.loading || s.truncated !== prev.truncated || s.mapMode !== prev.mapMode) this.renderStatus();
    });
    this.root.innerHTML = `<div class="panel__head"><div><h2>Explore</h2><p class="panel__count">Connecting to the knowledge graph…</p></div><span class="spinner"></span></div>`;
  }

  private render(): void {
    const { options, filters, mapMode, showNeighborhoods } = this.store.get();
    if (!options) return;

    const typeRows = options.types
      .map(
        (t) => `
        <li><button type="button" class="type-row" data-type="${escapeHtml(t.value)}" aria-pressed="${filters.types.includes(t.value)}">
          ${badgeHtml(t.value, 'sm')}
          <span class="type-row__name">${escapeHtml(styleFor(t.value).label)}</span>
          <span class="type-row__n" data-count="${escapeHtml(t.value)}"></span>
          <span class="type-row__check" aria-hidden="true"></span>
        </button></li>`,
      )
      .join('');

    const statusPills = [
      `<button type="button" class="pill" data-status="" aria-pressed="${filters.statuses.length === 0}">All</button>`,
      ...options.statuses.map(
        (st) =>
          `<button type="button" class="pill" data-status="${escapeHtml(st.value)}" aria-pressed="${filters.statuses.includes(st.value)}">${escapeHtml(st.value)}</button>`,
      ),
    ].join('');

    const areaValue = filters.area ? `${filters.area.kind}:${filters.area.value}` : '';
    const opt = (kind: string, o: { value: string; label: string }) =>
      `<option value="${kind}:${escapeHtml(o.value)}" ${areaValue === `${kind}:${o.value}` ? 'selected' : ''}>${escapeHtml(o.label)}</option>`;

    this.root.innerHTML = `
      <div class="panel__head">
        <div>
          <h2>Explore</h2>
          <p class="panel__count" aria-live="polite"></p>
          <p class="panel__note" hidden>Showing the visible area only. Zoom in or filter to see more.</p>
        </div>
        <span class="spinner" hidden></span>
        <button type="button" class="icon-btn panel__close" aria-label="Close filters">${icon('close')}</button>
      </div>

      <section class="group">
        <div class="group__head"><h3>Request types</h3><button type="button" class="link-btn" data-action="toggle-all"></button></div>
        <ul class="types">${typeRows}</ul>
      </section>

      <section class="group">
        <h3>When</h3>
        <div class="daterange">
          <input class="field" type="date" name="from" value="${filters.from}" min="2025-01-01" max="2025-12-31" aria-label="Created from">
          <span aria-hidden="true">→</span>
          <input class="field" type="date" name="to" value="${filters.to}" min="2025-01-01" max="2025-12-31" aria-label="Created until">
        </div>
      </section>

      <section class="group">
        <h3>Where</h3>
        <select class="select" name="area" aria-label="City area">
          <option value="">All of Los Angeles</option>
          <optgroup label="Council districts">${options.councilDistricts.map((o) => opt('cd', o)).join('')}</optgroup>
          <optgroup label="Neighborhood councils">${options.neighborhoodCouncils.map((o) => opt('nc', o)).join('')}</optgroup>
        </select>
      </section>

      <section class="group">
        <h3>Status</h3>
        <div class="pills" role="group" aria-label="Status">${statusPills}</div>
      </section>

      <section class="group">
        <h3>View</h3>
        <div class="seg seg--full" role="radiogroup" aria-label="Map style">
          <button type="button" role="radio" data-mode="markers" aria-checked="${mapMode === 'markers'}">Points</button>
          <button type="button" role="radio" data-mode="heat" aria-checked="${mapMode === 'heat'}">Density</button>
        </div>
        <label class="switch-row">
          <span><strong><span class="dot-wd"></span>Wikidata neighborhoods</strong><small>Federated layer from Wikidata</small></span>
          <input class="switch" type="checkbox" name="neighborhoods" ${showNeighborhoods ? 'checked' : ''}>
        </label>
      </section>`;

    this.bind();
    this.renderCounts();
    this.renderStatus();
  }

  private bind(): void {
    const r = this.root;
    r.querySelectorAll<HTMLButtonElement>('.type-row').forEach((btn) =>
      btn.addEventListener('click', () => {
        const on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        this.patchFilters({ types: this.selected('.type-row', 'type') });
      }),
    );
    r.querySelector<HTMLButtonElement>('[data-action=toggle-all]')!.addEventListener('click', () => {
      const all = this.store.get().options!.types.map((t) => t.value);
      const next = this.store.get().filters.types.length === all.length ? [] : all;
      r.querySelectorAll<HTMLButtonElement>('.type-row').forEach((b) => b.setAttribute('aria-pressed', String(next.length > 0)));
      this.patchFilters({ types: next });
    });
    r.querySelectorAll<HTMLButtonElement>('.pill').forEach((pill) =>
      pill.addEventListener('click', () => {
        const pills = [...r.querySelectorAll<HTMLButtonElement>('.pill')];
        if (!pill.dataset.status) {
          pills.forEach((p) => p.setAttribute('aria-pressed', String(!p.dataset.status)));
        } else {
          pill.setAttribute('aria-pressed', String(pill.getAttribute('aria-pressed') !== 'true'));
          const any = pills.some((p) => p.dataset.status && p.getAttribute('aria-pressed') === 'true');
          pills[0].setAttribute('aria-pressed', String(!any));
        }
        this.patchFilters({ statuses: this.selected('.pill', 'status').filter(Boolean) });
      }),
    );
    r.querySelectorAll<HTMLInputElement>('input[type=date]').forEach((input) =>
      input.addEventListener('change', () => {
        const from = r.querySelector<HTMLInputElement>('input[name=from]')!.value;
        const to = r.querySelector<HTMLInputElement>('input[name=to]')!.value;
        if (from && to && from <= to) this.patchFilters({ from, to });
      }),
    );
    r.querySelector<HTMLSelectElement>('select[name=area]')!.addEventListener('change', (e) => {
      const raw = (e.target as HTMLSelectElement).value;
      const [kind, value] = raw.split(':');
      this.patchFilters({ area: raw ? ({ kind, value } as Area) : null });
    });
    r.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) =>
      btn.addEventListener('click', () => {
        r.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
        this.store.set({ mapMode: btn.dataset.mode as MapMode });
      }),
    );
    r.querySelector<HTMLInputElement>('input[name=neighborhoods]')!.addEventListener('change', (e) =>
      this.store.set({ showNeighborhoods: (e.target as HTMLInputElement).checked }),
    );
    r.querySelector('.panel__close')!.addEventListener('click', () => document.body.classList.remove('filters-open'));
  }

  private selected(selector: string, key: string): string[] {
    return [...this.root.querySelectorAll<HTMLElement>(`${selector}[aria-pressed=true]`)].map((el) => el.dataset[key] ?? '');
  }

  private patchFilters(patch: Partial<AppState['filters']>): void {
    this.ownChange = true;
    try {
      this.store.set((s) => ({ filters: { ...s.filters, ...patch } }));
    } finally {
      this.ownChange = false;
    }
  }

  private renderCounts(): void {
    const { typeCounts, filters, options } = this.store.get();
    this.root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      el.textContent = NF.format(typeCounts.get(el.dataset.count!) ?? 0);
    });
    // Totale = somma dei tipi attivi (solo richieste con coordinate, come sulla mappa).
    const total = filters.types.reduce((sum, t) => sum + (typeCounts.get(t) ?? 0), 0);
    const count = this.root.querySelector('.panel__count');
    if (count && options) count.innerHTML = `<strong>${NF.format(total)}</strong> requests match`;
    const toggle = this.root.querySelector('[data-action=toggle-all]');
    if (toggle && options) toggle.textContent = filters.types.length === options.types.length ? 'Clear' : 'Select all';
  }

  private renderStatus(): void {
    const { loading, truncated, mapMode } = this.store.get();
    const spinner = this.root.querySelector<HTMLElement>('.spinner');
    if (spinner) spinner.hidden = !loading;
    const note = this.root.querySelector<HTMLElement>('.panel__note');
    if (note) note.hidden = !(truncated && mapMode === 'markers');
  }
}

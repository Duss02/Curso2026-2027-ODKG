/**
 * SPARQL Inspector: mostra dal vivo ogni query eseguita dall'app, con
 * endpoint (LOCAL / WIKIDATA / FEDERATED), tempo, righe e testo evidenziato.
 * È lo strumento principale della demo: prova che ogni numero e ogni pixel
 * sulla mappa arrivano da una query SPARQL sul Knowledge Graph.
 */
import { clearAllCaches, onQueryLog, type QueryLogEntry } from '../sparql/client';
import { escapeHtml } from '../map/icons';
import { icon } from './symbols';

const KIND_LABEL = { local: 'LOCAL KG', wikidata: 'WIKIDATA', federated: 'FEDERATED' } as const;
const MAX_ENTRIES = 80;

const KEYWORDS =
  'SELECT|DISTINCT|WHERE|FILTER|OPTIONAL|UNION|GROUP|BY|ORDER|DESC|ASC|LIMIT|OFFSET|PREFIX|BIND|AS|VALUES|SERVICE|COUNT|SUM|SAMPLE|MAX|MIN|GROUP_CONCAT|SEPARATOR|IF|IN|NOT|EXISTS|COALESCE|CONCAT|REPLACE|STR|LCASE|CONTAINS|STRSTARTS|LANG|FLOOR|isIRI|HAVING|a';

const TOKEN = new RegExp(
  [
    '(<[^>\\s]*>)', // 1 IRI
    '("(?:[^"\\\\]|\\\\.)*"(?:\\^\\^[\\w:]+|@[\\w-]+)?)', // 2 letterale
    '(#[^\\n]*)', // 3 commento
    '([?$]\\w+)', // 4 variabile
    `\\b(${KEYWORDS})\\b`, // 5 parola chiave
    '\\b([a-z][\\w-]*:[\\w-]*)', // 6 CURIE
  ].join('|'),
  'g',
);

/** Evidenziazione sintattica minima, sicura (escape di ogni frammento). */
export function highlightSparql(query: string): string {
  let out = '';
  let last = 0;
  for (const m of query.matchAll(TOKEN)) {
    out += escapeHtml(query.slice(last, m.index));
    const cls = m[1] ? 'iri' : m[2] ? 'lit' : m[3] ? 'cmt' : m[4] ? 'var' : m[5] ? 'kw' : 'curie';
    out += `<span class="tok-${cls}">${escapeHtml(m[0])}</span>`;
    last = m.index! + m[0].length;
  }
  return out + escapeHtml(query.slice(last));
}

export class Inspector {
  private readonly entries = new Map<number, QueryLogEntry>();
  private open = false;
  private expanded: number | null = null;
  private readonly count: HTMLElement;
  private renderQueued = false;

  constructor(
    private readonly panel: HTMLElement,
    private readonly toggle: HTMLButtonElement,
  ) {
    panel.innerHTML = `
      <header class="inspector__head">
        <h2>SPARQL queries</h2>
        <button type="button" class="btn btn--sm" data-act="nocache" title="Forget cached results so the next queries really hit the endpoints">Run live</button>
        <button type="button" class="btn btn--sm" data-act="clear">Clear</button>
        <button type="button" class="icon-btn" data-act="close" aria-label="Close">${icon('close')}</button>
      </header>
      <div class="inspector__legend">
        <span class="kind">LOCAL KG</span><span class="kind kind--wikidata">WIKIDATA</span><span class="kind kind--federated">FEDERATED</span>
        <span class="muted" style="font-size:.78rem">· tap a query to read it</span>
      </div>
      <ol class="inspector__list"></ol>`;
    this.count = toggle.querySelector('.badge-count')!;

    toggle.addEventListener('click', () => this.setOpen(!this.open));
    panel.querySelector('[data-act=close]')!.addEventListener('click', () => this.setOpen(false));
    panel.querySelector('[data-act=clear]')!.addEventListener('click', () => {
      this.entries.clear();
      this.expanded = null;
      this.queueRender();
    });
    panel.querySelector('[data-act=nocache]')!.addEventListener('click', (e) => {
      clearAllCaches();
      (e.currentTarget as HTMLButtonElement).textContent = 'Cache cleared ✓';
    });
    panel.addEventListener('click', (e) => this.onPanelClick(e));
    document.addEventListener('keydown', (e) => {
      // Scorciatoie per la demo: "s" apre/chiude, Esc chiude (fuori dai campi di testo).
      const target = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || e.metaKey || e.ctrlKey) return;
      if (e.key === 's') this.setOpen(!this.open);
      if (e.key === 'Escape' && this.open) this.setOpen(false);
    });

    onQueryLog((entry) => {
      this.entries.set(entry.id, entry);
      if (this.entries.size > MAX_ENTRIES) this.entries.delete(this.entries.keys().next().value as number);
      if (entry.status === 'running' || entry.status === 'cached') this.bump();
      this.queueRender();
    });
  }

  private setOpen(open: boolean): void {
    this.open = open;
    this.panel.hidden = !open;
    this.toggle.setAttribute('aria-pressed', String(open));
    if (open) {
      const live = this.panel.querySelector('[data-act=nocache]');
      if (live) live.textContent = 'Run live';
      this.queueRender();
    }
  }

  private bump(): void {
    this.count.classList.remove('is-bump');
    void this.count.offsetWidth; // riavvia l'animazione CSS
    this.count.classList.add('is-bump');
  }

  private queueRender(): void {
    if (this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      this.render();
    });
  }

  private render(): void {
    this.count.hidden = this.entries.size === 0;
    this.count.textContent = String(this.entries.size);
    if (!this.open) return;
    const items = [...this.entries.values()].reverse();
    this.panel.querySelector('.inspector__list')!.innerHTML =
      items.length === 0
        ? '<li class="muted" style="padding:10px">No queries yet — interact with the app.</li>'
        : items.map((e) => this.itemHtml(e)).join('');
  }

  private itemHtml(e: QueryLogEntry): string {
    const meta =
      e.status === 'running'
        ? 'running…'
        : e.status === 'error'
          ? `failed · ${escapeHtml(e.error ?? '')}`
          : e.status === 'aborted'
            ? 'superseded'
            : e.status === 'cached'
              ? `${e.rows?.toLocaleString('en-US')} rows · cached`
              : `${e.rows?.toLocaleString('en-US')} rows · ${e.ms} ms`;
    const open = this.expanded === e.id;
    const note =
      e.kind === 'federated'
        ? '<p class="q__note">Runs on <strong>our</strong> endpoint, which joins Wikidata through <code>SERVICE</code>.</p>'
        : '';
    const wdqs =
      e.kind === 'wikidata'
        ? `<a class="btn btn--sm btn--wd" href="https://query.wikidata.org/#${encodeURIComponent(e.query)}" target="_blank" rel="noopener">Open in Wikidata ${icon('external', 12)}</a>`
        : '';
    return `
      <li class="q q--${e.kind} q--${e.status}${open ? ' is-open' : ''}" data-id="${e.id}">
        <button type="button" class="q__row" data-act="expand" aria-expanded="${open}">
          <span class="kind kind--${e.kind}">${KIND_LABEL[e.kind]}</span>
          <span class="q__label">${escapeHtml(e.label)}</span>
          <span class="q__meta">${meta}</span>
        </button>
        ${
          open
            ? `<div class="q__body">${note}
                 <pre class="sparql"><code>${highlightSparql(e.query.trim())}</code></pre>
                 <div class="q__actions">
                   <button type="button" class="btn btn--sm" data-act="copy">${icon('copy', 14)} Copy</button>
                   ${wdqs}
                   <span class="muted" style="font-size:.76rem">${escapeHtml(e.endpointName)}</span>
                 </div>
               </div>`
            : ''
        }
      </li>`;
  }

  private onPanelClick(ev: Event): void {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
    const li = (ev.target as HTMLElement).closest<HTMLElement>('li[data-id]');
    if (!btn || !li) return;
    const id = Number(li.dataset.id);
    if (btn.dataset.act === 'expand') {
      this.expanded = this.expanded === id ? null : id;
      this.render();
    } else if (btn.dataset.act === 'copy') {
      void navigator.clipboard?.writeText(this.entries.get(id)?.query ?? '');
      btn.textContent = 'Copied ✓';
    }
  }
}

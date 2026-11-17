/**
 * #/resource/<IRI> — "follow your nose" su qualunque nodo del grafo.
 *
 * In alto: cos'è il nodo (etichetta, immagine e descrizione da Wikidata) e
 * quante richieste lo raggiungono, con il cammino nel grafo. Sotto: chi lo
 * collega (incoming), le sue proprietà (outgoing) e i fatti su Wikidata,
 * raggruppati per proprietà e accorciati.
 */
import { isAbortError } from '../sparql/client';
import { curie, isLocal, isWikidata, type LinkedRepository, type ResourceView as RV } from '../sparql/linked';
import { escapeHtml } from '../map/icons';
import { resourceHref } from '../router';
import type { AppState, Store } from '../state';
import { thumb } from './DistrictsView';
import { icon } from './symbols';

const NF = new Intl.NumberFormat('en-US');
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const LABELS = new Set(['http://www.w3.org/2000/01/rdf-schema#label', 'http://schema.org/name']);
const FACTS_SHOWN = 8;

/** Link a un IRI: dentro l'app se è navigabile, altrimenti esterno. */
export function iriLink(iri: string, text = curie(iri)): string {
  // Monospace solo quando si mostra l'IRI stesso; le etichette restano testo normale.
  const cls = text === curie(iri) ? ' class="iri"' : '';
  if (isLocal(iri) || isWikidata(iri)) return `<a${cls} href="${resourceHref(iri)}">${escapeHtml(text)}</a>`;
  return `<a${cls} href="${escapeHtml(iri)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
}

export class ResourceView {
  private controller: AbortController | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: Store<AppState>,
    private readonly repo: LinkedRepository,
  ) {}

  async show(iri: string): Promise<void> {
    this.controller?.abort();
    this.controller = new AbortController();
    this.root.innerHTML = `<div class="page__inner"><div class="skeleton" style="height:170px"></div>
      <div class="skeleton" style="height:90px;margin-top:14px"></div></div>`;
    try {
      const view = await this.repo.resource(iri, this.controller.signal);
      this.root.innerHTML = `<div class="page__inner">${this.body(view)}</div>`;
      this.root.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', (e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        void navigator.clipboard?.writeText(btn.dataset.copy!);
        btn.textContent = 'IRI copied ✓';
      });
      this.root.querySelector<HTMLButtonElement>('[data-nc]')?.addEventListener('click', (e) => {
        const nc = (e.currentTarget as HTMLElement).dataset.nc!;
        this.store.set((s) => ({ filters: { ...s.filters, area: { kind: 'nc', value: nc } } }));
        location.hash = '#/';
      });
    } catch (err) {
      if (isAbortError(err)) return;
      this.root.innerHTML = `<div class="page__inner"><div class="glass-sub panel-card">${escapeHtml(String(err))}</div></div>`;
    }
  }

  private body(v: RV): string {
    const wd = v.wikidata;
    const type = v.outgoing.find((t) => t.p === RDF_TYPE)?.o;
    const label = wd?.label ?? v.outgoing.find((t) => LABELS.has(t.p))?.o ?? curie(v.iri);
    const kind = isWikidata(v.iri) ? 'Wikidata entity' : type ? curie(type).replace('la311:', '') : 'Resource';
    const nc = v.outgoing.find((t) => t.p.endsWith('#nc'))?.o;

    const hero = `
      <section class="hero glass-sub">
        ${wd?.image ? `<img class="hero__img" src="${escapeHtml(thumb(wd.image, 280))}" alt="" loading="lazy">` : ''}
        <div style="min-width:0">
          <span class="chip ${isWikidata(v.iri) ? 'chip--wd' : ''}">${escapeHtml(kind)}</span>
          <h1>${escapeHtml(label)}</h1>
          ${wd?.description ? `<p>${escapeHtml(wd.description)}</p>` : `<p class="mono muted">${escapeHtml(curie(v.iri))}</p>`}
          <div class="hero__links">
            ${nc && nc !== '0' ? `<button type="button" class="btn btn--sm btn--primary" data-nc="${escapeHtml(nc)}">${icon('map', 14)} Show on map</button>` : ''}
            ${wd ? `<a class="btn btn--sm btn--wd" href="${escapeHtml(v.iri)}" target="_blank" rel="noopener">Wikidata ${icon('external', 12)}</a>` : ''}
            ${wd?.article ? `<a class="btn btn--sm" href="${escapeHtml(wd.article)}" target="_blank" rel="noopener">Wikipedia ${icon('external', 12)}</a>` : ''}
            <button type="button" class="btn btn--sm btn--ghost" data-copy="${escapeHtml(v.iri)}">${icon('copy', 14)} Copy IRI</button>
          </div>
        </div>
      </section>`;

    // Quante richieste raggiungono questo nodo, e per quale cammino.
    const reach = v.paths.length
      ? `<section class="reach glass-sub">
          <div><div class="reach__n">${NF.format(v.paths[0].n)}</div><div class="reach__label">service requests reach this node</div></div>
          <div style="display:grid;gap:8px">${v.paths.map((p, i) => `<div class="path" title="SPARQL property path">${i > 0 ? `<b>${NF.format(p.n)}</b>` : ''}${this.pathChips(p.path, isWikidata(v.iri))}</div>`).join('')}</div>
        </section>`
      : '';

    const incoming = v.incoming.length
      ? `<section class="panel-card glass-sub"><h3>Linked from</h3><ul class="list">${v.incoming
          .map(
            (r) => `<li><span class="k"><code>${escapeHtml(curie(r.p))}</code></span>
              <span class="v"><span class="n">${NF.format(r.n)}</span> <span class="muted">· e.g.</span> ${iriLink(r.example, r.exampleLabel ?? curie(r.example))}</span></li>`,
          )
          .join('')}</ul></section>`
      : '';

    const props = v.outgoing.filter((t) => t.p !== RDF_TYPE && !LABELS.has(t.p));
    const outgoing = props.length
      ? `<section class="panel-card glass-sub"><h3>Properties</h3><ul class="list">${props
          .map(
            (t) => `<li><span class="k"><code>${escapeHtml(curie(t.p))}</code></span>
              <span class="v">${t.isIri ? iriLink(t.o) : `<span class="lit">${escapeHtml(t.o)}</span>`}</span></li>`,
          )
          .join('')}</ul></section>`
      : '';

    let facts = '';
    if (wd?.facts.length) {
      // Un valore per riga sarebbe ridondante: si raggruppano i valori per proprietà.
      const grouped = new Map<string, { label: string; values: string[] }>();
      for (const f of wd.facts) {
        const g = grouped.get(f.prop) ?? { label: f.propLabel, values: [] };
        const value = isWikidata(f.value) ? iriLink(f.value, f.valueLabel) : `<span class="lit">${escapeHtml(f.valueLabel)}</span>`;
        if (!g.values.includes(value)) g.values.push(value);
        grouped.set(f.prop, g);
      }
      const rows = [...grouped.values()].map((g) => `<li><span class="k">${escapeHtml(g.label)}</span><span class="v">${g.values.join(', ')}</span></li>`);
      facts = `<section class="panel-card glass-sub"><h3><span class="dot-wd"></span>On Wikidata · live</h3>
        <ul class="list">${rows.slice(0, FACTS_SHOWN).join('')}</ul>
        ${rows.length > FACTS_SHOWN ? `<details class="all"><summary>Show ${rows.length - FACTS_SHOWN} more</summary><ul class="list">${rows.slice(FACTS_SHOWN).join('')}</ul></details>` : ''}
      </section>`;
    }

    const cards = [incoming, facts, outgoing].filter(Boolean).join('');
    return hero + reach + (cards ? `<div class="rgrid">${cards}</div>` : '');
  }

  private pathChips(path: string, targetIsWd: boolean): string {
    const steps = path.split('/').map((p) => `<span class="${/cdMember|ncName|containedInPlace/.test(p) ? 'is-wd' : ''}">${escapeHtml(p.replace(/^\w+:/, ''))}</span>`);
    return [`<span>?request</span>`, ...steps, `<span class="${targetIsWd ? 'is-wd' : ''}">this</span>`].join(icon('chevron', 12));
  }
}

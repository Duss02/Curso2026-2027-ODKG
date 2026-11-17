/**
 * #/graph — il Knowledge Graph nel suo insieme.
 *
 * Schema dell'ontologia disegnato in SVG, con i numeri (istanze per classe,
 * triple per predicato, link verso Wikidata) calcolati da query COUNT live.
 */
import { isAbortError } from '../sparql/client';
import { curie, type GraphStats, type LinkedRepository } from '../sparql/linked';
import { escapeHtml } from '../map/icons';
import { resourceHref } from '../router';
import { iriLink } from './ResourceView';

const NF = new Intl.NumberFormat('en-US');
const LA = 'http://linkeddata.la311.com/ontology#';
const NS = {
  la311: LA,
  owl: 'http://www.w3.org/2002/07/owl#',
  schema: 'http://schema.org/',
};

interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
  cls?: string; // IRI della classe per il conteggio
  external?: boolean;
  example?: string; // IRI di esempio da aprire
}
interface Edge {
  from: string;
  to: string;
  p: string; // IRI del predicato
  label: string;
  dy?: number;
}

const NODES: Node[] = [
  { id: 'sr', title: 'ServiceRequest', x: 95, y: 210, cls: LA + 'ServiceRequest' },
  { id: 'person', title: 'AnonymousPerson', x: 95, y: 400, cls: LA + 'AnonymousPerson' },
  { id: 'org', title: 'Organization', x: 390, y: 30, cls: LA + 'Organization' },
  { id: 'svc', title: 'Service', x: 390, y: 120, cls: LA + 'Service' },
  { id: 'loc', title: 'Location', x: 390, y: 300, cls: LA + 'Location' },
  { id: 'region', title: 'AdministrativeRegion', x: 665, y: 300, cls: LA + 'AdministrativeRegion' },
  { id: 'member', title: 'Council member', x: 935, y: 120, external: true, example: 'http://www.wikidata.org/entity/Q115471735' },
  { id: 'nc', title: 'Neighborhood', x: 935, y: 300, external: true, example: 'http://www.wikidata.org/entity/Q7985390' },
  { id: 'city', title: 'wd:Q65 Los Angeles', x: 935, y: 420, external: true, example: 'http://www.wikidata.org/entity/Q65' },
];

const EDGES: Edge[] = [
  { from: 'sr', to: 'org', p: NS.la311 + 'responsible', label: 'la311:responsible' },
  { from: 'sr', to: 'svc', p: NS.la311 + 'assignedTo', label: 'la311:assignedTo' },
  { from: 'sr', to: 'loc', p: NS.la311 + 'hasLocation', label: 'la311:hasLocation' },
  { from: 'sr', to: 'person', p: NS.la311 + 'reportedBy', label: 'la311:reportedBy' },
  { from: 'loc', to: 'region', p: NS.la311 + 'isWithin', label: 'la311:isWithin' },
  { from: 'region', to: 'member', p: NS.la311 + 'cdMember', label: 'la311:cdMember' },
  { from: 'region', to: 'nc', p: NS.la311 + 'ncName', label: 'la311:ncName', dy: -14 },
  { from: 'region', to: 'nc', p: NS.owl + 'sameAs', label: 'owl:sameAs', dy: 18 },
  { from: 'region', to: 'city', p: NS.schema + 'containedInPlace', label: 'schema:containedInPlace' },
];

const W = 160;
const H = 50;

export class GraphView {
  private controller: AbortController | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly repo: LinkedRepository,
  ) {}

  async show(): Promise<void> {
    this.controller?.abort();
    this.controller = new AbortController();
    this.root.innerHTML = `
      <div class="page__inner">
        <header class="page__head">
          <div>
            <p class="eyebrow">Knowledge graph</p>
            <h1>The graph behind the map</h1>
            <p class="sub">Every number here is a live <code>COUNT</code> query. Tap a node to open an example.</p>
          </div>
        </header>
        <div class="body"><div class="skeletons">${'<div class="skeleton" style="height:90px"></div>'.repeat(4)}</div></div>
      </div>`;
    try {
      const stats = await this.repo.graphStats(this.controller.signal);
      this.root.querySelector('.body')!.innerHTML = this.body(stats);
    } catch (err) {
      if (isAbortError(err)) return;
      this.root.querySelector('.body')!.innerHTML = `<div class="glass-sub panel-card">${escapeHtml(String(err))}</div>`;
    }
  }

  private body(s: GraphStats): string {
    const wdLinks = s.external.filter((e) => e.example.startsWith('http://www.wikidata.org/'));
    const totalLinks = wdLinks.reduce((a, e) => a + e.links, 0);
    return `
      <div class="tiles">
        <div class="tile glass-sub"><strong>${NF.format(s.triples)}</strong><span>triples loaded · +${NF.format(s.inferred)} inferred by GraphDB</span></div>
        <div class="tile glass-sub"><strong>${s.classes.length}</strong><span>classes</span></div>
        <div class="tile glass-sub"><strong>${s.predicates.size}</strong><span>predicates</span></div>
        <div class="tile glass-sub tile--wd"><strong>${NF.format(totalLinks)}</strong><span>links to Wikidata</span></div>
      </div>
      <figure class="schema glass-sub">${this.schemaSvg(s)}
        <figcaption><span class="legend"><i></i>Our graph · instances</span><span class="legend"><i class="wd"></i>Wikidata</span>Edge numbers = triples per predicate</figcaption>
      </figure>
      <div class="rgrid">
        <section class="panel-card glass-sub">
          <h3>Links leaving the graph</h3>
          <ul class="list">${s.external
            .map(
              (e) => `<li><span class="k"><code>${escapeHtml(curie(e.p))}</code></span>
                <span class="v"><span class="n">${NF.format(e.links)}</span> <span class="muted">to ${NF.format(e.targets)} entities · e.g.</span> ${iriLink(e.example)}</span></li>`,
            )
            .join('')}</ul>
        </section>
      </div>`;
  }

  private schemaSvg(s: GraphStats): string {
    const byId = new Map(NODES.map((n) => [n.id, n]));
    const classCount = new Map(s.classes.map((c) => [c.cls, c]));
    const edges = EDGES.map((e) => {
      const a = byId.get(e.from)!;
      const b = byId.get(e.to)!;
      const x1 = a.x + W / 2;
      const y1 = a.y + H / 2;
      const x2 = b.x - W / 2;
      const y2 = b.y + H / 2;
      // Archi verticali (stessa colonna): dal bordo inferiore/superiore.
      const vertical = Math.abs(a.x - b.x) < 5;
      const [sx, sy, tx, ty] = vertical ? [a.x, a.y + H, b.x, b.y] : [x1, y1 + (e.dy ?? 0) / 2, x2, y2 + (e.dy ?? 0) / 2];
      const n = s.predicates.get(e.p) ?? 0;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2 + (e.dy ?? 0);
      const ext = byId.get(e.to)!.external ? ' edge--ext' : '';
      return `<g class="edge${ext}">
        <line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" marker-end="url(#arrow)"/>
        <text x="${mx}" y="${my - 4}" text-anchor="middle">${escapeHtml(e.label)}</text>
        <text class="edge__n" x="${mx}" y="${my + 9}" text-anchor="middle">${NF.format(n)}</text>
      </g>`;
    }).join('');
    const nodes = NODES.map((n) => {
      const c = n.cls ? classCount.get(n.cls) : undefined;
      const target = n.example ?? c?.example;
      const sub = n.external ? 'Wikidata' : c ? `${NF.format(c.n)} instances` : '';
      const body = `<rect x="${n.x - W / 2}" y="${n.y}" width="${W}" height="${H}" rx="8"/>
        <text x="${n.x}" y="${n.y + 21}" text-anchor="middle" class="node__title">${escapeHtml(n.title)}</text>
        <text x="${n.x}" y="${n.y + 38}" text-anchor="middle" class="node__sub">${escapeHtml(sub)}</text>`;
      const cls = `node${n.external ? ' node--ext' : ''}`;
      return target ? `<a href="${resourceHref(target)}" class="${cls}">${body}</a>` : `<g class="${cls}">${body}</g>`;
    }).join('');
    return `<svg viewBox="0 0 1030 490" role="img" aria-label="Ontology diagram with live counts">
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>
      ${edges}${nodes}</svg>`;
  }
}

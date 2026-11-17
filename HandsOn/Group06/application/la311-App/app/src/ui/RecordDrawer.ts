/**
 * FR3 · Scheda di una richiesta (Mockup B) come foglio in vetro.
 * Mostra solo l'essenziale: stato, luogo, cronologia, instradamento e il
 * cammino nel grafo fino a Wikidata. Il resto è in "More details".
 */
import { isAbortError, type Row } from '../sparql/client';
import type { La311Repository } from '../sparql/queries';
import { badgeHtml, escapeHtml, statusHtml, styleFor } from '../map/icons';
import type { AppState, Store } from '../state';
import { resourceHref } from '../router';
import { icon } from './symbols';

const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const DAY_Y = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export class RecordDrawer {
  private controller: AbortController | null = null;

  constructor(
    private readonly root: HTMLElement,
    store: Store<AppState>,
    private readonly repo: La311Repository,
  ) {
    store.subscribe((s, prev) => {
      if (s.selectedSr !== prev.selectedSr) void this.open(s.selectedSr);
    });
    void this.open(store.get().selectedSr);
  }

  private async open(sr: string | null): Promise<void> {
    this.controller?.abort();
    document.body.classList.toggle('has-drawer', Boolean(sr));
    if (!sr) {
      this.root.hidden = true;
      return;
    }
    this.controller = new AbortController();
    const signal = this.controller.signal;
    this.root.hidden = false;
    this.root.innerHTML = this.head(`<p class="eyebrow">Loading</p><h2>SR ${escapeHtml(sr)}</h2>`) + '<div class="skeleton" style="margin-top:16px"></div>';
    this.bindClose();

    try {
      const r = await this.repo.record(sr, signal);
      if (!r) {
        this.root.innerHTML = this.head(`<p class="eyebrow">Not found</p><h2>SR ${escapeHtml(sr)}</h2>`) + '<p class="muted">This number is not in the 2025 extract.</p>';
        this.bindClose();
        return;
      }
      const linked = [r.ncWikidata, r.cdMemberWikidata, r.city].filter(Boolean).map(String);
      const labels = await this.repo.wikidataLabels(linked, signal);
      this.root.innerHTML = this.body(r, labels);
      this.bindClose();
    } catch (err) {
      if (isAbortError(err)) return;
      this.root.innerHTML = this.head(`<p class="eyebrow">Error</p><h2>SR ${escapeHtml(sr)}</h2>`) + `<p class="muted">${escapeHtml(String(err))}</p>`;
      this.bindClose();
    }
  }

  private body(r: Row, labels: Map<string, string>): string {
    const type = String(r.requestType);
    const date = (v: unknown) => (v instanceof Date ? v : undefined);
    const created = date(r.created);
    const steps = [
      ['Reported', created],
      ['Serviced', date(r.serviceDate)],
      ['Closed', date(r.closed)],
    ].filter(([, d]) => d) as [string, Date][];
    // L'indirizzo contiene già lo ZIP: lo si mostra una volta sola.
    const address = r.address ? String(r.address) : 'Address not published';
    const area = r.regionLabel ? String(r.regionLabel) : '';
    const fact = (label: string, value: unknown) =>
      `<div class="fact"><span>${label}</span><strong title="${escapeHtml(String(value ?? '—'))}">${escapeHtml(String(value ?? '—'))}</strong></div>`;
    const more: [string, unknown][] = [
      ['Planning commission', r.apc],
      ['Police precinct', r.policePrecinct],
      ['Council district', r.cd ? `CD ${r.cd}` : undefined],
      ['Last updated', r.updated instanceof Date ? DAY_Y.format(r.updated) : undefined],
      ['Location precision', r.approximate === 'Y' ? 'Approximate' : r.approximate === 'N' ? 'Exact' : undefined],
    ];

    return `
      ${this.head(`
        <p class="eyebrow">${escapeHtml(styleFor(type).label)}</p>
        <h2>SR ${escapeHtml(String(r.srNumber))}</h2>`, badgeHtml(type))}
      <div class="record__row">${statusHtml(String(r.status))}${created ? `<span>Reported ${DAY_Y.format(created)}</span>` : ''}</div>
      <p class="record__addr">${icon('pin', 18)}<span>${escapeHtml(address)}${area ? `<small>${escapeHtml(area)}</small>` : ''}</span></p>
      ${
        steps.length > 1
          ? `<ol class="timeline">${steps.map(([label, d]) => `<li><strong>${DAY.format(d)}</strong>${label}</li>`).join('')}</ol>`
          : ''
      }
      <div class="facts">
        ${fact('Channel', r.requestSource)}
        ${fact('Owner', r.owner)}
        ${fact('Assigned to', r.assignTo)}
      </div>

      <h3 class="section-title"><span class="dot-wd"></span>Linked data</h3>
      <div class="linkcard glass-sub">
        ${linkGraphSvg(r, labels)}
        <p class="caption">Tap any node to explore it. Purple nodes live on Wikidata.</p>
      </div>

      <details class="more">
        <summary>More details</summary>
        <dl class="kv">${more
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(String(v))}</dd>`)
          .join('')}</dl>
      </details>`;
  }

  private head(title: string, badge = ''): string {
    return `<header class="sheet__head">${badge}<div>${title}</div>
      <button type="button" class="icon-btn drawer__close" aria-label="Close record">${icon('close')}</button></header>`;
  }

  private bindClose(): void {
    this.root.querySelector('.drawer__close')?.addEventListener('click', () => {
      location.hash = '#/';
    });
  }
}

/* ------------------------------------------------------------------ */
/* Cammino nel grafo di questa richiesta, disegnato in SVG              */
/* ------------------------------------------------------------------ */

interface GNode {
  iri?: string;
  kind: string;
  label: string;
  x: number;
  y: number;
  ext?: boolean;
}

const NW = 104;
const NH = 40;

function linkGraphSvg(r: Row, labels: Map<string, string>): string {
  const s = (v: unknown) => (v === undefined ? undefined : String(v));
  const short = (v: string, n = 15) => (v.length > n ? v.slice(0, n - 1) + '…' : v);
  const wdLabel = (iri?: string) => (iri ? labels.get(iri) ?? iri.split('/').pop()! : '');

  const nodes: Record<string, GNode> = {
    sr: { iri: s(r.sr), kind: 'REQUEST', label: String(r.srNumber), x: 170, y: 8 },
    org: { iri: s(r.ownerNode), kind: 'OWNER', label: s(r.owner) ?? '—', x: 56, y: 92 },
    loc: { iri: s(r.loc), kind: 'LOCATION', label: s(r.zip) ? `ZIP ${r.zip}` : 'point', x: 170, y: 92 },
    svc: { iri: s(r.serviceNode), kind: 'SERVICE', label: s(r.assignTo) ?? '—', x: 284, y: 92 },
    region: { iri: s(r.region), kind: 'REGION', label: s(r.regionLabel) ?? '—', x: 170, y: 176 },
    nc: { iri: s(r.ncWikidata), kind: 'NEIGHBORHOOD', label: wdLabel(s(r.ncWikidata)), x: 56, y: 262, ext: true },
    member: { iri: s(r.cdMemberWikidata), kind: 'COUNCIL MEMBER', label: wdLabel(s(r.cdMemberWikidata)), x: 170, y: 262, ext: true },
    city: { iri: s(r.city), kind: 'CITY', label: wdLabel(s(r.city)), x: 284, y: 262, ext: true },
  };
  const edges: [string, string, string][] = [
    ['sr', 'org', 'responsible'],
    ['sr', 'loc', 'hasLocation'],
    ['sr', 'svc', 'assignedTo'],
    ['loc', 'region', 'isWithin'],
    ['region', 'nc', 'ncName'],
    ['region', 'member', 'cdMember'],
    ['region', 'city', 'containedIn'],
  ];

  const edgeSvg = edges
    .filter(([a, b]) => nodes[a].iri && nodes[b].iri)
    .map(([a, b, label]) => {
      const A = nodes[a];
      const B = nodes[b];
      const [x1, y1, x2, y2] = [A.x, A.y + NH, B.x, B.y];
      // Etichette sfalsate: archi verticali vicino all'origine, diagonali vicino alla destinazione.
      const vertical = x1 === x2;
      const k = vertical ? 0.3 : 0.74;
      const lx = x1 + (x2 - x1) * k + (vertical ? 4 : 0);
      const ly = y1 + (y2 - y1) * k + 3;
      const anchor = vertical ? 'start' : 'middle';
      return `<g class="edge${B.ext ? ' edge--ext' : ''}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#rarrow)"/>
        <text x="${lx}" y="${ly}" text-anchor="${anchor}">${label}</text></g>`;
    })
    .join('');

  const nodeSvg = Object.values(nodes)
    .map((n) => {
      const body = `<rect x="${n.x - NW / 2}" y="${n.y}" width="${NW}" height="${NH}" rx="10"/>
        <text x="${n.x}" y="${n.y + 15}" text-anchor="middle" class="node__sub">${escapeHtml(n.kind)}</text>
        <text x="${n.x}" y="${n.y + 30}" text-anchor="middle" class="node__title">${escapeHtml(short(n.label || 'not linked'))}</text>`;
      const cls = `node${n.ext ? ' node--ext' : ''}${n.iri ? '' : ' node--missing'}`;
      return n.iri
        ? `<a href="${resourceHref(n.iri)}" class="${cls}"><title>${escapeHtml(n.iri)}</title>${body}</a>`
        : `<g class="${cls}">${body}</g>`;
    })
    .join('');

  return `<svg class="linkgraph" viewBox="0 0 340 310" role="img" aria-label="Graph path from this request to Wikidata">
    <defs><marker id="rarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>${edgeSvg}${nodeSvg}</svg>`;
}

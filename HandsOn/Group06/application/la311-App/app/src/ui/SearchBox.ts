/**
 * FR2 · Ricerca per numero SR o indirizzo, combinata con i filtri del pannello.
 * Cerca mentre si scrive (debounce), Invio apre il primo risultato, Esc chiude.
 */
import { isAbortError } from '../sparql/client';
import type { La311Repository, SearchHit } from '../sparql/queries';
import { badgeHtml, escapeHtml, statusHtml, styleFor } from '../map/icons';
import type { AppState, Store } from '../state';

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export class SearchBox {
  private controller: AbortController | null = null;
  private readonly input: HTMLInputElement;
  private readonly results: HTMLElement;
  private debounce: number | undefined;
  private hits: SearchHit[] = [];

  constructor(
    form: HTMLFormElement,
    private readonly store: Store<AppState>,
    private readonly repo: La311Repository,
    private readonly onPick: (hit: SearchHit) => void,
  ) {
    this.input = form.querySelector('input')!;
    this.results = form.querySelector('.search__results')!;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.hits[0]) this.pick(this.hits[0]);
      else void this.run();
    });
    this.input.addEventListener('input', () => {
      window.clearTimeout(this.debounce);
      this.debounce = window.setTimeout(() => void this.run(), 350);
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.input.value = '';
        this.close();
      }
    });
    document.addEventListener('click', (e) => {
      if (!form.contains(e.target as Node)) this.close();
    });
  }

  private async run(): Promise<void> {
    const text = this.input.value.trim();
    this.hits = [];
    if (text.length < 3) return this.close();
    this.controller?.abort();
    this.controller = new AbortController();
    try {
      this.hits = await this.repo.search(text, this.store.get().filters, this.controller.signal);
      if (this.hits.length === 0) {
        this.show('<li class="search__empty">No match in the 2025 extract with the current filters.</li>');
        return;
      }
      this.show(
        this.hits
          .map(
            (h, i) => `
          <li><button type="button" data-i="${i}">
            ${badgeHtml(h.requestType, 'sm')}
            <span class="hit__body">
              <span class="hit__title">${escapeHtml(h.address ?? `SR ${h.srNumber}`)}</span>
              <span class="hit__sub">${escapeHtml(styleFor(h.requestType).label)} · ${DATE_FMT.format(h.created)}</span>
            </span>
            ${statusHtml(h.status)}
          </button></li>`,
          )
          .join(''),
      );
      this.results.querySelectorAll<HTMLButtonElement>('button[data-i]').forEach((btn) =>
        btn.addEventListener('click', () => this.pick(this.hits[Number(btn.dataset.i)])),
      );
    } catch (err) {
      if (!isAbortError(err)) this.show(`<li class="search__empty">${escapeHtml(String(err))}</li>`);
    }
  }

  private pick(hit: SearchHit): void {
    this.onPick(hit);
    this.input.blur();
    this.close();
  }

  private show(html: string): void {
    this.results.innerHTML = html;
    this.results.hidden = false;
  }

  private close(): void {
    this.results.hidden = true;
    this.results.innerHTML = '';
  }
}

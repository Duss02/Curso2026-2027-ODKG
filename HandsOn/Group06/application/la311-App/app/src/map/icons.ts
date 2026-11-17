/**
 * Simbologia per tipo di richiesta (FR1) e per stato.
 *
 * Ogni categoria ha forma + sigla + colore: la distinzione non dipende
 * dal solo colore (requisito non funzionale di leggibilità).
 */
import L from './leaflet-global';

export type Shape = 'circle' | 'square' | 'diamond';

export interface CategoryStyle {
  label: string;
  code: string;
  color: string;
  shape: Shape;
}

/** Valori letterali di la311:requestType presenti nell'estratto 2025. */
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'Bulky Items': { label: 'Bulky item collection', code: 'BI', color: '#176d68', shape: 'square' },
  'Graffiti Removal': { label: 'Graffiti removal', code: 'GR', color: '#cf654b', shape: 'circle' },
  'Illegal Dumping Pickup': { label: 'Illegal dumping pickup', code: 'ID', color: '#8a5a12', shape: 'diamond' },
  'Metal/Household Appliances': { label: 'Metal & appliances', code: 'MA', color: '#4d5f9a', shape: 'square' },
  'Homeless Encampment': { label: 'Homeless encampment', code: 'HE', color: '#7a4b8c', shape: 'circle' },
  'Electronic Waste': { label: 'Electronic waste', code: 'EW', color: '#2f7d3a', shape: 'diamond' },
  'Multiple Streetlight Issue': { label: 'Streetlights (multiple)', code: 'SL', color: '#b88a1b', shape: 'circle' },
  'Single Streetlight Issue': { label: 'Streetlight (single)', code: 'S1', color: '#b88a1b', shape: 'square' },
  'Dead Animal Removal': { label: 'Dead animal removal', code: 'DA', color: '#5d4037', shape: 'diamond' },
  'Report Water Waste': { label: 'Water waste', code: 'WW', color: '#1f6fa8', shape: 'circle' },
  Feedback: { label: 'Feedback', code: 'FB', color: '#65727a', shape: 'square' },
  Other: { label: 'Other', code: 'OT', color: '#65727a', shape: 'diamond' },
};

const FALLBACK: CategoryStyle = { label: '', code: '··', color: '#65727a', shape: 'circle' };

export function styleFor(requestType: string): CategoryStyle {
  return CATEGORY_STYLES[requestType] ?? { ...FALLBACK, label: requestType };
}

/** Badge HTML riutilizzato da marker, legenda e risultati di ricerca. */
export function badgeHtml(requestType: string, size: 'sm' | 'md' = 'md'): string {
  const st = styleFor(requestType);
  return `<span class="badge badge--${st.shape} badge--${size}" style="--c:${st.color}" aria-hidden="true"><span>${st.code}</span></span>`;
}

const iconCache = new Map<string, L.DivIcon>();

export function markerIcon(requestType: string): L.DivIcon {
  let icon = iconCache.get(requestType);
  if (!icon) {
    icon = L.divIcon({
      className: 'sr-marker',
      html: badgeHtml(requestType),
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12],
    });
    iconCache.set(requestType, icon);
  }
  return icon;
}

/** Stato come testo + simbolo, mai solo colore. */
const STATUS_GLYPH: Record<string, string> = {
  Open: '○',
  Pending: '◐',
  Closed: '●',
  Cancelled: '⊘',
  'Referred Out': '↗',
};

export function statusHtml(status: string): string {
  const cls = status.toLowerCase().replace(/\s+/g, '-');
  return `<span class="status status--${cls}"><span aria-hidden="true">${STATUS_GLYPH[status] ?? '•'}</span> ${escapeHtml(status)}</span>`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

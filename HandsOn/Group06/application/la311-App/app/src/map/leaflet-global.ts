/**
 * leaflet.markercluster e leaflet.heat sono plugin UMD che si agganciano
 * alla variabile globale `L`: la esponiamo prima che vengano importati.
 */
import L from 'leaflet';

(window as unknown as { L: typeof L }).L = L;

declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }
  interface HeatLayer extends Layer {
    setLatLngs(latlngs: Array<[number, number, number?]>): this;
    setOptions(options: HeatLayerOptions): this;
  }
  function heatLayer(latlngs: Array<[number, number, number?]>, options?: HeatLayerOptions): HeatLayer;
}

export default L;

import { memo, useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  ScaleControl,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { hotspotColor, number, SEVERITIES, SEVERITY_COLORS } from "../data";
import type { Accident, HotspotResult, MapMode } from "../types";
import { Icon } from "./Icon";

const icons = Object.fromEntries(
  SEVERITIES.map((level) => [
    level,
    L.divIcon({
      className: "accident-marker",
      html: `<span style="background:${SEVERITY_COLORS[level]}">${level}</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14],
    }),
  ]),
) as Record<number, L.DivIcon>;

type Bounds = [[number, number], [number, number]];

function MapTools({ bounds }: { bounds: Bounds }) {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control">
        <button
          className="map-fit"
          title="Fit dataset extent"
          aria-label="Fit dataset extent"
          onClick={() => map.fitBounds(bounds, { padding: [28, 28] })}
        >
          <Icon name="target" />
        </button>
      </div>
    </div>
  );
}

export default memo(function AccidentMap({
  accidents,
  bounds,
  onSelect,
  mode,
  hotspots,
}: {
  accidents: Accident[];
  bounds: Bounds;
  onSelect: (accident: Accident) => void;
  mode: MapMode;
  hotspots: HotspotResult | null;
}) {
  const [tileError, setTileError] = useState(false);
  return (
    <div
      className="map-shell"
      role="region"
      aria-label={
        mode === "markers"
          ? "Interactive map of loaded accidents"
          : "Accident concentration grid for all matches"
      }
    >
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [28, 28] }}
        zoomControl={false}
        scrollWheelZoom={false}
        preferCanvas
        className="accident-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{
            loading: () => setTileError(false),
            tileerror: () => setTileError(true),
          }}
        />
        <ZoomControl position="topleft" />
        <ScaleControl position="bottomleft" imperial={false} />
        <MapTools bounds={bounds} />
        {mode === "markers" ? (
          <MarkerClusterGroup
            chunkedLoading
            removeOutsideVisibleBounds
            animate={false}
            showCoverageOnHover={false}
            maxClusterRadius={45}
          >
            {accidents.map((accident) => (
              <Marker
                key={accident.uri}
                position={[accident.latitude, accident.longitude]}
                icon={icons[accident.severity]}
                title={`${accident.id} · Severity ${accident.severity}`}
                alt={`Accident ${accident.id}, severity ${accident.severity}`}
                keyboard
                eventHandlers={{ click: () => onSelect(accident) }}
              >
                <Popup minWidth={230} maxWidth={280}>
                  <div className="p-5">
                    <strong>{accident.street_name || "Unknown street"}</strong>
                    <p className="text-xs">
                      {accident.id} · Severity {accident.severity}
                    </p>
                    <button
                      className="secondary-button"
                      onClick={() => onSelect(accident)}
                    >
                      Open full details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          hotspots?.cells.map((cell) => (
            <Rectangle
              key={`${cell.south}:${cell.west}`}
              bounds={[
                [cell.south, cell.west],
                [cell.north, cell.east],
              ]}
              pathOptions={{
                color: "#84552a",
                weight: 0.6,
                fillColor: hotspotColor(cell.count),
                fillOpacity: 0.72,
              }}
            >
              <Popup>
                <div className="p-5">
                  <strong>{number(cell.count)} recorded accidents</strong>
                  <p>In this 0.005° grid cell, across all active filters.</p>
                  <p>Counts describe concentration, not accident risk.</p>
                </div>
              </Popup>
            </Rectangle>
          ))
        )}
      </MapContainer>
      <div className="map-label">
        <span className="size-1.5 rounded-full bg-teal-700" />
        New York · Historical dataset
      </div>
      {tileError && (
        <p role="status" className="tile-error">
          Map tiles could not load. Check your internet connection; accident
          data is still available.
        </p>
      )}
    </div>
  );
});

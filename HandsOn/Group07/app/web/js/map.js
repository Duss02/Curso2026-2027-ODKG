import { select } from "./sparql.js";

// All states with their Wikidata link. The QID is the key into data/states.geo.json,
// because the KG uses English state names and the boundary file German ones.
const STATES_QUERY = `
SELECT ?state ?label ?wikidata WHERE {
    ?state a dbd:State ;
           rdfs:label ?label .
    OPTIONAL {
        ?state owl:sameAs ?wikidata .
        FILTER(CONTAINS(STR(?wikidata), "wikidata.org/entity/"))
    }
}
ORDER BY ?label`;

const GERMANY_BOUNDS = [[47.2, 5.8], [55.1, 15.1]];

// Everything outside the selected states gets this semi-transparent white layer.
const MASK_STYLE = {
  pane: "mask",
  stroke: false,
  fillColor: "#ffffff",
  fillOpacity: 0.65,
  interactive: false,
};
const BORDER_STYLE = { color: "#8c959f", weight: 0.8, fill: false, interactive: false };
const SELECTED_BORDER_STYLE = { color: "#1f2328", weight: 1.8, fill: false, interactive: false };
const STATION_STYLE = {
  pane: "stations",
  radius: 6,
  color: "#ffffff",
  weight: 1.5,
  fillOpacity: 0.9,
};

// Colour classes for a station's average arrival delay (upper bound inclusive, in minutes).
// The ≤ 1 min class exists because most stations are on time and would otherwise share one colour.
const DELAY_CLASSES = [
  { max: 1, color: "#1a9641", label: "≤ 1 min" },
  { max: 5, color: "#a6d96a", label: "1–5 min" },
  { max: 15, color: "#fdae61", label: "5–15 min" },
  { max: Infinity, color: "#d7191c", label: "> 15 min" },
];

const title = document.getElementById("map-title");
const status = document.getElementById("map-status");

const selectedUris = new URLSearchParams(location.search).getAll("state");
if (selectedUris.length === 0) {
  location.replace("index.html");
}

document.getElementById("change-selection").href = `index.html${location.search}`;

// zoomSnap 0.25 lets fitBounds frame the selected states tightly. It also makes each
// mouse-wheel step smaller, so wheelPxPerZoomLevel (default 60) is lowered to bring one
// wheel notch back to about one zoom level.
const map = L.map("map", { zoomSnap: 0.25, wheelPxPerZoomLevel: 40 }).fitBounds(GERMANY_BOUNDS);

// Panes control the stacking order: tiles (200) < mask < state borders < stations < popups (700).
map.createPane("mask").style.zIndex = 450;
map.createPane("borders").style.zIndex = 460;
map.createPane("stations").style.zIndex = 500;
for (const pane of ["mask", "borders"]) {
  map.getPane(pane).style.pointerEvents = "none";
}

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const ESRI_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community";
const esriLightGray = L.layerGroup([
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16,
    attribution: ESRI_ATTRIBUTION,
  }),
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16,
  }),
]);

const bkgGrey = L.tileLayer(
  "https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_grau/default/WEBMERCATOR/{z}/{y}/{x}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.bkg.bund.de">BKG</a> (2026) '
      + '<a href="https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html">data sources</a>',
  });

esriLightGray.addTo(map);

const railways = L.tileLayer("https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: `${OSM_ATTRIBUTION}, style: <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> `
    + '<a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
});

L.control.layers({ "Esri Light Gray": esriLightGray, "BKG TopPlus Open (grey)": bkgGrey }, { "Railway lines (OpenRailwayMap)": railways }).addTo(map);
L.control.scale({ imperial: false }).addTo(map);

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
  status.hidden = false;
}

function toQid(wikidataUri) {
  return wikidataUri?.match(/Q\d+$/)?.[0];
}

// GeoJSON rings are [lng, lat]; Leaflet wants [lat, lng].
function ringsOf(feature) {
  const { type, coordinates } = feature.geometry;
  const polygons = type === "MultiPolygon" ? coordinates : [coordinates];
  return polygons.flat().map((ring) => ring.map(([lng, lat]) => [lat, lng]));
}

// A world-sized polygon with every ring of the selected states as a hole.
// SVG renders it with the even-odd rule, so a hole inside a selected state
// (Berlin inside Brandenburg) stays masked unless it is selected as well.
function drawMask(selectedFeatures) {
  const world = [[-90, -360], [-90, 360], [90, 360], [90, -360]];
  L.polygon([world, ...selectedFeatures.flatMap(ringsOf)], MASK_STYLE).addTo(map);
}

async function init() {
  const [{ rows: states }, geoJson] = await Promise.all([
    select(STATES_QUERY),
    fetch("data/states.geo.json").then((response) => {
      if (!response.ok) throw new Error(`Could not load state boundaries (${response.status})`);
      return response.json();
    }),
  ]);

  const selectedStates = states.filter(({ state }) => selectedUris.includes(state));
  if (selectedStates.length === 0) {
    title.textContent = "No states selected";
    showStatus("None of the selected states exist in the knowledge graph.", true);
    return;
  }
  title.textContent = selectedStates.map(({ label }) => label).join(", ");

  const stateIris = toSparqlIris(selectedStates.map(({ state }) => state));

  // One row per station with the average arrival delay over all of its train stops.
  const STATION_QUERY = `
    SELECT ?station ?label ?lon ?lat ?zip
           (AVG(?delay) AS ?avgDelay)
           (COUNT(?stop) AS ?stopCount)
    WHERE {
        VALUES ?state { ${stateIris} }
        ?station a dbd:Station ;
                 dbd:inCity/dbd:inState ?state ;
                 rdfs:label ?label ;
                 dbd:longitude ?lon ;
                 dbd:latitude ?lat ;
                 dbd:postalCode ?zip .
        ?stop dbd:atStation ?station ;
              dbd:arrivalDelayMinutes ?delay .
    }
    GROUP BY ?station ?label ?lon ?lat ?zip`;

  const selectedQids = new Set(selectedStates.map(({ wikidata }) => toQid(wikidata)));
  const selectedFeatures = geoJson.features.filter((f) => selectedQids.has(f.properties.wikidata));

  const missing = selectedStates.filter(({ wikidata }) =>
    !geoJson.features.some((f) => f.properties.wikidata === toQid(wikidata)));
  if (missing.length > 0) {
    showStatus(`No boundary found for: ${missing.map(({ label }) => label).join(", ")}`, true);
  }

  drawMask(selectedFeatures);
  L.geoJSON(geoJson, { ...BORDER_STYLE, pane: "borders" }).addTo(map);
  if (selectedFeatures.length > 0) {
    const selectedLayer = L.geoJSON(selectedFeatures, { ...SELECTED_BORDER_STYLE, pane: "borders" }).addTo(map);
    map.fitBounds(selectedLayer.getBounds(), { padding: [20, 20] });
  }

  const {rows: stations} = await select(STATION_QUERY);
  drawStations(stations);
  addLegend();
  if (stations.length === 0) {
    showStatus("No stations found in the selected states.");
  }
}

// Labels in the KG look like "Station:Berlin Bellevue station".
function stationName(label) {
  return label.replace(/^Station:/, "");
}

// Tooltips and popups are built from DOM nodes with textContent, because Leaflet
// inserts string content as HTML and labels from the KG must not be interpreted as HTML.
function textElement(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function delayClass(avgDelay) {
  return DELAY_CLASSES.find(({ max }) => avgDelay <= max);
}

function stationPopup({ label, zip, avgDelay, stopCount }) {
  const stops = Number(stopCount) === 1 ? "1 stop" : `${stopCount} stops`;
  const popup = document.createElement("div");
  popup.append(
    textElement("strong", stationName(label)),
    textElement("div", `Average arrival delay: ${Number(avgDelay).toFixed(1)} min (${stops})`),
    textElement("div", `Postal code: ${zip}`),
  );
  return popup;
}

function drawStations(stations) {
  // Draw the most delayed stations last, so they lie on top where dots overlap.
  const sorted = [...stations].sort((a, b) => Number(a.avgDelay) - Number(b.avgDelay));
  for (const station of sorted) {
    const { color } = delayClass(Number(station.avgDelay));
    L.circleMarker([Number(station.lat), Number(station.lon)], { ...STATION_STYLE, fillColor: color })
      .bindTooltip(() => textElement("span", stationName(station.label)))
      .bindPopup(() => stationPopup(station))
      .addTo(map);
  }
}

function addLegend() {
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => {
    const container = L.DomUtil.create("div", "legend");
    container.append(textElement("strong", "Average arrival delay"));
    for (const { color, label } of DELAY_CLASSES) {
      const swatch = textElement("span", "");
      swatch.className = "legend-swatch";
      swatch.style.background = color;
      const row = document.createElement("div");
      row.append(swatch, textElement("span", label));
      container.append(row);
    }
    return container;
  };
  legend.addTo(map);
}

init().catch((error) => {
  console.error(error);
  title.textContent = "";
  showStatus("Could not load the map data. Is GraphDB running?", true);
});

function toSparqlIris(uris) {
  return uris.map((uri) => `<${uri}>`).join(" ");
}

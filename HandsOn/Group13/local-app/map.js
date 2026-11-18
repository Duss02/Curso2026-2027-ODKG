(() => {
  let map, markers, outlines, districtData, selected, neighbors = [];
  const markerById = new Map();
  const val = (row, key) => row?.[key]?.value ?? '';
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const element = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  function drawOutlines() {
    if (!map || !districtData) return;
    outlines?.remove();
    const origin = normalize(val(selected, 'districtName'));
    const bordering = new Set(neighbors.map(row => normalize(val(row, 'districtName'))).filter(Boolean));
    outlines = L.geoJSON(districtData, {
      style: feature => {
        const name = normalize(feature.properties.NOMBRE);
        const isOrigin = name === origin, isNeighbor = bordering.has(name);
        const color = getComputedStyle(document.documentElement).getPropertyValue(isOrigin ? '--cp-accent' : '--cp-border-strong').trim();
        return { color, weight: isOrigin ? 3 : 1, fillColor: color,
          fillOpacity: isOrigin ? .13 : isNeighbor ? .07 : .015, dashArray: isNeighbor ? '5 4' : undefined };
      },
      onEachFeature: (feature, layer) => layer.bindTooltip(element('span', feature.properties.NOMBRE)),
    }).addTo(map);
    outlines.bringToBack();
  }
  function clear() {
    selected = undefined; neighbors = [];
    markers?.clearLayers(); markerById.clear(); drawOutlines();
    document.getElementById('fit-map').disabled = true;
  }
  function fit() {
    if (!map || !markers?.getLayers().length) return;
    map.fitBounds(markers.getBounds().pad(.18), { maxZoom: 14 });
  }
  function render(rows, baseline, edges, handlers) {
    selected = baseline; neighbors = edges;
    if (!map) return;
    markers.clearLayers(); markerById.clear(); drawOutlines();
    for (const row of rows) {
      if (val(row, 'latitude') === '' || val(row, 'longitude') === '') continue;
      const valid = Number(val(row, 'samples')) > 0;
      const occupancy = Number(val(row, 'occupancy'));
      const category = !valid ? 'unknown' : occupancy < 50 ? 'low' : occupancy < 80 ? 'medium' : 'high';
      const isSelected = val(row, 'relationship') === 'selected';
      const icon = L.divIcon({ className: 'parking-icon', html: `<span class="parking-dot ${category}${isSelected ? ' origin' : ''}"></span>`,
        iconSize: [26, 26], iconAnchor: [13, 13] });
      const marker = L.marker([Number(val(row, 'latitude')), Number(val(row, 'longitude'))], {
        icon, title: `${val(row, 'name')}: ${handlers.measure(row)}`, alt: `${val(row, 'name')}: ${handlers.measure(row)}`,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(markers);
      const popup = element('div');
      popup.append(element('strong', val(row, 'name')), element('p', `${val(row, 'districtName')} / ${handlers.title}`),
        element('p', handlers.measure(row)), element('p', handlers.coverage(row)));
      const coLocated = rows.filter(other => val(other, 'parking') !== val(row, 'parking') &&
        val(other, 'latitude') === val(row, 'latitude') && val(other, 'longitude') === val(row, 'longitude'));
      if (coLocated.length) popup.append(element('p', `Other reviewed identities at this location: ${coLocated.map(other => val(other, 'name')).join(', ')}. Select them from the facility selector or lists.`));
      if (!isSelected) {
        const button = element('button', 'Compare from here');
        button.type = 'button'; button.addEventListener('click', () => handlers.choose(row)); popup.append(button);
      }
      marker.bindPopup(popup); markerById.set(val(row, 'parking'), marker);
      marker.on('click', () => {
        document.querySelectorAll('[data-parking]').forEach(card =>
          card.classList.toggle('selected', card.dataset.parking === val(row, 'parking')));
      });
    }
    document.getElementById('fit-map').disabled = !markers.getLayers().length;
    fit();
  }
  async function loadOutlines() {
    try {
      const response = await fetch('/data/districts.geojson');
      if (!response.ok) throw new Error(`Local outlines HTTP ${response.status}`);
      districtData = await response.json();
      if (!districtData.features?.length) throw new Error('District outlines are empty.');
      drawOutlines();
    } catch (error) {
      console.error(error);
      document.getElementById('map-status').textContent = `District outlines unavailable: ${error.message}. Parking lists and verified markers remain usable.`;
    }
  }
  function init() {
    if (typeof L === 'undefined') {
      document.getElementById('map-status').textContent = 'Local map library unavailable. Parking lists remain usable; restore the vendor files.';
      return;
    }
    map = L.map('map', { zoomControl: true }).setView([40.42, -3.70], 12);
    markers = L.featureGroup().addTo(map);
    map.attributionControl.addAttribution('Geography: <a href="https://geoportal.madrid.es/">Ayuntamiento de Madrid</a>');
    document.getElementById('fit-map').addEventListener('click', fit);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    tiles.on('tileerror', () => {
      document.getElementById('map-status').textContent = 'Online street tiles unavailable. Local outlines and parking markers still work.';
    });
    document.getElementById('streets').addEventListener('change', event => {
      if (event.target.checked) { tiles.addTo(map); tiles.bringToBack(); }
      else { tiles.remove(); document.getElementById('map-status').textContent = districtData ? 'Offline municipal outlines' : 'District outlines unavailable'; }
    });
    loadOutlines();
  }
  window.parkingMap = { init, clear, render, preview: id => {
    const marker = markerById.get(id);
    if (marker) { map.panTo(marker.getLatLng()); marker.openPopup(); }
  } };
})();

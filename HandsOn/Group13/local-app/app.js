const $ = id => document.getElementById(id);
const value = (row, key) => row?.[key]?.value ?? '';
const samples = row => Number(value(row, 'samples'));
const hasValue = row => samples(row) > 0 && value(row, 'occupancy') !== '';
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
const months = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, i, 1))));
let catalog = [], rows = [], baseline, controller, generation = 0;
let geographyWarning = '';
const years = row => value(row, 'years').split(',').filter(Boolean).sort().join(', ');
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function params() {
  return Object.fromEntries(['parking', 'originDistrict', 'month', 'year', 'metric', 'district', 'type'].map(id => [id, $(id).value]));
}
function title(p) {
  return `${months[Number(p.month) - 1]} ${p.year === 'average' ? 'average across recorded years' : p.year} / ${p.metric === 'daytime' ? 'daytime (09:00–21:00)' : 'overall'}`;
}
function showError(error) {
  if (error.name === 'AbortError') return;
  console.error(error);
  $('error').textContent = `${error.message} Check the local services and setup instructions.`;
  $('error').hidden = false;
}
async function query(operation, p = {}, signal) {
  const response = await fetch(`/api/query?${new URLSearchParams({ operation, ...p })}`, { signal });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? `Query HTTP ${response.status}`);
  const entry = node('details');
  entry.append(node('summary', `${operation}: ${payload.results.results.bindings.length} result rows`), node('pre', payload.query));
  const raw = node('details');
  raw.append(node('summary', 'SPARQL JSON results'), node('pre', JSON.stringify(payload.results, null, 2)));
  entry.append(raw); $('queries').prepend(entry);
  while ($('queries').children.length > 12) $('queries').lastElementChild.remove();
  return payload.results.results.bindings;
}
function resourceLink(uri, text = uri) {
  const url = new URL(uri);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported resource link.');
  const element = node('a', text);
  element.href = url.href; element.target = '_blank'; element.rel = 'noopener noreferrer';
  return element;
}
function measure(row) { return hasValue(row) ? `${number.format(Number(value(row, 'occupancy')))}%` : 'No valid data'; }
function coverage(row) {
  const count = samples(row), recorded = Number(value(row, 'recorded')), excluded = Number(value(row, 'excluded'));
  return `${count} valid observation${count === 1 ? '' : 's'}${count ? ` / years: ${years(row)}` : ''}. ` +
    `${excluded} flagged; ${recorded - count - excluded} missing metric values.`;
}
function locationAvailable(row) { return value(row, 'latitude') !== '' && value(row, 'longitude') !== ''; }
function choose(row) {
  $('parking').value = value(row, 'parking');
  updateOrigin(value(row, 'district'));
  load().catch(showError);
  $('selected').focus();
}
function updateOrigin(preferred = '') {
  const records = catalog.filter(row => value(row, 'kind') === 'parking' && value(row, 'value') === $('parking').value);
  const districts = [...new Set(records.map(row => value(row, 'other')))];
  $('originDistrict').replaceChildren();
  if (districts.length > 1) $('originDistrict').append(new Option('Choose a recorded district...', ''));
  for (const id of districts) {
    const label = catalog.find(row => value(row, 'kind') === 'district' && value(row, 'value') === id);
    $('originDistrict').append(new Option(value(label, 'label'), id));
  }
  if (districts.includes(preferred)) $('originDistrict').value = preferred;
  $('origin-context').hidden = districts.length <= 1;
  $('originDistrict').disabled = false;
}
function preview(row) {
  document.querySelectorAll('[data-parking]').forEach(element =>
    element.classList.toggle('selected', element.dataset.parking === value(row, 'parking')));
  if (locationAvailable(row)) window.parkingMap.preview(value(row, 'parking'));
}
function alternative(row) {
  const card = node('article', undefined, 'alternative');
  card.dataset.parking = value(row, 'parking');
  const heading = node('div', undefined, 'alternative-heading');
  const button = node('button', value(row, 'name'), 'row-button');
  button.type = 'button'; button.addEventListener('click', () => preview(row));
  heading.append(button, node('strong', measure(row)));
  card.append(heading, node('p', value(row, 'districtName'), 'muted small'));
  if (hasValue(row) && hasValue(baseline)) {
    const difference = Number(value(row, 'occupancy')) - Number(value(baseline, 'occupancy'));
    card.append(node('p', difference < 0 ? `${number.format(-difference)} percentage points lower` :
      difference > 0 ? `${number.format(difference)} percentage points higher` : 'Same historical occupancy',
    difference < 0 ? 'lower small' : 'muted small'));
  }
  card.append(node('p', coverage(row), 'muted small'));
  if ($('year').value === 'average' && years(row) !== years(baseline)) {
    card.append(node('p', 'Different year coverage from your selected facility.', 'coverage-warning small'));
  }
  if (!locationAvailable(row)) card.append(node('p', 'Verified location unavailable; shown in list only.', 'muted small'));
  const select = node('button', 'Compare from here', 'small');
  select.type = 'button'; select.addEventListener('click', () => choose(row));
  card.append(select);
  return card;
}
function renderBaseline(p) {
  $('selected-title').textContent = value(baseline, 'name');
  const content = $('baseline');
  content.replaceChildren(node('p', `${value(baseline, 'districtName')} / ${title(p)}`, 'muted'),
    node('strong', measure(baseline), 'occupancy-value'), node('p', coverage(baseline), 'muted small'));
  if (hasValue(baseline)) {
    const min = value(baseline, 'minSpaces'), max = value(baseline, 'maxSpaces');
    content.append(node('p', p.year === 'average' ? `Capacity in contributing observations: ${min}${min === max ? '' : `–${max}`} spaces.` : `Spaces in this observation: ${min}.`, 'muted'));
  } else content.append(node('p', 'Alternatives can still be explored, but no lower-than-selected claim is made.', 'muted'));
  if (!locationAvailable(baseline)) content.append(node('p', 'No verified map location for this facility. Its occupancy is still available here.', 'coverage-warning'));
}
function renderAlternatives(p) {
  $('comparison-context').textContent = `${value(baseline, 'name')} → ${value(baseline, 'districtName')} / ${title(p)}`;
  for (const [relationship, id] of [['same', 'same'], ['border', 'border']]) {
    const group = rows.filter(row => value(row, 'relationship') === relationship && hasValue(row));
    $(id + '-count').textContent = group.length;
    $(id + '-list').replaceChildren(...group.map(alternative));
    if (!group.length) $(id + '-list').append(node('p', 'No alternatives with valid data match this selection.', 'muted small'));
  }
  const missing = rows.filter(row => value(row, 'relationship') !== 'selected' && !hasValue(row));
  $('unavailable-panel').hidden = !missing.length;
  $('unavailable-title').textContent = `${missing.length} other facilities without valid data for this selection`;
  $('unavailable-list').replaceChildren(...missing.map(alternative));
}
function renderNeighbors(neighbors) {
  const container = $('neighbors'); container.replaceChildren();
  const seen = new Set();
  for (const row of neighbors) {
    const edge = `${value(row, 'edgeSubject')} ${value(row, 'edgeObject')}`;
    if (seen.has(edge)) continue; seen.add(edge);
    const paragraph = node('p', undefined, 'small');
    const represented = value(row, 'district');
    const candidates = rows.filter(candidate => value(candidate, 'district') === represented);
    paragraph.append(resourceLink(value(row, 'edgeSubject'), value(row, 'edgeSubject').split('/').pop()),
      document.createTextNode(' — P47 → '),
      resourceLink(value(row, 'edgeObject'), value(row, 'edgeObject').split('/').pop()),
      document.createTextNode(` / ${value(row, 'neighborLabel')}: ${!represented ? 'no parking coverage in this dataset' :
        `${candidates.filter(hasValue).length} valid facilities under the current period and alternative filters`}.`));
    container.append(paragraph);
  }
  if (!neighbors.length) container.append(node('p', 'No border relationship recorded in this snapshot. Actual borders are unknown here.'));
}
function renderHistory(history) {
  const content = $('history'); content.replaceChildren();
  for (const [label, uri] of [['Facility', value(baseline, 'parking')], ['District', value(baseline, 'district')],
    ['Wikidata district', value(baseline, 'districtWD')]]) {
    const p = node('p', `${label}: `); p.append(resourceLink(uri)); content.append(p);
  }
  const wrap = node('div', undefined, 'history-wrap'); const table = node('table');
  const header = node('tr');
  for (const label of ['Year-month', 'Spaces', 'Raw occupancy', 'Quality', 'Observation']) header.append(node('th', label));
  const head = node('thead'); head.append(header); table.append(head);
  const body = node('tbody');
  for (const row of history) {
    const tr = node('tr');
    tr.append(node('td', `${value(row, 'year')}-${value(row, 'month').padStart(2, '0')}`),
      node('td', value(row, 'spaces')), node('td', `${value(row, 'occupancy')}%`),
      node('td', value(row, 'valid') === 'true' ? 'In range' : 'Flagged'));
    const source = node('td'); source.append(resourceLink(value(row, 'observation'), 'Source observation'));
    tr.append(source); body.append(tr);
  }
  table.append(body); wrap.append(table); content.append(wrap);
}
async function load() {
  const token = ++generation;
  controller?.abort(); controller = new AbortController();
  const p = params(); rows = []; baseline = undefined;
  $('error').hidden = !geographyWarning; $('error').textContent = geographyWarning; window.parkingMap.clear();
  $('location-status').textContent = 'Only verified municipal coordinates are mapped. Unmapped facilities remain in the lists.';
  for (const id of ['same-list', 'border-list', 'unavailable-list', 'neighbors', 'history']) $(id).replaceChildren();
  $('same-count').textContent = '0'; $('border-count').textContent = '0'; $('unavailable-panel').hidden = true;
  $('baseline').replaceChildren(node('p', p.parking ? 'Loading your selected parking...' : 'Choose a parking facility to begin.', 'muted'));
  $('selected-title').textContent = p.parking ? 'Your chosen parking' : 'Choose a parking facility to begin';
  $('comparison-context').textContent = p.parking ? 'Finding graph-connected alternatives...' : 'Choose a parking facility to find alternatives.';
  if (!p.parking || !p.originDistrict) {
    const message = p.parking ? 'This facility has multiple districts in the reviewed RDF. Choose a district context before comparing.' : 'Ready — choose a parking facility';
    $('status').textContent = message;
    $('baseline').replaceChildren(node('p', message, 'muted'));
    $('comparison-context').textContent = 'Choose a parking facility and, if requested, its district context.';
    $('selected').setAttribute('aria-busy', 'false');
    return;
  }
  $('status').textContent = 'Comparing historical occupancy...'; $('selected').setAttribute('aria-busy', 'true');
  try {
    const result = await query('facilityComparison', p, controller.signal);
    if (token !== generation) return;
    const selected = result.find(row => value(row, 'relationship') === 'selected');
    if (!selected) throw new Error('Selected facility context is missing from the reviewed graph.');
    const origin = value(selected, 'district');
    const [neighbors, history] = await Promise.all([
      query('neighbors', { ...p, district: origin }, controller.signal),
      query('history', p, controller.signal),
    ]);
    if (token !== generation) return;
    rows = result; baseline = selected;
    renderBaseline(p); renderAlternatives(p); renderNeighbors(neighbors); renderHistory(history);
    window.parkingMap.render(rows, baseline, neighbors, {
      measure, coverage, choose, preview, title: title(p),
    });
    const mapped = rows.filter(locationAvailable).length;
    $('location-status').textContent = `${mapped}/${rows.length} selected and related facilities have verified map locations. Unmapped facilities remain listed. Coordinates are current geographic context, not historical entrance locations.`;
    $('status').textContent = 'Comparison ready';
  } catch (error) {
    if (token === generation && error.name !== 'AbortError') {
      $('status').textContent = 'Comparison failed';
      $('baseline').replaceChildren(node('p', 'The comparison could not be loaded. No substitute data has been shown.'));
      $('comparison-context').textContent = 'Comparison unavailable.';
      showError(error);
    }
  } finally { if (token === generation) $('selected').setAttribute('aria-busy', 'false'); }
}
async function init() {
  window.parkingMap.init();
  const [options, coverageRows] = await Promise.all([query('catalog'), query('coverage')]);
  catalog = options;
  const districtLabels = new Map(catalog.filter(row => value(row, 'kind') === 'district').map(row => [value(row, 'value'), value(row, 'label')]));
  const addedFacilities = new Set();
  for (const row of catalog) {
    const kind = value(row, 'kind');
    if (kind === 'parking' && !addedFacilities.has(value(row, 'value'))) {
      addedFacilities.add(value(row, 'value'));
      const districts = catalog.filter(record => value(record, 'kind') === 'parking' && value(record, 'value') === value(row, 'value'))
        .map(record => districtLabels.get(value(record, 'other'))).join(' / ');
      $('parking').append(new Option(`${value(row, 'label')} / ${districts}`, value(row, 'value')));
    }
    if (kind === 'district') $('district').append(new Option(value(row, 'label'), value(row, 'value')));
    if (kind === 'type') $('type').append(new Option(value(row, 'label'), value(row, 'value')));
  }
  for (const year of [...new Set(catalog.filter(row => value(row, 'kind') === 'period').map(row => value(row, 'value')))].sort().reverse()) {
    $('year').append(new Option(year, year));
  }
  months.forEach((name, i) => $('month').append(new Option(name, String(i + 1))));
  $('month').value = String(new Date().getMonth() + 1);
  const row = coverageRows[0];
  if (!row) throw new Error('No source coverage information returned.');
  $('coverage').textContent = `${value(row, 'facilities')} facilities; ${value(row, 'districts')} represented districts; ${value(row, 'observations')} observations. ${value(row, 'invalidOverall')} flagged overall and ${value(row, 'invalidDaytime')} flagged daytime percentages. Wikidata retrieved ${value(row, 'retrieved')}; ${value(row, 'edges')} directed border triples. Geography retrieved ${value(row, 'geographyRetrieved') || 'unknown'}; ${value(row, 'mapped')} verified facility locations. Invalid values remain in history but are excluded from means.`;
  if (Number(value(row, 'mapped')) === 0 || !value(row, 'geographyRetrieved')) {
    geographyWarning = 'Verified geography graph is missing or empty. Stop services and rerun setup.ps1. Parking comparisons remain usable without map pins.';
  }
  for (const id of ['parking', 'month', 'year', 'metric', 'district', 'type', 'search']) $(id).disabled = false;
  $('filters').addEventListener('submit', event => { event.preventDefault(); load().catch(showError); });
  $('parking').addEventListener('change', () => { updateOrigin(); load().catch(showError); });
  for (const id of ['originDistrict', 'month', 'year', 'metric', 'district', 'type']) {
    $(id).addEventListener('change', () => load().catch(showError));
  }
  await load();
}
init().catch(showError);

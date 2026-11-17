import { select } from "./sparql.js";
import { delayClass, stationName, textElement, toQid, toSparqlIri } from "./common.js";

// Side panel with the details of one station: KG data first, Wikidata enrichment afterwards.
// Every value from the KG or Wikidata is inserted with textContent.

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

function detailsQuery(stationIri) {
  return `
    SELECT ?eva ?category ?zip ?city ?state ?wikidata WHERE {
        ${stationIri} dbd:evaNumber ?eva ;
                      dbd:postalCode ?zip ;
                      dbd:inCity ?cityResource .
        ?cityResource rdfs:label ?city ;
                      dbd:inState/rdfs:label ?state .
        OPTIONAL { ${stationIri} dbd:stationCategory ?category }
        OPTIONAL {
            ${stationIri} owl:sameAs ?wikidata .
            FILTER(CONTAINS(STR(?wikidata), "wikidata.org/entity/"))
        }
    }
    LIMIT 1`;
}

// First stops of a train have no planned arrival, last stops may have no planned departure.
function stopsQuery(stationIri) {
  return `
    SELECT ?stop ?line ?plannedArrival ?plannedDeparture ?arrivalDelay ?departureDelay
           ?arrivalStatus ?departureStatus ?info
    WHERE {
        ?stop dbd:atStation ${stationIri} ;
              dbd:arrivalDelayMinutes ?arrivalDelay ;
              dbd:departureDelayMinutes ?departureDelay .
        OPTIONAL { ?stop dbd:lineLabel ?line }
        OPTIONAL { ?stop dbd:plannedArrival ?plannedArrival }
        OPTIONAL { ?stop dbd:plannedDeparture ?plannedDeparture }
        OPTIONAL { ?stop dbd:arrivalStatus ?arrivalStatus }
        OPTIONAL { ?stop dbd:departureStatus ?departureStatus }
        OPTIONAL { ?stop dbd:information ?info }
    }
    ORDER BY COALESCE(?plannedArrival, ?plannedDeparture) ?stop`;
}

export function createStationDetail(panel, { onVisibilityChange = () => {} } = {}) {
  // Increased on every open/close, so a slow response for a previous station is dropped.
  let request = 0;

  function close() {
    request++;
    if (panel.hidden) return;
    panel.hidden = true;
    panel.replaceChildren();
    onVisibilityChange(false);
  }

  async function open(station) {
    const current = ++request;
    const stationIri = toSparqlIri(station.station);

    panel.replaceChildren(header(station.label, close), textElement("p", "Loading…", "detail-muted"));
    if (panel.hidden) {
      panel.hidden = false;
      onVisibilityChange(true);
    }

    let details, stops;
    try {
      const [detailsResult, stopsResult] = await Promise.all([
        select(detailsQuery(stationIri)),
        select(stopsQuery(stationIri)),
      ]);
      details = detailsResult.rows[0] ?? {};
      stops = stopsResult.rows;
    } catch (error) {
      console.error(error);
      if (current !== request) return;
      panel.replaceChildren(header(station.label, close),
        textElement("p", "Could not load the station details.", "status error"));
      return;
    }
    if (current !== request) return;

    const wikidataSection = document.createElement("section");
    panel.replaceChildren(
      header(station.label, close, details),
      facts(details),
      summary(stops),
      lines(stops),
      stopTable(stops),
      wikidataSection,
    );

    const qid = toQid(details.wikidata);
    if (qid) {
      fillWikidata(wikidataSection, qid, stationName(station.label), () => current === request);
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return { open, close };
}

function header(label, onClose, details) {
  const container = document.createElement("header");
  container.className = "detail-header";
  const closeButton = textElement("button", "×", "detail-close");
  closeButton.type = "button";
  closeButton.title = "Close";
  closeButton.setAttribute("aria-label", "Close station details");
  closeButton.addEventListener("click", onClose);
  container.append(closeButton, textElement("h2", stationName(label)));
  if (details?.city) {
    container.append(textElement("p", `${details.city}, ${details.state}`, "detail-muted"));
  }
  return container;
}

// The station category is DB's price class (Preisklasse) 1–7. DB derives it from a score for
// infrastructure (40 %), traffic importance (40 %) and facilities (20 %); 1 = largest stations.
// DB publishes no names for the classes, so these short descriptions are our own.
const CATEGORY_LABELS = {
  1: "Major hub",
  2: "Large station",
  3: "Medium-sized station",
  4: "Regional station",
  5: "Small station",
  6: "Local stop",
  7: "Basic halt",
};
const CATEGORY_HINT = "DB station price class (Preisklasse) from 1 (largest) to 7 (smallest), "
  + "based on infrastructure, traffic importance and facilities. The description is our own summary.";

function categoryValue(category) {
  const label = CATEGORY_LABELS[category];
  const value = textElement("dd", label ? `${label} (${category})` : category);
  value.title = CATEGORY_HINT;
  return value;
}

function facts({ eva, category, zip }) {
  const list = document.createElement("dl");
  list.className = "detail-facts";
  if (eva !== undefined) list.append(textElement("dt", "EVA number"), textElement("dd", eva));
  if (category !== undefined) list.append(textElement("dt", "Station category"), categoryValue(category));
  if (zip !== undefined) list.append(textElement("dt", "Postal code"), textElement("dd", zip));
  return list;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(part, total) {
  return `${Math.round((100 * part) / total)} % (${part} of ${total})`;
}

function summary(stops) {
  const section = document.createElement("section");
  section.append(textElement("h3", "Punctuality"));
  if (stops.length === 0) {
    section.append(textElement("p", "No train stops recorded.", "detail-muted"));
    return section;
  }

  const arrivalDelays = stops.map((stop) => Number(stop.arrivalDelay));
  const departureDelays = stops.map((stop) => Number(stop.departureDelay));
  const onTime = (key) => stops.filter((stop) => stop[key] === "on_time").length;
  const avgArrival = average(arrivalDelays);

  const list = document.createElement("dl");
  list.className = "detail-facts";
  const avgArrivalValue = textElement("dd", `${avgArrival.toFixed(1)} min`);
  avgArrivalValue.prepend(swatch(delayClass(avgArrival).color));
  list.append(
    textElement("dt", "Avg. arrival delay"), avgArrivalValue,
    textElement("dt", "Avg. departure delay"), textElement("dd", `${average(departureDelays).toFixed(1)} min`),
    textElement("dt", "Max. delay"), textElement("dd", `${Math.max(...arrivalDelays, ...departureDelays)} min`),
    textElement("dt", "On-time arrivals"), textElement("dd", percent(onTime("arrivalStatus"), stops.length)),
    textElement("dt", "On-time departures"), textElement("dd", percent(onTime("departureStatus"), stops.length)),
  );
  const stopsText = stops.length === 1 ? "1 train stop" : `${stops.length} train stops`;
  section.append(list,
    textElement("p", `Based on ${stopsText} on 8 July 2024. On time means at most 5 min late.`, "detail-note"));
  return section;
}

function lines(stops) {
  const section = document.createElement("section");
  const labels = [...new Set(stops.map((stop) => stop.line).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (labels.length === 0) return section;
  section.append(textElement("h3", "Lines"));
  const chips = document.createElement("div");
  chips.className = "detail-chips";
  chips.append(...labels.map((label) => textElement("span", label, "chip")));
  section.append(chips);
  return section;
}

// "2024-07-08T00:03:00" → "00:03"
function clockTime(dateTime) {
  return dateTime?.slice(11, 16);
}

function timeCell(planned, delayMinutes, emptyText) {
  const cell = document.createElement("td");
  if (!planned) {
    cell.append(textElement("span", emptyText, "detail-muted"));
    return cell;
  }
  cell.append(clockTime(planned));
  if (delayMinutes > 0) {
    const delay = textElement("span", `+${delayMinutes}`, "delay");
    delay.style.background = delayClass(delayMinutes).color;
    cell.append(" ", delay);
  }
  return cell;
}

function stopTable(stops) {
  const section = document.createElement("section");
  if (stops.length === 0) return section;
  section.append(textElement("h3", "Train stops"));

  const table = document.createElement("table");
  table.className = "detail-stops";
  const headRow = document.createElement("tr");
  headRow.append(...["Line", "Arrival", "Departure"].map((text) => textElement("th", text)));
  table.createTHead().append(headRow);

  const body = table.createTBody();
  for (const stop of stops) {
    const row = document.createElement("tr");
    row.append(
      textElement("td", stop.line ?? "–"),
      timeCell(stop.plannedArrival, Number(stop.arrivalDelay), "starts here"),
      timeCell(stop.plannedDeparture, Number(stop.departureDelay), "ends here"),
    );
    body.append(row);
    if (stop.info) {
      row.className = "has-info";
      const infoRow = document.createElement("tr");
      infoRow.className = "info-row";
      const cell = textElement("td", stop.info);
      cell.colSpan = 3;
      infoRow.append(cell);
      body.append(infoRow);
    }
  }
  section.append(table);
  return section;
}

function swatch(color) {
  const element = textElement("span", "", "legend-swatch");
  element.style.background = color;
  return element;
}

// Image (P18), opening date (P1619) and number of platform tracks (P1103) from Wikidata.
async function fillWikidata(section, qid, name, isCurrent) {
  const link = textElement("a", qid);
  link.href = `https://www.wikidata.org/wiki/${qid}`;
  link.target = "_blank";
  link.rel = "noopener";

  const heading = textElement("h3", "Wikidata");
  const list = document.createElement("dl");
  list.className = "detail-facts";
  const linkValue = document.createElement("dd");
  linkValue.append(link);
  list.append(textElement("dt", "Entity"), linkValue);
  section.append(heading, list);

  let claims;
  try {
    const params = new URLSearchParams({
      action: "wbgetentities", ids: qid, props: "claims", format: "json", origin: "*",
    });
    const response = await fetch(`${WIKIDATA_API}?${params}`);
    if (!response.ok) throw new Error(`Wikidata returned ${response.status}`);
    claims = (await response.json()).entities?.[qid]?.claims ?? {};
  } catch (error) {
    console.error(error);
    if (isCurrent()) section.append(textElement("p", "Could not load data from Wikidata.", "detail-muted"));
    return;
  }
  if (!isCurrent()) return;

  const value = (property) => claims[property]?.find((claim) => claim.rank === "preferred")?.mainsnak.datavalue?.value
    ?? claims[property]?.[0]?.mainsnak.datavalue?.value;

  const opened = value("P1619");
  if (opened?.time) list.append(textElement("dt", "Opened"), textElement("dd", formatWikidataTime(opened)));
  const tracks = value("P1103");
  if (tracks?.amount) list.append(textElement("dt", "Platform tracks"), textElement("dd", String(Number(tracks.amount))));

  const file = value("P18");
  if (typeof file === "string") {
    const fileName = file.replaceAll(" ", "_");
    const figure = document.createElement("figure");
    figure.className = "detail-image";
    const image = document.createElement("img");
    image.src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=400`;
    image.alt = name;
    image.loading = "lazy";
    const source = textElement("a", "Image: Wikimedia Commons");
    source.href = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`;
    source.target = "_blank";
    source.rel = "noopener";
    const caption = document.createElement("figcaption");
    caption.append(source);
    figure.append(image, caption);
    section.insertBefore(figure, list);
  }
}

// Wikidata times look like "+1841-00-00T00:00:00Z"; precision 9 = year, 10 = month, 11 = day.
function formatWikidataTime({ time, precision }) {
  const [, year, month, day] = time.match(/^[+-]?(\d+)-(\d\d)-(\d\d)/) ?? [];
  if (!year) return time;
  if (precision >= 11) return `${Number(day)}.${Number(month)}.${Number(year)}`;
  if (precision === 10) return `${Number(month)}/${Number(year)}`;
  return String(Number(year));
}

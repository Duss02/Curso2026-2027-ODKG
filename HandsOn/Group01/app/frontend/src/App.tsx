import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { filterParams } from "./api";
import { AccidentDetails } from "./components/AccidentDetails";
import { Icon } from "./components/Icon";
import { Statistics } from "./components/Statistics";
import { Filters } from "./components/Filters";
import {
  datasetBounds,
  DEFAULT_FILTERS,
  HOTSPOT_BANDS,
  MAX_LOADED,
  number,
  SEVERITIES,
  SEVERITY_COLORS,
} from "./data";
import { useAccidents } from "./hooks/useAccidents";
import type { Accident, AccidentFilters, MapMode } from "./types";

const AccidentMap = lazy(() => import("./components/AccidentMap"));

export default function App() {
  const [filters, setFilters] = useState<AccidentFilters>(DEFAULT_FILTERS);
  const [mode, setMode] = useState<MapMode>("markers");
  const data = useAccidents(filters, mode);
  const [selected, setSelected] = useState<string | null>(null);
  const selectAccident = useCallback(
    (accident: Accident) => setSelected(accident.id),
    [],
  );
  const closeDetails = useCallback(() => setSelected(null), []);
  const bounds = useMemo(() => datasetBounds(data.metadata), [data.metadata]);
  const showMap =
    data.contextReady &&
    data.total > 0 &&
    bounds &&
    (!data.error || data.ready);
  const filtered =
    filters.severities.length < 4 ||
    !!filters.start_date ||
    !!filters.end_date ||
    !!filters.street;
  const period =
    data.metadata?.start_time && data.metadata?.end_time
      ? `${data.metadata.start_time.slice(0, 10)} — ${data.metadata.end_time.slice(0, 10)}`
      : "Dataset period unavailable";
  const reload = () => {
    setSelected(null);
    data.reload();
  };
  const changeMode = (next: MapMode) => {
    if (next !== mode) {
      setSelected(null);
      setMode(next);
    }
  };
  const applyFilters = (next: AccidentFilters) => {
    if (filterParams(next).toString() !== filterParams(filters).toString()) {
      setSelected(null);
      setFilters(next);
    }
  };

  return (
    <>
      <a href="#map" className="skip-link">
        Skip to accident map
      </a>
      <header className="app-header">
        <div className="page-width flex items-center justify-between gap-5 py-3">
          <a
            href="#"
            className="flex items-center gap-3 text-inherit no-underline"
            aria-label="Traffic Accident Explorer home"
          >
            <span className="brand-mark">
              <Icon name="map" className="size-6" />
            </span>
            <div>
              <h1 className="brand-title">Traffic Accident Explorer</h1>
              <p className="brand-subtitle">
                Exploring historical traffic accidents in New York City.
              </p>
            </div>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <a className="nav-link nav-active" href="#map">
              Map
            </a>
            <a className="nav-link" href="#about">
              About
            </a>
          </nav>
        </div>
      </header>

      <main className="page-width py-5">
        <section className="mb-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3 text-teal-800">
              Group01 <span className="mx-2 text-slate-300">/</span> Open Data &
              Knowledge Graphs
            </p>
            <h2 className="hero-title">A closer look at New York’s roads.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              Explore the records. Discover the places. A geographic view of
              historical traffic accidents.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-xs text-slate-500">
            <span className="period-tag">{period}</span>
            <span className="flex items-center gap-2" role="status">
              <span
                className={`size-1.5 rounded-full ${data.error ? "bg-rose-500" : data.ready ? "bg-teal-600" : "bg-amber-500"}`}
              />
              {data.error
                ? "Connection needs attention"
                : data.ready
                  ? "GraphDB connected · checked on load"
                  : "Connecting to GraphDB…"}
            </span>
          </div>
        </section>

        <Statistics
          total={data.total}
          loaded={data.items.length}
          statistics={data.statistics}
          ready={data.contextReady}
          filtered={filtered}
        />
        <Filters
          metadata={data.metadata}
          busy={data.loading}
          onApply={applyFilters}
        />

        {data.error && (
          <div role="alert" className="error-banner">
            <div>
              <p className="font-semibold">
                {data.ready
                  ? "Additional results could not be loaded"
                  : "Unable to connect to accident data"}
              </p>
              <p className="mt-1 text-sm">{data.error}</p>
              {data.ready && (
                <p className="mt-1 text-xs">
                  Previously loaded markers remain on the map.
                </p>
              )}
            </div>
            <button
              className="secondary-button shrink-0"
              disabled={data.loading || data.loadingMore}
              onClick={data.ready ? data.loadMore : reload}
            >
              Retry
            </button>
          </div>
        )}

        <section
          id="map"
          aria-labelledby="map-heading"
          className="dashboard-panel scroll-mt-5"
        >
          <div className="panel-heading">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="map" className="text-teal-700" />
                <h2 id="map-heading" className="text-lg font-semibold">
                  {mode === "markers"
                    ? "Accident map"
                    : "Accident concentration"}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {mode === "markers"
                  ? "Zoom into a cluster, then select a numbered point."
                  : "All filtered accidents · Count per 0.005° cell · No sampling"}
              </p>
            </div>
            <div className="map-heading-controls">
              <div
                className="mode-toggle"
                role="group"
                aria-label="Map visualization"
              >
                <button
                  aria-pressed={mode === "markers"}
                  onClick={() => changeMode("markers")}
                >
                  Accident markers
                </button>
                <button
                  aria-pressed={mode === "hotspots"}
                  onClick={() => changeMode("hotspots")}
                >
                  Concentration grid
                </button>
              </div>
              <button
                className="secondary-button"
                onClick={reload}
                disabled={data.loading}
              >
                Refresh data
              </button>
            </div>
          </div>
          <div className="map-grid" data-mode={mode}>
            <div className="min-w-0">
              {showMap ? (
                <div className="map-stage">
                  <Suspense
                    fallback={
                      <div className="map-placeholder" role="status">
                        <span className="spinner" />
                        Preparing the map…
                      </div>
                    }
                  >
                    <AccidentMap
                      accidents={data.items}
                      bounds={bounds!}
                      onSelect={selectAccident}
                      mode={mode}
                      hotspots={data.hotspots}
                    />
                  </Suspense>
                  {data.loading && (
                    <p className="map-loading" role="status">
                      <span className="spinner spinner-small" />
                      {mode === "markers"
                        ? "Loading accident markers…"
                        : "Loading concentration grid…"}
                    </p>
                  )}
                </div>
              ) : data.loading ? (
                <div className="map-placeholder" role="status">
                  <span className="spinner" />
                  <h3>Finding the story in the data…</h3>
                  <p>Requesting accident records from GraphDB.</p>
                </div>
              ) : (
                <div className="map-placeholder">
                  <Icon name="map" className="size-10 text-teal-700" />
                  <h3>
                    {data.ready
                      ? "No accidents to display"
                      : "Your map will appear here"}
                  </h3>
                  <p>
                    {data.ready
                      ? "No recorded accidents match these filters. Try a wider range or reset the filters."
                      : "Connect to FastAPI and GraphDB, then retry."}
                  </p>
                </div>
              )}
              {mode === "hotspots" && (
                <div
                  className="hotspot-legend"
                  aria-label="Hotspot count legend"
                >
                  <span className="eyebrow">Accidents per cell</span>
                  {HOTSPOT_BANDS.map((band) => (
                    <span key={band.min}>
                      <i style={{ background: band.color }} />
                      {band.label}
                    </span>
                  ))}
                  <p>
                    About 556 × 420 m in New York. Counts, not a prediction of
                    risk.
                  </p>
                </div>
              )}
              <div className="map-legend" aria-label="Severity legend">
                <span className="eyebrow">Severity</span>
                {SEVERITIES.map((level) => (
                  <span
                    className="flex items-center gap-1.5 text-xs"
                    key={level}
                  >
                    <span
                      className="severity-dot"
                      style={{ background: SEVERITY_COLORS[level] }}
                    />
                    {level}
                    {level === 1 ? " · Low" : level === 4 ? " · High" : ""}
                  </span>
                ))}
                <span className="legend-note">
                  Dataset scale, not injury counts
                </span>
              </div>
            </div>
            <aside className="map-sidebar" aria-label="Accident inspector">
              {selected && mode === "markers" ? (
                <AccidentDetails
                  key={selected}
                  accidentId={selected}
                  onClose={closeDetails}
                />
              ) : (
                <>
                  <div className="inspector-intro">
                    <span className="inspector-icon">
                      <Icon name="pin" className="size-6" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">
                      {mode === "markers"
                        ? "Look beyond the point."
                        : "The complete concentration picture."}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {mode === "markers"
                        ? "Select an accident on the map to explore its time, street and RDF identity."
                        : `The grid represents all ${number(data.total)} matching accidents, including those without streets. Darker cells contain more records.`}
                    </p>
                    {mode === "hotspots" && data.hotspots && (
                      <p className="mt-4 text-sm font-semibold text-teal-800">
                        {number(data.hotspots.cells.length)} occupied cells ·
                        Maximum {number(data.hotspots.max_count)} per cell
                      </p>
                    )}
                  </div>
                  {mode === "markers" && data.items.length > 0 && (
                    <div className="preview-list">
                      <p className="eyebrow mb-3">Explore loaded records</p>
                      {data.items.slice(0, 4).map((item) => (
                        <button
                          className="preview-item"
                          key={item.uri}
                          onClick={() => selectAccident(item)}
                        >
                          <span
                            className="severity-number"
                            style={{
                              color: SEVERITY_COLORS[item.severity],
                              background: `${SEVERITY_COLORS[item.severity]}12`,
                            }}
                          >
                            {item.severity}
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm font-medium">
                              {item.street_name?.trim() || "Unknown street"}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                              {item.id}
                            </span>
                          </span>
                          <Icon
                            name="arrow"
                            className="size-4 text-slate-400"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </aside>
          </div>
          <div className="load-bar">
            <div aria-live="polite">
              <p className="text-sm font-medium">
                {data.ready
                  ? mode === "hotspots"
                    ? `All ${number(data.total)} matching accidents represented`
                    : `${number(data.items.length)} of ${number(data.total)} accidents loaded`
                  : "Waiting for accident data"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {mode === "hotspots"
                  ? "Complete filtered population · No sampling or marker-page truncation"
                  : data.capped
                    ? `Browser limit reached (${number(MAX_LOADED)} records). Use the concentration grid for all matches.`
                    : `Pages of 500 · Only loaded records appear on the map · ${filtered ? "Filters applied" : "No filters applied"}`}
              </p>
            </div>
            {mode === "markers" && (
              <button
                className="primary-button"
                onClick={data.loadMore}
                disabled={!data.canLoadMore || data.loadingMore || data.loading}
              >
                {data.loadingMore ? (
                  <>
                    <span className="spinner spinner-small" />
                    Loading records…
                  </>
                ) : (
                  <>
                    {data.capped
                      ? "Loading limit reached"
                      : data.ready && !data.canLoadMore
                        ? "All available results loaded"
                        : "Load 500 more"}
                    <Icon name="arrow" className="size-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        <section
          id="about"
          className="about-section scroll-mt-5"
          aria-labelledby="about-heading"
        >
          <div>
            <p className="eyebrow text-teal-800">
              Connected data, clearer context
            </p>
            <h2
              id="about-heading"
              className="mt-3 text-xl font-semibold tracking-tight"
            >
              A map backed by a knowledge graph.
            </h2>
          </div>
          <div className="text-sm leading-7 text-slate-500">
            <p>
              Every record comes from the Group01 RDF dataset, queried through
              FastAPI and GraphDB. Markers load progressively; the concentration
              grid includes all filtered matches. The dataset is a subset of New
              York, not complete coverage of every NYC borough. Counts are not
              exposure-adjusted risk.
            </p>
            <p className="mt-3">
              The historical dataset ends in March 2023. Street names may be
              missing; original identifiers and RDF resource URIs are preserved.
              Map clusters count nearby loaded points and do not represent
              severity. This application is intended for desktop browsers.
            </p>
            <p className="mt-3 text-xs">
              Source: US Accidents by Sobhan Moosavi et al. · Dataset license
              documented by the group: CC BY-NC-SA 4.0.{" "}
              <a
                className="text-teal-800 underline underline-offset-4"
                href="https://www.kaggle.com/datasets/sobhanmoosavi/us-accidents"
                target="_blank"
                rel="noreferrer"
              >
                Original dataset ↗
              </a>
            </p>
          </div>
        </section>
      </main>
      <footer className="page-width flex flex-wrap justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-500">
        <span>Group01 · Open Data and Knowledge Graphs</span>
        <span>Historical data. Open exploration.</span>
      </footer>
    </>
  );
}

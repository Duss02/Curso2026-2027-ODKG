import { useCallback, useEffect, useRef, useState } from "react";
import { api, filterParams } from "../api";
import {
  DEFAULT_FILTERS,
  MAX_LOADED,
  mergeAccidents,
  PAGE_SIZE,
} from "../data";
import type {
  Accident,
  AccidentFilters,
  DatasetMetadata,
  HotspotResult,
  MapMode,
  SeverityCount,
} from "../types";

type Context = {
  key: string;
  statistics: SeverityCount[];
  metadata: DatasetMetadata;
};
type Markers = {
  key: string;
  items: Accident[];
  offset: number;
  exhausted: boolean;
};
type Grid = { key: string; data: HotspotResult };

// Switching views reuses only the current filter population's loaded layers.
// Hotspots always come from GraphDB aggregation, never paginated marker data.
export function useAccidents(
  filters: AccidentFilters = DEFAULT_FILTERS,
  mode: MapMode = "markers",
) {
  const key = filterParams(filters).toString();
  const [context, setContext] = useState<Context | null>(null);
  const [markers, setMarkers] = useState<Markers | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [layerLoading, setLayerLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const metadataCache = useRef<DatasetMetadata | null>(null);
  const pageAbort = useRef<AbortController | null>(null);
  const pageBusy = useRef(false);

  useEffect(() => {
    const abort = new AbortController();
    pageAbort.current?.abort();
    pageBusy.current = false;
    setLoadingMore(false);
    setContextLoading(true);
    setContext(null);
    setMarkers(null);
    setGrid(null);
    setError(null);
    // Unfiltered metadata is reused until Refresh/Retry. Each filter change
    // still queries GraphDB for new statistics and the requested layer.
    const metadata = metadataCache.current
      ? Promise.resolve(metadataCache.current)
      : Promise.all([api.health(abort.signal), api.dataset(abort.signal)]).then(
          ([health, dataset]) => {
            if (health.status !== "ok" || health.graphdb !== "reachable")
              throw new Error("GraphDB health check failed.");
            return dataset;
          },
        );
    Promise.all([api.severity(abort.signal, filters), metadata])
      .then(([statistics, dataset]) => {
        if (abort.signal.aborted) return;
        metadataCache.current = dataset;
        setContext({ key, statistics, metadata: dataset });
      })
      .catch((cause: unknown) => {
        if (!abort.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load accident data.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setContextLoading(false);
      });
    return () => {
      abort.abort();
      pageAbort.current?.abort();
    };
  }, [filters, revision, key]);

  useEffect(() => {
    pageAbort.current?.abort();
    pageBusy.current = false;
    setLoadingMore(false);
    setLayerLoading(false);
    if (!context || context.key !== key) return;
    setError(null);
    if (mode === "markers" ? markers?.key === key : grid?.key === key) return;
    const abort = new AbortController();
    setLayerLoading(true);
    const load = async () => {
      if (mode === "markers") {
        const page = await api.accidents(PAGE_SIZE, 0, abort.signal, filters);
        if (!abort.signal.aborted)
          setMarkers({
            key,
            items: mergeAccidents([], page.items),
            offset: page.items.length,
            exhausted: page.items.length < PAGE_SIZE,
          });
      } else {
        const data = await api.hotspots(abort.signal, filters);
        const total = context.statistics.reduce(
          (sum, row) => sum + row.count,
          0,
        );
        if (data.total !== total)
          throw new Error(
            "GraphDB counts changed between requests. Refresh data to synchronize the view.",
          );
        if (!abort.signal.aborted) setGrid({ key, data });
      }
    };
    load()
      .catch((cause: unknown) => {
        if (!abort.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load the map layer.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setLayerLoading(false);
      });
    return () => abort.abort();
    // Payloads are not dependencies: completing a page must not restart its
    // request. The latest caches are read when mode or context changes.
  }, [mode, context, filters, key]);

  const contextReady = context?.key === key;
  const items = markers?.key === key ? markers.items : [];
  const hotspots = grid?.key === key ? grid.data : null;
  const statistics = contextReady ? context.statistics : [];
  const total = statistics.reduce((sum, row) => sum + row.count, 0);
  const ready =
    contextReady &&
    (mode === "markers" ? markers?.key === key : hotspots !== null);
  const canLoadMore =
    mode === "markers" &&
    ready &&
    !!markers &&
    !markers.exhausted &&
    markers.offset < total &&
    items.length < MAX_LOADED;

  const loadMore = useCallback(async () => {
    if (pageBusy.current || !canLoadMore || !markers) return;
    pageBusy.current = true;
    const abort = new AbortController();
    pageAbort.current = abort;
    setLoadingMore(true);
    setError(null);
    try {
      const limit = Math.min(PAGE_SIZE, MAX_LOADED - markers.items.length);
      const page = await api.accidents(
        limit,
        markers.offset,
        abort.signal,
        filters,
      );
      if (abort.signal.aborted) return;
      setMarkers({
        key,
        items: mergeAccidents(markers.items, page.items),
        offset: markers.offset + page.items.length,
        exhausted: page.items.length < limit,
      });
    } catch (cause) {
      if (!abort.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load more accidents.",
        );
    } finally {
      if (!abort.signal.aborted) {
        setLoadingMore(false);
        pageBusy.current = false;
      }
    }
  }, [canLoadMore, markers, filters, key]);

  const reload = useCallback(() => {
    metadataCache.current = null;
    setRevision((value) => value + 1);
  }, []);
  return {
    items,
    hotspots,
    statistics,
    total,
    ready,
    contextReady,
    metadata: contextReady ? context.metadata : metadataCache.current,
    loading:
      contextLoading || layerLoading || (contextReady && !ready && !error),
    loadingMore,
    error,
    canLoadMore,
    loadMore,
    reload,
    capped: items.length >= MAX_LOADED && items.length < total,
  };
}
